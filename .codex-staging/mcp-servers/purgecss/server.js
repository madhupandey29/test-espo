#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const SERVER_INFO = {
  name: 'purgecss-local',
  title: 'PurgeCSS Local',
  version: '0.1.0',
  description: 'Local MCP wrapper around PurgeCSS for dry-run analysis and optional stylesheet cleanup.',
};

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
let isInitialized = false;
let pendingRequests = 0;
let stdinEnded = false;

const TOOL_DEFINITIONS = [
  {
    name: 'purgecss_healthcheck',
    title: 'PurgeCSS Healthcheck',
    description: 'Verify that PurgeCSS can be executed with npx in the given project directory.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where PurgeCSS should run.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'purgecss_analyze',
    title: 'PurgeCSS Analyze',
    description: 'Run a dry PurgeCSS pass for one or more CSS files and report the size delta plus removed selectors.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where PurgeCSS should run.' },
        css: { type: 'array', items: { type: 'string' }, description: 'CSS file paths, absolute or relative to `cwd`.' },
        content: { type: 'array', items: { type: 'string' }, description: 'Template and source globs, absolute or relative to `cwd`.' },
        safelist: { type: 'array', items: { type: 'string' }, description: 'Selectors or patterns to preserve.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd', 'css', 'content'],
    },
  },
  {
    name: 'purgecss_apply',
    title: 'PurgeCSS Apply',
    description: 'Run PurgeCSS and write the purged CSS back to the original files. Optionally create .bak backups first.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where PurgeCSS should run.' },
        css: { type: 'array', items: { type: 'string' }, description: 'CSS file paths, absolute or relative to `cwd`.' },
        content: { type: 'array', items: { type: 'string' }, description: 'Template and source globs, absolute or relative to `cwd`.' },
        safelist: { type: 'array', items: { type: 'string' }, description: 'Selectors or patterns to preserve.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        backup: { type: 'boolean', description: 'Create .bak backups before overwriting CSS files.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd', 'css', 'content'],
    },
  },
];

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, data } });
}

function ensureObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function ensureStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('`' + fieldName + '` must be an array of non-empty strings.');
  }

  return value;
}

function ensureOptionalStringArray(value, fieldName) {
  if (value == null) {
    return [];
  }

  return ensureStringArray(value, fieldName);
}

function resolveCwd(inputCwd) {
  if (typeof inputCwd !== 'string' || !inputCwd.trim()) {
    throw new Error('`cwd` is required.');
  }

  const resolved = path.resolve(inputCwd);
  if (!fs.existsSync(resolved)) {
    throw new Error('`cwd` does not exist: ' + resolved);
  }

  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error('`cwd` is not a directory: ' + resolved);
  }

  return resolved;
}

function resolveWithinCwd(cwd, targetPath) {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd, targetPath);
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

function extractSelectors(cssText) {
  const selectors = new Set();
  const regex = /(^|})\s*([^@{}][^{}]*?)\s*\{/gms;
  let match;

  while ((match = regex.exec(cssText)) !== null) {
    const rawSelector = match[2].trim();
    if (!rawSelector) {
      continue;
    }

    rawSelector
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => selectors.add(item));
  }

  return selectors;
}

function summarizeFile(originalPath, purgedPath) {
  const originalCss = fs.readFileSync(originalPath, 'utf8');
  const purgedCss = fs.readFileSync(purgedPath, 'utf8');
  const originalSelectors = extractSelectors(originalCss);
  const purgedSelectors = extractSelectors(purgedCss);
  const removedSelectors = Array.from(originalSelectors).filter((item) => !purgedSelectors.has(item)).sort();

  return {
    file: originalPath,
    purgedFile: purgedPath,
    originalBytes: Buffer.byteLength(originalCss, 'utf8'),
    purgedBytes: Buffer.byteLength(purgedCss, 'utf8'),
    bytesRemoved: Buffer.byteLength(originalCss, 'utf8') - Buffer.byteLength(purgedCss, 'utf8'),
    removedSelectors,
  };
}

