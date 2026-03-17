#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SERVER_INFO = {
  name: 'lighthouse-ci-local',
  title: 'Lighthouse CI Local',
  version: '0.1.0',
  description: 'Local MCP wrapper around @lhci/cli for collect, assert, autorun, upload, and manifest inspection.',
};

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
let isInitialized = false;
let pendingRequests = 0;
let stdinEnded = false;

const TOOL_DEFINITIONS = [
  {
    name: 'lhci_healthcheck',
    title: 'LHCI Healthcheck',
    description: 'Run `lhci healthcheck` in a project directory.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where LHCI should run.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'lhci_collect',
    title: 'LHCI Collect',
    description: 'Run `lhci collect`. Use `urls` and `numberOfRuns` for quick local audits, or rely on an existing `.lighthouserc` in `cwd`.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where LHCI should run.' },
        urls: { type: 'array', items: { type: 'string' }, description: 'One or more URLs to audit.' },
        numberOfRuns: { type: 'integer', minimum: 1, description: 'Number of LHCI runs per URL.' },
        configPath: { type: 'string', description: 'Optional LHCI config path, absolute or relative to `cwd`.' },
        startServerCommand: { type: 'string', description: 'Optional server command for LHCI to launch.' },
        staticDistDir: { type: 'string', description: 'Optional static output directory, absolute or relative to `cwd`.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'lhci_assert',
    title: 'LHCI Assert',
    description: 'Run `lhci assert` against existing LHCI results in a project directory.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where LHCI should run.' },
        configPath: { type: 'string', description: 'Optional LHCI config path, absolute or relative to `cwd`.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'lhci_autorun',
    title: 'LHCI Autorun',
    description: 'Run `lhci autorun` in a project directory using the repository configuration.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where LHCI should run.' },
        configPath: { type: 'string', description: 'Optional LHCI config path, absolute or relative to `cwd`.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'lhci_upload',
    title: 'LHCI Upload',
    description: 'Run `lhci upload`, for example with `target=temporary-public-storage` or a configured LHCI server.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where LHCI should run.' },
        target: { type: 'string', description: 'Optional upload target such as `temporary-public-storage`.' },
        configPath: { type: 'string', description: 'Optional LHCI config path, absolute or relative to `cwd`.' },
        extraArgs: { type: 'array', items: { type: 'string' }, description: 'Extra CLI flags to append.' },
        timeoutMs: { type: 'integer', minimum: 1000, description: 'Process timeout in milliseconds.' },
      },
      required: ['cwd'],
    },
  },
  {
    name: 'lhci_read_manifest',
    title: 'LHCI Read Manifest',
    description: 'Read `.lighthouseci/manifest.json` and return parsed data for the latest local LHCI run.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cwd: { type: 'string', description: 'Project directory where the manifest lives.' },
        manifestPath: { type: 'string', description: 'Optional custom manifest path, absolute or relative to `cwd`.' },
      },
      required: ['cwd'],
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

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function ensureObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

function resolveMaybeRelative(cwd, targetPath) {
  if (!targetPath) {
    return null;
  }

  return path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd, targetPath);
}

function ensureStringArray(value, fieldName) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('`' + fieldName + '` must be an array of strings.');
  }

  return value;
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

function readManifest(cwd, manifestPath) {
  const resolvedManifestPath = resolveMaybeRelative(cwd, manifestPath) || path.join(cwd, '.lighthouseci', 'manifest.json');
  if (!fs.existsSync(resolvedManifestPath)) {
    return null;
  }

  const rawText = fs.readFileSync(resolvedManifestPath, 'utf8');
  const data = JSON.parse(rawText);
  return {
    path: resolvedManifestPath,
    data,
    summary: summarizeManifest(data),
  };
}

function summarizeManifest(data) {
  const entries = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.manifest)
        ? data.manifest
        : [];

  return entries.map((entry, index) => ({
    index,
    url: pickFirstString(entry, ['url', 'finalUrl']),
    htmlPath: pickFirstString(entry, ['htmlPath', 'htmlReportPath']),
    jsonPath: pickFirstString(entry, ['jsonPath', 'jsonReportPath']),
    summaryPath: pickFirstString(entry, ['summaryPath']),
    link: pickNestedString(entry, [['links', 'report'], ['links', 'summary'], ['link']]),
  }));
}

function pickFirstString(object, keys) {
  if (!object || typeof object !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (typeof object[key] === 'string' && object[key]) {
      return object[key];
    }
  }

  return null;
}

function pickNestedString(object, keyPaths) {
  if (!object || typeof object !== 'object') {
    return null;
  }

  for (const keyPath of keyPaths) {
    let current = object;
    let matched = true;

    for (const key of keyPath) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        matched = false;
        break;
      }
      current = current[key];
    }

    if (matched && typeof current === 'string' && current) {
      return current;
    }
  }

  return null;
}

