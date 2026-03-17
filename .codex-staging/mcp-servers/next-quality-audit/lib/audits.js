const fs = require('fs');
const path = require('path');
const { DEFAULT_TIMEOUT_MS, getLocalBin, runLocalTool, runPackageManagerCommand, runPackageManagerScript, tailText } = require('./exec');
const { inspectProject, listFiles, readText, relative } = require('./project-intel');
const { toMarkdown } = require('./report');

const defaults = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'defaults.json'), 'utf8')
);

function cleanVersion(input) {
  return String(input || '').replace(/^[^\d]*/, '').split(' ').shift();
}

function parseSemver(input) {
  const cleaned = cleanVersion(input);
  const match = cleaned.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function diffVersion(current, target) {
  const left = parseSemver(current);
  const right = parseSemver(target);
  if (!left || !right) {
    return 'unknown';
  }

  if (left.major !== right.major) {
    return 'major';
  }

  if (left.minor !== right.minor) {
    return 'minor';
  }

  if (left.patch !== right.patch) {
    return 'patch';
  }

  return 'none';
}

function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function summarizeCommand(result) {
  return {
    ok: result.ok,
    code: result.code,
    command: result.command,
    durationMs: result.durationMs,
    timedOut: result.timedOut,
    stdoutTail: tailText(result.stdout, 20),
    stderrTail: tailText(result.stderr, 20)
  };
}

function isProtectedFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return defaults.protectedPathPatterns.some((pattern) => {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp('^' + escaped + '$', 'i').test(normalized);
  });
}

function touchesProtectedArea(text) {
  return defaults.protectedAreaKeywords.some((keyword) => new RegExp(keyword, 'i').test(text));
}

function normalizeKnipArray(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) => {
    if (typeof item === 'string') {
      return { name: item };
    }

    return item;
  });
}

function asInstallCommand(packageManager, packages, dev) {
  if (!packages || packages.length === 0) {
    return null;
  }

  if (packageManager === 'pnpm') {
    return 'pnpm add ' + (dev ? '-D ' : '') + packages.join(' ');
  }

  if (packageManager === 'yarn') {
    return 'yarn add ' + (dev ? '-D ' : '') + packages.join(' ');
  }

  return 'npm install ' + (dev ? '-D ' : '') + packages.join(' ');
}