function buildArgs(params, cwd, outputDir) {
  const cssFiles = ensureStringArray(params.css, 'css').map((item) => resolveWithinCwd(cwd, item));
  const contentFiles = ensureStringArray(params.content, 'content').map((item) => resolveWithinCwd(cwd, item));
  const safelist = ensureOptionalStringArray(params.safelist, 'safelist');
  const extraArgs = ensureOptionalStringArray(params.extraArgs, 'extraArgs');
  const args = ['-y', 'purgecss'];

  for (const cssFile of cssFiles) {
    args.push('--css', cssFile);
  }

  for (const contentFile of contentFiles) {
    args.push('--content', contentFile);
  }

  for (const item of safelist) {
    args.push('--safelist', item);
  }

  args.push('--rejected', '--output', outputDir);
  return { args: args.concat(extraArgs), cssFiles };
}

function runCommand(baseArgs, cwd, timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) {
    throw new Error('`timeoutMs` must be an integer >= 1000.');
  }

  const executable = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx'].concat(baseArgs)
    : baseArgs;

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      cwd,
      shell: false,
      windowsHide: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const startedAt = Date.now();

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      resolve({
        ...result,
        command: ['npx'].concat(baseArgs).join(' '),
        durationMs: Date.now() - startedAt,
      });
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish({ code: -1, stdout, stderr: stderr + '\n' + error.message, timedOut: false });
    });

    child.on('close', (code) => {
      finish({ code: code == null ? -1 : code, stdout, stderr, timedOut: false });
    });

    const timeoutHandle = setTimeout(() => {
      child.kill();
      finish({ code: -1, stdout, stderr: stderr + '\nProcess timed out after ' + timeoutMs + 'ms.', timedOut: true });
    }, timeoutMs);
  });
}

function buildSummary(cssFiles, outputDir) {
  return cssFiles.map((cssFile) => {
    const purgedPath = path.join(outputDir, path.basename(cssFile));
    if (!fs.existsSync(purgedPath)) {
      throw new Error('Expected PurgeCSS output was not created for ' + cssFile);
    }

    return summarizeFile(cssFile, purgedPath);
  });
}

function applyChanges(summary, backup) {
  const changedFiles = [];

  for (const item of summary) {
    if (backup) {
      fs.copyFileSync(item.file, item.file + '.bak');
    }

    fs.copyFileSync(item.purgedFile, item.file);
    changedFiles.push(item.file);
  }

  return changedFiles;
}

function formatRunResult(mode, cwd, cliResult, summary, changedFiles) {
  const lines = [
    'Mode: ' + mode,
    'Working directory: ' + cwd,
    'Exit code: ' + cliResult.code,
    'Duration: ' + cliResult.durationMs + 'ms',
    'Executable: ' + cliResult.command,
  ];

  summary.forEach((item) => {
    lines.push('');
    lines.push('File: ' + item.file);
    lines.push('Purged file: ' + item.purgedFile);
    lines.push('Bytes: ' + item.originalBytes + ' -> ' + item.purgedBytes + ' (' + item.bytesRemoved + ' removed)');
    lines.push('Removed selectors: ' + item.removedSelectors.length);
    if (item.removedSelectors.length > 0) {
      lines.push(item.removedSelectors.slice(0, 50).join('\n'));
    }
  });

  if (changedFiles && changedFiles.length > 0) {
    lines.push('');
    lines.push('Updated files:');
    changedFiles.forEach((file) => lines.push(file));
  }

  if (cliResult.stdout.trim()) {
    lines.push('');
    lines.push('Stdout (tail):');
    lines.push(tailText(cliResult.stdout, 40));
  }

  if (cliResult.stderr.trim()) {
    lines.push('');
    lines.push('Stderr (tail):');
    lines.push(tailText(cliResult.stderr, 40));
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
    structuredContent: {
      mode,
      cwd,
      exitCode: cliResult.code,
      durationMs: cliResult.durationMs,
      timedOut: cliResult.timedOut,
      command: cliResult.command,
      stdout: cliResult.stdout,
      stderr: cliResult.stderr,
      summary,
      changedFiles: changedFiles || [],
    },
    isError: cliResult.code !== 0,
  };
}

