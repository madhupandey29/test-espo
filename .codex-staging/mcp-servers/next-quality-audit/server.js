#!/usr/bin/env node
const { inspectProject } = require('./lib/project-intel');
const {
  analyzeBundle,
  analyzeCss,
  analyzeDependencies,
  analyzeUnusedCode,
  generateReport,
  runVerification,
  suggestSafeRemovals,
  suggestSafeUpgrades
} = require('./lib/audits');

const SERVER_INFO = {
  name: 'next-quality-audit-local',
  title: 'Next Quality Audit Local',
  version: '0.1.0',
  description: 'Local MCP server for safe React and Next.js quality audits, bundle checks, and dry-run-first upgrade guidance.'
};

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const TOOL_DEFINITIONS = [
  {
    name: 'inspect_project',
    title: 'Inspect Project',
    description: 'Read package.json, tsconfig, eslint config, Next config, router shape, and styling usage before any audit step.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string', description: 'Absolute or relative project root path.' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'analyze_unused_code',
    title: 'Analyze Unused Code',
    description: 'Run Knip when available and summarize unused dependencies, files, exports, and issues.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        packageManager: { type: 'string', enum: ['npm', 'pnpm', 'yarn'] },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'analyze_css',
    title: 'Analyze CSS',
    description: 'Identify large CSS files, legacy global CSS, and cautious PurgeCSS candidates.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'analyze_bundle',
    title: 'Analyze Bundle',
    description: 'Inspect emitted .next bundles, identify large client components, and note bundle-analyzer support.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        runBuild: { type: 'boolean' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'analyze_dependencies',
    title: 'Analyze Dependencies',
    description: 'List outdated packages, audit production dependencies, and group upgrades by risk.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'suggest_safe_removals',
    title: 'Suggest Safe Removals',
    description: 'Classify dependency, file, and CSS cleanup candidates into safe, medium-risk, and manual-review buckets.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'suggest_safe_upgrades',
    title: 'Suggest Safe Upgrades',
    description: 'Recommend patch-safe and likely-safe minor upgrades and separate majors for human review.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'run_verification',
    title: 'Run Verification',
    description: 'Run lint, typecheck, build, and optional Playwright smoke or visual checks in dry-run or execution mode.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        dryRun: { type: 'boolean' },
        includeLint: { type: 'boolean' },
        includeTypecheck: { type: 'boolean' },
        includeBuild: { type: 'boolean' },
        includePlaywright: { type: 'boolean' },
        includeScreenshots: { type: 'boolean' },
        playwrightServerCommand: { type: 'string' },
        playwrightSmokeGrep: { type: 'string' },
        playwrightVisualGrep: { type: 'string' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'generate_report',
    title: 'Generate Report',
    description: 'Run the audit pipeline and return a structured JSON report plus Markdown summary.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        projectPath: { type: 'string' },
        mode: { type: 'string' },
        dryRun: { type: 'boolean' },
        includeVerification: { type: 'boolean' },
        includePlaywright: { type: 'boolean' },
        includeScreenshots: { type: 'boolean' },
        runBuild: { type: 'boolean' },
        timeoutMs: { type: 'integer', minimum: 1000 }
      },
      required: ['projectPath']
    }
  }
];

let isInitialized = false;
let pendingRequests = 0;
let stdinEnded = false;

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

function summarizePayload(toolName, payload) {
  if (toolName === 'generate_report') {
    return payload.markdown;
  }

  return JSON.stringify(payload, null, 2);
}
async function handleToolCall(name, rawParams) {
  const params = ensureObject(rawParams);

  switch (name) {
    case 'inspect_project': {
      const project = await inspectProject(params.projectPath);
      return {
        content: [{ type: 'text', text: summarizePayload(name, project) }],
        structuredContent: project,
        isError: false
      };
    }
    case 'analyze_unused_code': {
      const result = await analyzeUnusedCode(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: result.status === 'command-failed'
      };
    }
    case 'analyze_css': {
      const result = await analyzeCss(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: false
      };
    }
    case 'analyze_bundle': {
      const result = await analyzeBundle(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: result.status === 'build-failed'
      };
    }
    case 'analyze_dependencies': {
      const result = await analyzeDependencies(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: false
      };
    }
    case 'suggest_safe_removals': {
      const result = await suggestSafeRemovals(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: false
      };
    }
    case 'suggest_safe_upgrades': {
      const result = await suggestSafeUpgrades(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: false
      };
    }
    case 'run_verification': {
      const result = await runVerification(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: result.status === 'failed'
      };
    }
    case 'generate_report': {
      const result = await generateReport(params);
      return {
        content: [{ type: 'text', text: summarizePayload(name, result) }],
        structuredContent: result,
        isError: false
      };
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
          listChanged: false
        }
      },
      serverInfo: SERVER_INFO,
      instructions: 'Always start with inspect_project or generate_report in dry-run mode. Never remove code, CSS, or dependencies only because they look unused; require verification plus build and smoke checks before edits.'
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
        isError: true
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
    message.forEach((item) => handleMessage(item));
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
