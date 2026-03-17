const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const isWindows = process.platform === 'win32';

function getExecutable(name) {
  if (!isWindows) {
    return name;
  }

  if (name.endsWith('.cmd') || name.endsWith('.exe')) {
    return name;
  }

  return name + '.cmd';
}

function normalizeProjectPath(projectPath) {
  const resolved = path.resolve(projectPath || process.cwd());
  if (!fs.existsSync(resolved)) {
    throw new Error('Project path does not exist: ' + resolved);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error('Project path is not a directory: ' + resolved);
  }

  return resolved;
}

function localBinPath(projectPath, binName) {
  const binFile = isWindows ? binName + '.cmd' : binName;
  return path.join(projectPath, 'node_modules', '.bin', binFile);
}

function getLocalBin(projectPath, binName) {
  const candidate = localBinPath(projectPath, binName);
  return fs.existsSync(candidate) ? candidate : null;
}

function detectPackageManager(projectPath) {
  const resolved = normalizeProjectPath(projectPath);
  const checks = [
    { file: 'pnpm-lock.yaml', packageManager: 'pnpm' },
    { file: 'yarn.lock', packageManager: 'yarn' },
    { file: 'package-lock.json', packageManager: 'npm' }
  ];

  for (const check of checks) {
    if (fs.existsSync(path.join(resolved, check.file))) {
      return check.packageManager;
    }
  }

  return 'npm';
}

function runCommand(options) {
  const executable = options.executable;
  const args = Array.isArray(options.args) ? options.args : [];
  const cwd = normalizeProjectPath(options.cwd || process.cwd());
  const timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
  const env = { ...process.env, ...(options.env || {}) };
  const useShell = isWindows && /\.(cmd|bat)$/i.test(executable);

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      cwd,
      env,
      shell: useShell,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const startedAt = Date.now();
    let timeoutHandle = null;

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      resolve({
        command: [executable].concat(args).join(' '),
        cwd,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
        timedOut: false,
        ...result
      });
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      stderr += (stderr ? '\n' : '') + error.message;
      finish({ code: -1, ok: false });
    });

    child.on('close', (code) => {
      finish({ code: code == null ? -1 : code, ok: code === 0 });
    });

    timeoutHandle = setTimeout(() => {
      child.kill();
      stderr += (stderr ? '\n' : '') + 'Process timed out after ' + timeoutMs + 'ms.';
      finish({ code: -1, ok: false, timedOut: true });
    }, timeoutMs);
  });
}

function runPackageManagerScript(projectPath, packageManager, scriptName, extraArgs, env, timeoutMs) {
  const executable = getExecutable(packageManager);
  const trailingArgs = Array.isArray(extraArgs) ? extraArgs : [];
  let args;

  if (packageManager === 'yarn') {
    args = ['run', scriptName].concat(trailingArgs);
  } else if (trailingArgs.length > 0) {
    args = ['run', scriptName, '--'].concat(trailingArgs);
  } else {
    args = ['run', scriptName];
  }

  return runCommand({ executable, args, cwd: projectPath, env, timeoutMs });
}

function runPackageManagerCommand(projectPath, packageManager, extraArgs, env, timeoutMs) {
  const executable = getExecutable(packageManager);
  const args = Array.isArray(extraArgs) ? extraArgs : [];
  return runCommand({ executable, args, cwd: projectPath, env, timeoutMs });
}

function runLocalTool(projectPath, toolName, args, fallbackPackageManager, env, timeoutMs) {
  const localBin = getLocalBin(projectPath, toolName);
  if (localBin) {
    return runCommand({ executable: localBin, args: args || [], cwd: projectPath, env, timeoutMs });
  }

  const packageManager = fallbackPackageManager || detectPackageManager(projectPath);
  if (packageManager === 'npm') {
    return runCommand({
      executable: getExecutable('npx'),
      args: ['--no-install', toolName].concat(args || []),
      cwd: projectPath,
      env,
      timeoutMs
    });
  }

  if (packageManager === 'pnpm') {
    return runCommand({
      executable: getExecutable('pnpm'),
      args: ['exec', toolName].concat(args || []),
      cwd: projectPath,
      env,
      timeoutMs
    });
  }

  return runCommand({
    executable: getExecutable('yarn'),
    args: [toolName].concat(args || []),
    cwd: projectPath,
    env,
    timeoutMs
  });
}

function tailText(input, maxLines) {
  if (!input) {
    return '';
  }

  const lines = input.split(/\r?\n/).filter(Boolean);
  if (lines.length <= maxLines) {
    return lines.join('\n');
  }

  return lines.slice(-maxLines).join('\n');
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  detectPackageManager,
  getExecutable,
  getLocalBin,
  normalizeProjectPath,
  runCommand,
  runLocalTool,
  runPackageManagerCommand,
  runPackageManagerScript,
  tailText
};
