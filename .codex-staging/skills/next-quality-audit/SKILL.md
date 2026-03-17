---
name: next-quality-audit
description: Local React and Next.js quality audit workflow for unused code, unused CSS, dead files or exports, bundle size analysis, dependency review, and safe verification. Use when Codex needs to inspect a frontend project first, classify safe versus review-required cleanup, generate reports, or drive a dry-run-first optimization workflow without changing business logic.
---

# Next Quality Audit

Inspect the target project before running any cleanup. Read `package.json`, `tsconfig`, ESLint config, Next config, Playwright config, and the main `app/` or `pages/` structure first.

## Workflow

1. Detect the package manager from the existing lockfile. Prefer the project's own toolchain.
2. Detect whether the app uses Next.js App Router or Pages Router.
3. Detect styling patterns: Tailwind, Sass, CSS Modules, styled-components, and global CSS.
4. Start with audit-only mode. Prefer `generate_report` from the MCP server, or the wrapper script in `scripts/run-next-quality-audit.ps1` if MCP is not connected yet.
5. Separate findings into:
   - safe
   - medium-risk
   - manual-review
6. Verify every change with build and smoke checks before treating it as safe.

## Stages

### Stage 1

Run audit only. Do not edit code. Collect unused-code findings, CSS risks, bundle clues, and dependency upgrade suggestions.

### Stage 2

Allow only low-risk autofix steps such as `lint:fix` or `biome check --write`, and only when explicitly allowed. Do not auto-delete files, exports, CSS, or dependencies.

### Stage 3

Guide dependency upgrades. Prefer patch-safe upgrades first. Treat framework-critical packages and major upgrades as human-review items.

### Stage 4

Run verification. Include lint, typecheck, build, Playwright smoke, and Playwright visual checks when the project already has those tests.

## Safety Rules

- Never remove code only because it looks unused without verification.
- Never bulk-upgrade packages blindly.
- Never change checkout, cart, auth, account, pricing, payment, order flows, API contracts, ISR or revalidation behavior, routing, SEO tags, schema markup, analytics, or business logic automatically.
- Treat route files, metadata files, middleware, and API handlers as protected until proven safe.
- Use PurgeCSS only for legacy or global CSS, and require safelists for dynamic selectors.
- Prefer reports and patch suggestions before edits.

## Execution Paths

- Prefer the local MCP server at `../../mcp-servers/next-quality-audit/server.js` when the client supports MCP.
- Use `scripts/run-next-quality-audit.ps1` as the CLI fallback.
- Read `references/install-and-run.md` when you need install commands, MCP wiring, or stage examples.

## Output Expectations

Return a report with:
- summary
- unused dependencies
- unused files
- unused exports
- risky CSS cleanup candidates
- large JS bundles and client components
- recommended package upgrades
- safe first actions
- actions requiring human review
- commands used
- files touched
- rollback guidance
