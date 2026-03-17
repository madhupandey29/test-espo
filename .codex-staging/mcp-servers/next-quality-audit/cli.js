#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { inspectProject } = require('./lib/project-intel');
const {
  analyzeDependencies,
  generateReport,
  runVerification,
  suggestSafeUpgrades
} = require('./lib/audits');
const { getLocalBin, runLocalTool, runPackageManagerScript } = require('./lib/exec');

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function toBoolean(value, fallback) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return !['false', '0', 'no'].includes(String(value).toLowerCase());
}

function toInteger(value, fallback) {
  if (value == null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureParentDirectory(filePath) {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

function writeFileIfRequested(filePath, contents) {
  if (!filePath) {
    return;
  }

  const resolved = path.resolve(filePath);
  ensureParentDirectory(resolved);
  fs.writeFileSync(resolved, contents, 'utf8');
}

function usage() {
  return [
    'Usage:',
    '  node cli.js inspect --project-path <path>',
    '  node cli.js report --project-path <path> [--output-json report.json] [--output-md report.md]',
    '  node cli.js verify --project-path <path> [--include-playwright] [--include-screenshots]',
    '  node cli.js stage1-audit --project-path <path>',
    '  node cli.js stage2-safe-autofix --project-path <path> [--allow-fix]',
    '  node cli.js stage3-guided-upgrades --project-path <path>',
    '  node cli.js stage4-visual-verification --project-path <path> [--include-playwright] [--include-screenshots]'
  ].join('\n');
}

async function stage2SafeAutofix(options) {
  const project = await inspectProject(options.projectPath);
  const allowFix = Boolean(options.allowFix);
  const steps = [];
  const commandsUsed = [];

  if (project.scripts['lint:fix']) {
    const commandText = project.packageManager + ' run lint:fix';
    if (!allowFix) {
      steps.push({ name: 'lint-fix', status: 'planned', command: commandText });
    } else {
      const result = await runPackageManagerScript(project.projectPath, project.packageManager, 'lint:fix', [], {}, options.timeoutMs);
      commandsUsed.push(result.command);
      steps.push({ name: 'lint-fix', status: result.ok ? 'passed' : 'failed', command: result.command });
    }
  } else {
    steps.push({ name: 'lint-fix', status: 'not-configured', command: null });
  }

  const biomeInstalled = Boolean(getLocalBin(project.projectPath, 'biome')) || Boolean(project.dependencies['@biomejs/biome']) || Boolean(project.devDependencies['@biomejs/biome']);
  if (biomeInstalled) {
    const commandText = 'biome check --write .';
    if (!allowFix) {
      steps.push({ name: 'biome-write', status: 'planned', command: commandText });
    } else {
      const result = await runLocalTool(project.projectPath, 'biome', ['check', '--write', '.'], project.packageManager, {}, options.timeoutMs);
      commandsUsed.push(result.command);
      steps.push({ name: 'biome-write', status: result.ok ? 'passed' : 'failed', command: result.command });
    }
  } else {
    steps.push({ name: 'biome-write', status: 'not-configured', command: null });
  }

  steps.push({
    name: 'guardrail',
    status: allowFix ? 'passed' : 'planned',
    command: 'No code, route, CSS, or dependency deletion is performed automatically in stage2.'
  });

  return {
    stage: 'stage2-safe-autofix',
    allowFix,
    status: steps.every((step) => ['passed', 'planned', 'not-configured'].includes(step.status)) ? 'ok' : 'failed',
    steps,
    commandsUsed
  };
}

async function stage3GuidedUpgrades(options) {
  const dependencies = await analyzeDependencies(options);
  const upgrades = await suggestSafeUpgrades({ ...options, dependencies });
  return {
    stage: 'stage3-guided-upgrades',
    status: 'ok',
    recommendedPackageUpgrades: upgrades.recommendedPackageUpgrades,
    actionsRequiringHumanReview: upgrades.humanReview,
    commandsUsed: dependencies.commandsUsed
  };
}

async function runCommand(command, options) {
  switch (command) {
    case 'inspect':
      return inspectProject(options.projectPath);
    case 'audit':
    case 'report':
      return generateReport({
        ...options,
        mode: options.mode || 'audit-only',
        includeVerification: toBoolean(options.includeVerification, false),
        includePlaywright: toBoolean(options.includePlaywright, false),
        includeScreenshots: toBoolean(options.includeScreenshots, false),
        runBuild: toBoolean(options.runBuild, true),
        dryRun: toBoolean(options.dryRun, true)
      });
    case 'verify':
      return runVerification({
        ...options,
        dryRun: toBoolean(options.dryRun, false),
        includePlaywright: toBoolean(options.includePlaywright, false),
        includeScreenshots: toBoolean(options.includeScreenshots, false)
      });
    case 'stage1-audit':
      return generateReport({
        ...options,
        mode: 'stage-1-audit',
        dryRun: true,
        includeVerification: false,
        includePlaywright: false,
        includeScreenshots: false,
        runBuild: toBoolean(options.runBuild, true)
      });
    case 'stage2-safe-autofix':
      return stage2SafeAutofix({
        ...options,
        allowFix: toBoolean(options.allowFix, false)
      });
    case 'stage3-guided-upgrades':
      return stage3GuidedUpgrades(options);
    case 'stage4-visual-verification':
      return runVerification({
        ...options,
        dryRun: toBoolean(options.dryRun, false),
        includePlaywright: true,
        includeScreenshots: toBoolean(options.includeScreenshots, true)
      });
    default:
      throw new Error('Unknown command: ' + command + '\n\n' + usage());
  }
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(usage() + '\n');
    process.exit(0);
  }

  const projectPath = args['project-path'] ? path.resolve(args['project-path']) : process.cwd();
  const timeoutMs = toInteger(args['timeout-ms'], 10 * 60 * 1000);
  const options = {
    ...args,
    projectPath,
    timeoutMs,
    dryRun: args['dry-run'] ?? args.dryRun,
    allowFix: args['allow-fix'] ?? args.allowFix,
    includePlaywright: args['include-playwright'] ?? args.includePlaywright,
    includeScreenshots: args['include-screenshots'] ?? args.includeScreenshots,
    includeVerification: args['include-verification'] ?? args.includeVerification,
    runBuild: args['run-build'] ?? args.runBuild,
    outputJson: args['output-json'] ? path.resolve(args['output-json']) : null,
    outputMd: args['output-md'] ? path.resolve(args['output-md']) : null,
    playwrightServerCommand: args['playwright-server-command'] || null,
    playwrightSmokeGrep: args['playwright-smoke-grep'] || '@smoke',
    playwrightVisualGrep: args['playwright-visual-grep'] || '@visual'
  };

  const result = await runCommand(command, options);

  if (command === 'audit' || command === 'report' || command === 'stage1-audit') {
    writeFileIfRequested(options.outputJson, JSON.stringify(result.report, null, 2));
    writeFileIfRequested(options.outputMd, result.markdown);
    process.stdout.write(JSON.stringify(result.report, null, 2) + '\n');
    return;
  }

  writeFileIfRequested(options.outputJson, JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
})().catch((error) => {
  process.stderr.write(error.stack + '\n');
  process.exit(1);
});