async function analyzeUnusedCode(options) {
  const project = await inspectProject(options.projectPath);
  const packageManager = options.packageManager || project.packageManager;
  const knipInstalled = Boolean(getLocalBin(project.projectPath, 'knip')) || Boolean(project.dependencies.knip) || Boolean(project.devDependencies.knip);
  const installCommand = asInstallCommand(packageManager, ['knip'], true);

  if (!knipInstalled) {
    return {
      status: 'missing-tool',
      tool: 'knip',
      installCommand,
      findings: {
        dependencies: [],
        files: [],
        exports: [],
        issues: []
      },
      commandsUsed: []
    };
  }

  const commandResult = await runLocalTool(project.projectPath, 'knip', ['--reporter', 'json'], packageManager, {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const parsed = safeJsonParse(commandResult.stdout) || {};
  const hasJson = typeof parsed === 'object' && parsed !== null;

  return {
    status: hasJson ? 'ok' : 'command-failed',
    tool: 'knip',
    installCommand,
    raw: parsed,
    findings: {
      dependencies: normalizeKnipArray(parsed.dependencies),
      files: normalizeKnipArray(parsed.files).map((item) => ({ file: item.file || item.name || item.path || String(item) })),
      exports: normalizeKnipArray(parsed.exports).map((item) => ({ file: item.file || 'unknown', name: item.name || item.export || 'unknown' })),
      issues: normalizeKnipArray(parsed.issues)
    },
    command: summarizeCommand(commandResult),
    commandsUsed: [commandResult.command]
  };
}

async function analyzeCss(options) {
  const project = await inspectProject(options.projectPath);
  const cssFiles = await listFiles(project.projectPath, ['src/**/*.{css,scss,sass}', 'app/**/*.{css,scss,sass}', 'styles/**/*.{css,scss,sass}', 'public/**/*.{css,scss,sass}']);
  const sizes = cssFiles.map((filePath) => ({
    file: relative(project.projectPath, filePath),
    bytes: fs.statSync(filePath).size,
    global: !/\.module\.(css|scss|sass)$/i.test(filePath),
    legacy: /(^|\/)(public\/assets|styles|src\/app\/globals\.(css|scss|sass)|app\/globals\.(css|scss|sass))/i.test(relative(project.projectPath, filePath))
  }));

  sizes.sort((left, right) => right.bytes - left.bytes);
  const largeCssFiles = sizes.filter((item) => item.bytes >= defaults.cssLargeFileThresholdBytes);
  const riskyCssCleanupCandidates = sizes
    .filter((item) => item.global)
    .slice(0, 15)
    .map((item) => ({
      file: item.file,
      bytes: item.bytes,
      legacy: item.legacy,
      reason: item.bytes >= defaults.cssLargeFileThresholdBytes
        ? 'large global stylesheet'
        : item.legacy
          ? 'legacy or global stylesheet should be reviewed before cleanup'
          : 'global stylesheet may contain dynamic selectors'
    }));

  return {
    status: 'ok',
    styling: project.styling,
    largeCssFiles,
    riskyCssCleanupCandidates,
    purgeCssSuggested: project.styling.globalCss,
    purgeCssScope: project.styling.globalCss ? 'legacy-and-global-css-only' : 'not-suggested',
    warnings: project.styling.tailwind ? ['Tailwind-like class patterns detected; safelist dynamic classes before any PurgeCSS run.'] : [],
    commandsUsed: []
  };
}

function readSizedFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter((name) => name.endsWith(extension))
    .map((name) => ({
      file: name,
      bytes: fs.statSync(path.join(dirPath, name)).size
    }))
    .sort((left, right) => right.bytes - left.bytes);
}

function detectHeavyImports(project, clientComponent) {
  const fullPath = path.join(project.projectPath, clientComponent.file);
  const text = readText(fullPath);
  return Object.keys(defaults.heavyClientPackages).filter((packageName) => {
    return text.includes("'" + packageName + "'")
      || text.includes('"' + packageName + '"')
      || text.includes("'" + packageName + '/')
      || text.includes('"' + packageName + '/');
  });
}

async function analyzeBundle(options) {
  const project = await inspectProject(options.projectPath);
  const commandsUsed = [];
  const buildRequested = options.runBuild !== false;
  let build = null;

  if (buildRequested && project.scripts.build) {
    build = await runPackageManagerScript(
      project.projectPath,
      project.packageManager,
      'build',
      [],
      {},
      options.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    commandsUsed.push(build.command);
  }

  const chunksDir = path.join(project.projectPath, '.next', 'static', 'chunks');
  const cssDir = path.join(project.projectPath, '.next', 'static', 'css');
  const chunkFiles = readSizedFiles(chunksDir, '.js');
  const cssFiles = readSizedFiles(cssDir, '.css');

  const largeClientComponents = project.clientComponents
    .map((clientComponent) => ({
      file: clientComponent.file,
      bytes: clientComponent.bytes,
      packages: detectHeavyImports(project, clientComponent)
    }))
    .filter((item) => item.bytes >= defaults.clientComponentRiskThresholdBytes || item.packages.length > 0)
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 15);

  const buildManifestPath = path.join(project.projectPath, '.next', 'build-manifest.json');
  const buildManifest = fs.existsSync(buildManifestPath) ? safeJsonParse(fs.readFileSync(buildManifestPath, 'utf8')) : null;

  return {
    status: build && !build.ok ? 'build-failed' : 'ok',
    build: build ? summarizeCommand(build) : null,
    largeJsBundles: chunkFiles.slice(0, 15),
    largeCssBundles: cssFiles.slice(0, 10),
    largeClientComponents,
    analyzerAvailable: Boolean(project.scripts['build:analyze']) || Boolean(project.dependencies['@next/bundle-analyzer']) || Boolean(project.devDependencies['@next/bundle-analyzer']),
    analyzerCommand: project.scripts['build:analyze'] ? project.packageManager + ' run build:analyze' : 'ANALYZE=true ' + project.packageManager + ' run build',
    buildManifestRoutes: buildManifest && buildManifest.pages ? Object.keys(buildManifest.pages).slice(0, 30) : [],
    commandsUsed
  };
}
function normalizeOutdatedJson(packageManager, parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  if (packageManager === 'yarn' && Array.isArray(parsed.data && parsed.data.body)) {
    return parsed.data.body;
  }

  return Object.entries(parsed).map(([name, info]) => ({ name, ...info }));
}

async function analyzeDependencies(options) {
  const project = await inspectProject(options.projectPath);
  const commandsUsed = [];

  const outdatedArgs = project.packageManager === 'npm'
    ? ['outdated', '--json']
    : project.packageManager === 'pnpm'
      ? ['outdated', '--format', 'json']
      : ['outdated', '--json'];
  const outdatedResult = await runPackageManagerCommand(project.projectPath, project.packageManager, outdatedArgs, {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  commandsUsed.push(outdatedResult.command);

  const auditArgs = project.packageManager === 'npm'
    ? ['audit', '--omit=dev', '--json']
    : project.packageManager === 'pnpm'
      ? ['audit', '--prod', '--json']
      : ['audit', '--json'];
  const auditResult = await runPackageManagerCommand(project.projectPath, project.packageManager, auditArgs, {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  commandsUsed.push(auditResult.command);

  const outdatedJson = safeJsonParse(outdatedResult.stdout) || safeJsonParse(outdatedResult.stderr) || {};
  const auditJson = safeJsonParse(auditResult.stdout) || safeJsonParse(auditResult.stderr) || {};
  const outdatedEntries = normalizeOutdatedJson(project.packageManager, outdatedJson)
    .map((item) => ({
      name: item.name,
      current: item.current,
      wanted: item.wanted,
      latest: item.latest,
      location: item.location,
      type: diffVersion(item.current, item.latest),
      frameworkCritical: defaults.heavyClientPackages[item.name] === 'framework-critical'
    }))
    .filter((item) => item.name);

  const patchSafe = outdatedEntries.filter((item) => item.type === 'patch' && !item.frameworkCritical);
  const minorLikelySafe = outdatedEntries.filter((item) => item.type === 'minor' && !item.frameworkCritical);
  const majorNeedsReview = outdatedEntries.filter((item) => item.type === 'major');
  const frameworkCritical = outdatedEntries.filter((item) => item.frameworkCritical);

  return {
    status: 'ok',
    outdated: outdatedEntries,
    patchSafe,
    minorLikelySafe,
    majorNeedsReview,
    frameworkCritical,
    audit: {
      metadata: auditJson.metadata || null,
      vulnerabilities: auditJson.vulnerabilities || null,
      raw: auditJson
    },
    nextCodemodsSuggested: outdatedEntries.some((item) => item.name === 'next' && item.type !== 'none'),
    commandsUsed
  };
}

async function suggestSafeRemovals(options) {
  const unusedCode = options.unusedCode || await analyzeUnusedCode(options);
  const css = options.css || await analyzeCss(options);

  const safeActions = [];
  const mediumRiskActions = [];
  const manualReview = [];

  const dependencyCandidates = unusedCode.findings && Array.isArray(unusedCode.findings.dependencies)
    ? unusedCode.findings.dependencies
    : [];
  for (const dependency of dependencyCandidates) {
    const name = typeof dependency === 'string' ? dependency : dependency.name;
    if (!name) {
      continue;
    }

    if (defaults.heavyClientPackages[name] === 'framework-critical') {
      manualReview.push('Do not auto-remove framework-critical dependency ' + name + '.');
      continue;
    }

    safeActions.push('Repo-grep and verify before removing unused dependency ' + name + '.');
  }

  const fileCandidates = unusedCode.findings && Array.isArray(unusedCode.findings.files)
    ? unusedCode.findings.files
    : [];
  for (const fileCandidate of fileCandidates) {
    const filePath = typeof fileCandidate === 'string' ? fileCandidate : fileCandidate.file;
    if (!filePath) {
      continue;
    }

    if (isProtectedFile(filePath) || touchesProtectedArea(filePath)) {
      manualReview.push('Do not auto-delete protected or business-critical file ' + filePath + '.');
      continue;
    }

    mediumRiskActions.push('Review dead-file candidate ' + filePath + ' with route and runtime checks before deletion.');
  }

  css.riskyCssCleanupCandidates.forEach((item) => {
    mediumRiskActions.push('Review CSS candidate ' + item.file + ' (' + item.reason + ') with safelists before any PurgeCSS apply step.');
  });

  return {
    status: 'ok',
    safeActions,
    mediumRiskActions,
    manualReview,
    commandsUsed: []
  };
}

async function suggestSafeUpgrades(options) {
  const dependencies = options.dependencies || await analyzeDependencies(options);
  const recommendedPackageUpgrades = [];
  const humanReview = [];

  dependencies.patchSafe.forEach((item) => {
    recommendedPackageUpgrades.push({
      name: item.name,
      current: item.current,
      target: item.latest,
      risk: 'safe',
      whyItMatters: 'Patch upgrade with low compatibility risk.',
      expectedBenefit: 'Bug fixes or small package improvements.',
      compatibilityRisk: 'low',
      codeChangesMayBeRequired: false
    });
  });

  dependencies.minorLikelySafe.forEach((item) => {
    recommendedPackageUpgrades.push({
      name: item.name,
      current: item.current,
      target: item.latest,
      risk: 'medium',
      whyItMatters: 'Minor upgrade may reduce bugs or improve performance.',
      expectedBenefit: 'Potential library improvements with manageable change risk.',
      compatibilityRisk: 'medium',
      codeChangesMayBeRequired: true
    });
  });

  dependencies.majorNeedsReview.forEach((item) => {
    humanReview.push('Major upgrade review required for ' + item.name + ' (' + item.current + ' -> ' + item.latest + ').');
  });

  dependencies.frameworkCritical.forEach((item) => {
    humanReview.push('Framework-critical package ' + item.name + ' needs explicit review (' + item.current + ' -> ' + item.latest + ').');
  });

  if (dependencies.nextCodemodsSuggested) {
    humanReview.push('Consider npx @next/codemod@latest when upgrading Next.js across major versions.');
  }

  return {
    status: 'ok',
    recommendedPackageUpgrades,
    humanReview,
    commandsUsed: []
  };
}

function plannedStep(name, command) {
  return { name, status: 'planned', command };
}

async function runVerification(options) {
  const project = await inspectProject(options.projectPath);
  const commandsUsed = [];
  const steps = [];
  const includeLint = options.includeLint !== false;
  const includeTypecheck = options.includeTypecheck !== false;
  const includeBuild = options.includeBuild !== false;
  const includePlaywright = Boolean(options.includePlaywright);
  const includeScreenshots = Boolean(options.includeScreenshots);

  if (includeLint) {
    if (!project.scripts.lint) {
      steps.push({ name: 'lint', status: 'not-configured', command: null });
    } else if (options.dryRun) {
      steps.push(plannedStep('lint', project.packageManager + ' run lint'));
    } else {
      const result = await runPackageManagerScript(project.projectPath, project.packageManager, 'lint', [], {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
      commandsUsed.push(result.command);
      steps.push({ name: 'lint', status: result.ok ? 'passed' : 'failed', command: result.command, summary: summarizeCommand(result) });
    }
  }

  if (includeTypecheck) {
    const typecheckCommand = 'npx tsc --noEmit';
    if (options.dryRun) {
      steps.push(plannedStep('typecheck', typecheckCommand));
    } else {
      const result = await runLocalTool(project.projectPath, 'tsc', ['--noEmit'], project.packageManager, {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
      commandsUsed.push(result.command);
      steps.push({ name: 'typecheck', status: result.ok ? 'passed' : 'failed', command: result.command, summary: summarizeCommand(result) });
    }
  }
  if (includeBuild && project.scripts.build) {
    if (options.dryRun) {
      steps.push(plannedStep('build', project.packageManager + ' run build'));
    } else {
      const result = await runPackageManagerScript(project.projectPath, project.packageManager, 'build', [], {}, options.timeoutMs || DEFAULT_TIMEOUT_MS);
      commandsUsed.push(result.command);
      steps.push({ name: 'build', status: result.ok ? 'passed' : 'failed', command: result.command, summary: summarizeCommand(result) });
    }
  }

  if (includePlaywright) {
    const smokeGrep = options.playwrightSmokeGrep || '@smoke';
    const commandText = 'npx playwright test --grep ' + smokeGrep + ' --reporter=line';
    if (!project.detected.playwrightConfig) {
      steps.push({ name: 'playwright-smoke', status: 'not-configured', command: commandText });
    } else if (options.dryRun) {
      steps.push(plannedStep('playwright-smoke', commandText));
    } else {
      const env = { PLAYWRIGHT_SERVER_COMMAND: options.playwrightServerCommand || (project.packageManager + ' run start') };
      const result = await runLocalTool(project.projectPath, 'playwright', ['test', '--grep', smokeGrep, '--reporter=line'], project.packageManager, env, options.timeoutMs || DEFAULT_TIMEOUT_MS);
      commandsUsed.push(result.command);
      steps.push({ name: 'playwright-smoke', status: result.ok ? 'passed' : 'failed', command: result.command, summary: summarizeCommand(result) });
    }
  }

  if (includeScreenshots) {
    const visualGrep = options.playwrightVisualGrep || '@visual';
    const commandText = 'npx playwright test --grep ' + visualGrep + ' --reporter=line';
    if (!project.detected.playwrightConfig) {
      steps.push({ name: 'playwright-visual', status: 'not-configured', command: commandText });
    } else if (options.dryRun) {
      steps.push(plannedStep('playwright-visual', commandText));
    } else {
      const env = { PLAYWRIGHT_SERVER_COMMAND: options.playwrightServerCommand || (project.packageManager + ' run start') };
      const result = await runLocalTool(project.projectPath, 'playwright', ['test', '--grep', visualGrep, '--reporter=line'], project.packageManager, env, options.timeoutMs || DEFAULT_TIMEOUT_MS);
      commandsUsed.push(result.command);
      steps.push({ name: 'playwright-visual', status: result.ok ? 'passed' : 'failed', command: result.command, summary: summarizeCommand(result) });
    }
  }

  return {
    status: steps.every((step) => ['passed', 'planned', 'not-configured'].includes(step.status)) ? 'ok' : 'failed',
    steps,
    commandsUsed
  };
}

async function generateReport(options) {
  const project = await inspectProject(options.projectPath);
  const unusedCode = options.includeUnusedCode === false ? null : await analyzeUnusedCode(options);
  const css = options.includeCss === false ? null : await analyzeCss(options);
  const bundle = options.includeBundle === false ? null : await analyzeBundle({ ...options, runBuild: options.runBuild !== false });
  const dependencies = options.includeDependencies === false ? null : await analyzeDependencies(options);
  const removals = await suggestSafeRemovals({ ...options, unusedCode, css });
  const upgrades = await suggestSafeUpgrades({ ...options, dependencies });
  const verification = options.includeVerification ? await runVerification(options) : null;

  const commandsUsed = []
    .concat(unusedCode ? unusedCode.commandsUsed || [] : [])
    .concat(css ? css.commandsUsed || [] : [])
    .concat(bundle ? bundle.commandsUsed || [] : [])
    .concat(dependencies ? dependencies.commandsUsed || [] : [])
    .concat(verification ? verification.commandsUsed || [] : []);

  const findings = {
    unusedDependencies: unusedCode && unusedCode.findings
      ? (unusedCode.findings.dependencies || []).map((item) => ({
          name: typeof item === 'string' ? item : item.name,
          reason: 'knip-reported'
        })).filter((item) => item.name)
      : [],
    unusedFiles: unusedCode && unusedCode.findings
      ? (unusedCode.findings.files || []).map((item) => ({ file: typeof item === 'string' ? item : item.file })).filter((item) => item.file)
      : [],
    unusedExports: unusedCode && unusedCode.findings
      ? (unusedCode.findings.exports || []).map((item) => ({
          file: item.file || 'unknown',
          exportName: item.name || item.export || 'unknown'
        }))
      : [],
    riskyCssCleanupCandidates: css ? css.riskyCssCleanupCandidates : [],
    largeJsBundles: bundle ? bundle.largeJsBundles : [],
    largeClientComponents: bundle ? bundle.largeClientComponents : [],
    recommendedPackageUpgrades: upgrades.recommendedPackageUpgrades
  };

  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.mode || 'audit-only',
    project: {
      projectPath: project.projectPath,
      packageManager: project.packageManager,
      router: project.router,
      styling: project.styling,
      detected: project.detected
    },
    summary: {
      unusedDependencyCount: findings.unusedDependencies.length,
      unusedFileCount: findings.unusedFiles.length,
      unusedExportCount: findings.unusedExports.length,
      riskyCssCandidateCount: findings.riskyCssCleanupCandidates.length,
      largeJsBundleCount: findings.largeJsBundles.length,
      largeClientComponentCount: findings.largeClientComponents.length,
      safeFirstActionCount: removals.safeActions.length
    },
    findings,
    safeFirstActions: removals.safeActions.concat(upgrades.recommendedPackageUpgrades.filter((item) => item.risk === 'safe').map((item) => 'Upgrade ' + item.name + ' from ' + item.current + ' to ' + item.target + '.')),
    mediumRiskActions: removals.mediumRiskActions.concat(upgrades.recommendedPackageUpgrades.filter((item) => item.risk === 'medium').map((item) => 'Review minor upgrade for ' + item.name + ' from ' + item.current + ' to ' + item.target + '.')),
    actionsRequiringHumanReview: removals.manualReview.concat(upgrades.humanReview),
    commandsUsed,
    filesTouched: [],
    rollbackGuidance: [
      'Commit before autofix or dependency changes.',
      'Keep build output and smoke-test evidence for before/after review.',
      'Revert only the targeted batch if verification fails.'
    ],
    raw: {
      unusedCode,
      css,
      bundle,
      dependencies,
      verification
    }
  };

  return {
    report,
    markdown: toMarkdown(report)
  };
}

module.exports = {
  analyzeBundle,
  analyzeCss,
  analyzeDependencies,
  analyzeUnusedCode,
  generateReport,
  runVerification,
  suggestSafeRemovals,
  suggestSafeUpgrades
};