function buildArgs(subcommand, params, cwd) {
  const extraArgs = ensureStringArray(params.extraArgs, 'extraArgs');
  const args = ['-y', '@lhci/cli', subcommand];

  if (params.configPath) {
    args.push('--config=' + resolveMaybeRelative(cwd, params.configPath));
  }

  switch (subcommand) {
    case 'collect': {
      const urls = ensureStringArray(params.urls, 'urls');
      for (const url of urls) {
        args.push('--url=' + url);
      }

      if (params.numberOfRuns != null) {
        if (!Number.isInteger(params.numberOfRuns) || params.numberOfRuns < 1) {
          throw new Error('`numberOfRuns` must be an integer >= 1.');
        }
        args.push('--numberOfRuns=' + params.numberOfRuns);
      }

      if (params.startServerCommand) {
        args.push('--startServerCommand=' + params.startServerCommand);
      }

      if (params.staticDistDir) {
        args.push('--staticDistDir=' + resolveMaybeRelative(cwd, params.staticDistDir));
      }
      break;
    }
    case 'upload': {
      if (params.target) {
        args.push('--target=' + params.target);
      }
      break;
    }
    default:
      break;
  }

  return args.concat(extraArgs);
}

function runCli(subcommand, params, cwd) {
  const timeoutMs = params.timeoutMs != null ? params.timeoutMs : DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) {
    throw new Error('`timeoutMs` must be an integer >= 1000.');
  }

  const baseArgs = buildArgs(subcommand, params, cwd);
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

function formatCliResult(subcommand, cwd, cliResult, manifest) {
  const lines = [
    'Command: ' + subcommand,
    'Working directory: ' + cwd,
    'Exit code: ' + cliResult.code,
    'Duration: ' + cliResult.durationMs + 'ms',
    'Executable: ' + cliResult.command,
  ];

  if (manifest) {
    lines.push('Manifest: ' + manifest.path);
    if (manifest.summary.length > 0) {
      lines.push('Manifest entries: ' + manifest.summary.length);
      manifest.summary.forEach((entry) => {
        lines.push('- [' + entry.index + '] ' + (entry.url || 'unknown url') + (entry.link ? ' -> ' + entry.link : ''));
      });
    }
  }

  if (cliResult.stdout.trim()) {
    lines.push('Stdout (tail):');
    lines.push(tailText(cliResult.stdout, 60));
  }

  if (cliResult.stderr.trim()) {
    lines.push('Stderr (tail):');
    lines.push(tailText(cliResult.stderr, 60));
  }

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
    structuredContent: {
      subcommand,
      cwd,
      exitCode: cliResult.code,
      durationMs: cliResult.durationMs,
      timedOut: cliResult.timedOut,
      command: cliResult.command,
      stdout: cliResult.stdout,
      stderr: cliResult.stderr,
      manifest,
    },
    isError: cliResult.code !== 0,
  };
}

function formatManifestResult(cwd, manifest) {
  if (!manifest) {
    return {
      content: [{ type: 'text', text: 'No LHCI manifest found in ' + path.join(cwd, '.lighthouseci', 'manifest.json') }],
      structuredContent: { cwd, manifest: null },
      isError: true,
    };
  }

  const lines = [
    'Manifest: ' + manifest.path,
    'Entries: ' + manifest.summary.length,
  ];

  manifest.summary.forEach((entry) => {
    lines.push('- [' + entry.index + '] ' + (entry.url || 'unknown url') + (entry.link ? ' -> ' + entry.link : ''));
  });

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
    structuredContent: { cwd, manifest },
  };
}

async function handleToolCall(name, rawParams) {
  const params = ensureObject(rawParams);
  const cwd = resolveCwd(params.cwd);

  switch (name) {
    case 'lhci_healthcheck': {
      const cliResult = await runCli('healthcheck', params, cwd);
      return formatCliResult('healthcheck', cwd, cliResult, null);
    }
    case 'lhci_collect': {
      const cliResult = await runCli('collect', params, cwd);
      const manifest = readManifest(cwd, null);
      return formatCliResult('collect', cwd, cliResult, manifest);
    }
    case 'lhci_assert': {
      const cliResult = await runCli('assert', params, cwd);
      return formatCliResult('assert', cwd, cliResult, null);
    }
    case 'lhci_autorun': {
      const cliResult = await runCli('autorun', params, cwd);
      const manifest = readManifest(cwd, null);
      return formatCliResult('autorun', cwd, cliResult, manifest);
    }
    case 'lhci_upload': {
      const cliResult = await runCli('upload', params, cwd);
      const manifest = readManifest(cwd, null);
      return formatCliResult('upload', cwd, cliResult, manifest);
    }
    case 'lhci_read_manifest': {
      const manifest = readManifest(cwd, params.manifestPath || null);
      return formatManifestResult(cwd, manifest);
    }
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
      instructions: 'Use the LHCI tools with a repo `cwd`. Prefer `lhci_collect` for local repeated runs, `lhci_autorun` for project-configured flows, and `lhci_read_manifest` to inspect the latest local results.',
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


