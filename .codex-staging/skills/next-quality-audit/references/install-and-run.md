# Install And Run

## Recommended project-side tools

Install only the tools you want to use.

### npm

```powershell
npm install -D knip @next/bundle-analyzer
npm install -D @biomejs/biome
```

### pnpm

```powershell
pnpm add -D knip @next/bundle-analyzer
pnpm add -D @biomejs/biome
```

### yarn

```powershell
yarn add -D knip @next/bundle-analyzer
yarn add -D @biomejs/biome
```

Playwright, ESLint, and TypeScript compiler checks are used only if they are already configured in the target project.

## Connect the MCP server

Use the example at `../../mcp-servers/next-quality-audit/templates/codex-mcp.json.example` and point it at:

```text
.codex-staging/mcp-servers/next-quality-audit/server.js
```

## CLI stage examples

```powershell
node .codex-staging/mcp-servers/next-quality-audit/cli.js stage1-audit --project-path . --output-json .codex-staging/reports/quality-audit.json --output-md .codex-staging/reports/quality-audit.md
node .codex-staging/mcp-servers/next-quality-audit/cli.js stage2-safe-autofix --project-path .
node .codex-staging/mcp-servers/next-quality-audit/cli.js stage3-guided-upgrades --project-path .
node .codex-staging/mcp-servers/next-quality-audit/cli.js stage4-visual-verification --project-path . --include-screenshots
```

## MCP tool sequence

1. `inspect_project`
2. `analyze_unused_code`
3. `analyze_css`
4. `analyze_bundle`
5. `analyze_dependencies`
6. `suggest_safe_removals`
7. `suggest_safe_upgrades`
8. `run_verification`
9. `generate_report`

## Limitations

- Knip, Biome, and visual tests can produce false positives or project-specific noise.
- Unused CSS findings should be treated as candidates, not auto-delete instructions.
- Bundle analysis without route-level stats is a heuristic; verify with Lighthouse or bundle analyzer output.
- Outdated dependency output differs slightly across npm, pnpm, and yarn.
