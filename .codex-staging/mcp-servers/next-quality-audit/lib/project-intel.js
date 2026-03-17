const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const { detectPackageManager, normalizeProjectPath } = require('./exec');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function findFirstExisting(projectPath, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(projectPath, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function relative(projectPath, filePath) {
  return path.relative(projectPath, filePath).replace(/\\/g, '/');
}

async function listFiles(projectPath, patterns) {
  return fg(patterns, {
    cwd: projectPath,
    absolute: true,
    onlyFiles: true,
    dot: false,
    ignore: ['**/node_modules/**', '**/.next/**', '**/.git/**', '**/coverage/**', '**/dist/**', '**/build/**', '**/.codex-staging/**']
  });
}

function detectRouter(projectPath) {
  const hasSrcApp = fs.existsSync(path.join(projectPath, 'src', 'app'));
  const hasRootApp = fs.existsSync(path.join(projectPath, 'app'));
  const hasSrcPages = fs.existsSync(path.join(projectPath, 'src', 'pages'));
  const hasRootPages = fs.existsSync(path.join(projectPath, 'pages'));

  return {
    appRouter: hasSrcApp || hasRootApp,
    pagesRouter: hasSrcPages || hasRootPages,
    mode: hasSrcApp || hasRootApp ? 'app-router' : hasSrcPages || hasRootPages ? 'pages-router' : 'unknown'
  };
}

async function detectStyling(projectPath, packageJson) {
  const styleFiles = await listFiles(projectPath, ['src/**/*.{css,scss,sass}', 'app/**/*.{css,scss,sass}', 'styles/**/*.{css,scss,sass}', 'public/**/*.{css,scss,sass}']);
  const cssModules = styleFiles.filter((filePath) => /\.module\.(css|scss|sass)$/i.test(filePath));
  const globalCss = styleFiles.filter((filePath) => !/\.module\.(css|scss|sass)$/i.test(filePath));
  const layoutFiles = await listFiles(projectPath, [
    'src/app/layout.{js,jsx,ts,tsx}',
    'app/layout.{js,jsx,ts,tsx}',
    'src/pages/_app.{js,jsx,ts,tsx}',
    'pages/_app.{js,jsx,ts,tsx}'
  ]);

  const globalImports = [];
  for (const filePath of layoutFiles) {
    const text = readText(filePath);
    const matches = text.match(/import\s+['\"]([^'\"]+\.(css|scss|sass))['\"]/g) || [];
    matches.forEach((statement) => globalImports.push({ file: relative(projectPath, filePath), statement }));
  }

  const importScanTargets = await listFiles(projectPath, ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}']);
  let styledComponentsUsed = Boolean(packageJson.dependencies && packageJson.dependencies['styled-components'])
    || Boolean(packageJson.devDependencies && packageJson.devDependencies['styled-components']);
  const tailwindConfig = findFirstExisting(projectPath, ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts']);
  let tailwindUsed = Boolean(tailwindConfig)
    || Boolean(packageJson.dependencies && packageJson.dependencies.tailwindcss)
    || Boolean(packageJson.devDependencies && packageJson.devDependencies.tailwindcss);

  if (!styledComponentsUsed || !tailwindUsed) {
    for (const filePath of importScanTargets.slice(0, 500)) {
      const text = readText(filePath);
      if (!styledComponentsUsed && /styled-components/.test(text)) {
        styledComponentsUsed = true;
      }

      if (!tailwindUsed && /className\s*=\s*['\"][^'\"]*(sm:|md:|lg:|xl:|2xl:|dark:)/.test(text)) {
        tailwindUsed = true;
      }

      if (styledComponentsUsed && tailwindUsed) {
        break;
      }
    }
  }

  return {
    tailwind: tailwindUsed,
    sass: styleFiles.some((filePath) => /\.(scss|sass)$/i.test(filePath)) || Boolean(packageJson.dependencies && packageJson.dependencies.sass),
    cssModules: cssModules.length > 0,
    styledComponents: styledComponentsUsed,
    globalCss: globalCss.length > 0,
    cssFileCount: styleFiles.length,
    cssModuleCount: cssModules.length,
    globalCssCount: globalCss.length,
    sampleGlobalCssFiles: globalCss.slice(0, 10).map((filePath) => relative(projectPath, filePath)),
    sampleCssModules: cssModules.slice(0, 10).map((filePath) => relative(projectPath, filePath)),
    globalImports,
    tailwindConfig: tailwindConfig ? relative(projectPath, tailwindConfig) : null
  };
}

async function detectClientComponents(projectPath) {
  const sourceFiles = await listFiles(projectPath, ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}']);
  const clientComponents = [];

  for (const filePath of sourceFiles) {
    const text = readText(filePath);
    if (!/^['\"]use client['\"];?/m.test(text)) {
      continue;
    }

    clientComponents.push({
      file: relative(projectPath, filePath),
      bytes: fs.statSync(filePath).size,
      imports: (text.match(/from\s+['\"]([^'\"]+)['\"]/g) || []).slice(0, 25)
    });
  }

  clientComponents.sort((left, right) => right.bytes - left.bytes);
  return clientComponents;
}

async function inspectProject(projectPath) {
  const resolvedProjectPath = normalizeProjectPath(projectPath);
  const packageJsonPath = path.join(resolvedProjectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found at project root: ' + resolvedProjectPath);
  }

  const packageJson = readJson(packageJsonPath);
  const packageManager = detectPackageManager(resolvedProjectPath);
  const router = detectRouter(resolvedProjectPath);
  const nextConfigPath = findFirstExisting(resolvedProjectPath, ['next.config.js', 'next.config.mjs', 'next.config.cjs', 'next.config.ts']);
  const eslintConfigPath = findFirstExisting(resolvedProjectPath, ['.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']);
  const tsconfigPath = findFirstExisting(resolvedProjectPath, ['tsconfig.json', 'jsconfig.json']);
  const postcssConfigPath = findFirstExisting(resolvedProjectPath, ['postcss.config.js', 'postcss.config.cjs', 'postcss.config.mjs']);
  const playwrightConfigPath = findFirstExisting(resolvedProjectPath, ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs', 'playwright.config.cjs']);
  const styling = await detectStyling(resolvedProjectPath, packageJson);
  const clientComponents = await detectClientComponents(resolvedProjectPath);

  return {
    projectPath: resolvedProjectPath,
    packageManager,
    packageJson,
    router,
    styling,
    clientComponents,
    detected: {
      nextConfig: nextConfigPath ? relative(resolvedProjectPath, nextConfigPath) : null,
      eslintConfig: eslintConfigPath ? relative(resolvedProjectPath, eslintConfigPath) : null,
      tsconfig: tsconfigPath ? relative(resolvedProjectPath, tsconfigPath) : null,
      postcssConfig: postcssConfigPath ? relative(resolvedProjectPath, postcssConfigPath) : null,
      playwrightConfig: playwrightConfigPath ? relative(resolvedProjectPath, playwrightConfigPath) : null
    },
    scripts: packageJson.scripts || {},
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {}
  };
}

module.exports = {
  inspectProject,
  listFiles,
  readJson,
  readText,
  relative
};