async function runPurge(mode, rawParams) {
  const params = ensureObject(rawParams);
  const cwd = resolveCwd(params.cwd);
  const timeoutMs = params.timeoutMs != null ? params.timeoutMs : DEFAULT_TIMEOUT_MS;
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'purgecss-'));
  const { args, cssFiles } = buildArgs(params, cwd, outputDir);

  try {
    const cliResult = await runCommand(args, cwd, timeoutMs);
    const summary = cliResult.code === 0 ? buildSummary(cssFiles, outputDir) : [];
    const changedFiles = cliResult.code === 0 && mode === 'apply'
      ? applyChanges(summary, Boolean(params.backup))
      : [];

    return formatRunResult(mode, cwd, cliResult, summary, changedFiles);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

async function handleToolCall(name, rawParams) {
  const params = ensureObject(rawParams);
  const cwd = resolveCwd(params.cwd);

  switch (name) {
    case 'purgecss_healthcheck': {
      const cliResult = await runCommand(['-y', 'purgecss', '--help'], cwd, params.timeoutMs != null ? params.timeoutMs : DEFAULT_TIMEOUT_MS);
      return {
        content: [{
          type: 'text',
          text: [
            'Working directory: ' + cwd,
            'Exit code: ' + cliResult.code,
            'Executable: ' + cliResult.command,
            cliResult.stdout.trim() ? 'Stdout (tail):\n' + tailText(cliResult.stdout, 20) : '',
            cliResult.stderr.trim() ? 'Stderr (tail):\n' + tailText(cliResult.stderr, 20) : '',
          ].filter(Boolean).join('\n'),
        }],
        structuredContent: {
          cwd,
          exitCode: cliResult.code,
          durationMs: cliResult.durationMs,
          timedOut: cliResult.timedOut,
          command: cliResult.command,
          stdout: cliResult.stdout,
          stderr: cliResult.stderr,
        },
        isError: cliResult.code !== 0,
      };
    }
    case 'purgecss_analyze':
      return runPurge('analyze', params);
    case 'purgecss_apply':
      return runPurge('apply', params);
    default:
      throw new Error('Unknown tool: ' + name);
  }
}

async function handleRequest(message) {
  const id = Object.prototype.hasOwnProperty.call(message, 'id') ? message.id : null;

  if (message.method === 'initialize') {
    const clientVersion = message.params && message.params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(clientVersion)
      ? clientVersion
      : SUPPORTED_PROTOCOL_VERSIONS[0];

    isInitialized = true;
    sendResult(id, {
      protocolVersion,
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: SERVER_INFO,
      instructions: 'Use purgecss_analyze before purgecss_apply. Always include template and source paths that can emit classes, and safelist dynamic selectors before writing changes.',
    });
    return;
  }

  if (!isInitialized) {
    sendError(id, -32002, 'Server not initialized. Send `initialize` first.');
    return;
  }

  if (message.method === 'ping') {
    sendResult(id, {});
    return;
  }

  if (message.method === 'tools/list') {
    sendResult(id, { tools: TOOL_DEFINITIONS });
    return;
  }

  if (message.method === 'tools/call') {
    try {
      const params = ensureObject(message.params);
      if (typeof params.name !== 'string' || !params.name) {
        throw new Error('`name` is required for `tools/call`.');
      }

      const result = await handleToolCall(params.name, params.arguments);
      sendResult(id, result);
    } catch (error) {
      sendResult(id, {
        content: [{ type: 'text', text: error.message }],
        structuredContent: { error: error.message },
        isError: true,
      });
    }
    return;
  }

  sendError(id, -32601, 'Method not found: ' + message.method);
}

function maybeExit() {
  if (stdinEnded && pendingRequests === 0) {
    process.exit(0);
  }
}

function runRequest(message) {
  pendingRequests += 1;
  handleRequest(message)
    .catch((error) => {
      const id = Object.prototype.hasOwnProperty.call(message, 'id') ? message.id : null;
      sendError(id, -32000, error.message);
    })
    .finally(() => {
      pendingRequests -= 1;
      maybeExit();
    });
}

function handleMessage(message) {
  if (Array.isArray(message)) {
    for (const item of message) {
      handleMessage(item);
    }
    return;
  }

  if (!message || typeof message !== 'object') {
    sendError(null, -32600, 'Invalid request payload.');
    return;
  }

  if (typeof message.method === 'string') {
    if (message.method === 'notifications/initialized' || message.method === 'notifications/cancelled') {
      return;
    }

    runRequest(message);
    return;
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  while (buffer.includes('\n')) {
    const newlineIndex = buffer.indexOf('\n');
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (!line) {
      continue;
    }

    try {
      handleMessage(JSON.parse(line));
    } catch (error) {
      sendError(null, -32700, 'Parse error', { detail: error.message });
    }
  }
});

process.stdin.on('end', () => {
  stdinEnded = true;
  maybeExit();
});