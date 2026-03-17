# PurgeCSS MCP Server Setup

This repository now includes a reusable PurgeCSS MCP server:

- Server file: `scripts/mcp-purgecss-server.mjs`
- Tool name: `purge_css`

## Use In This Project

This project is already configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "purgecss": {
      "command": "node",
      "args": ["scripts/mcp-purgecss-server.mjs"]
    }
  }
}
```

## Reuse In Any Project

In another project's MCP config, point to this server using an absolute path:

```json
{
  "mcpServers": {
    "purgecss": {
      "command": "node",
      "args": [
        "E:/SoftwareDevelopment/Shopy4/front-end/espo-shofy-final-project-07march2026/scripts/mcp-purgecss-server.mjs"
      ]
    }
  }
}
```

## Tool Inputs

- `projectPath` (optional): target project root, defaults to process cwd.
- `contentGlobs` (optional): files to scan for used selectors.
- `cssGlobs` (optional): CSS files to purge.
- `ignoreGlobs` (optional): ignored files/folders.
- `safelist` (optional): selectors always kept.
- `blocklist` (optional): selectors always removed.
- `includeRejected` (optional, default true): include removed selectors metadata.
- `outputFile` (optional): write merged optimized CSS relative to `projectPath`.

## Quick Example

Use the MCP tool with:

```json
{
  "projectPath": "E:/SoftwareDevelopment/Shopy4/front-end/espo-shofy-final-project-07march2026",
  "contentGlobs": ["src/**/*.{ts,tsx,js,jsx,html}"],
  "cssGlobs": ["src/**/*.css"],
  "outputFile": "output/purged.css"
}
```
