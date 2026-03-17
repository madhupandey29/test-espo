# Shofy Next.js Local Engineering Workflow

This repo is set up for local Codex-assisted engineering on Windows with Next.js, Playwright, Chrome DevTools MCP, Lighthouse CI, Sentry, OpenTelemetry, Vercel Speed Insights, and a standalone React DevTools launcher.

## Commands

- `npm run build`
  Creates the production build used by `npm run start` and the production-oriented verification flow.
- `npm run dev:inspect`
  Starts the Next.js dev server with the Node inspector enabled so Chrome DevTools or VS Code can attach to the server process.
- `npm run start`
  Starts the built Next.js app on port `3000`.
- `npm run devtools:react`
  Opens the standalone React DevTools app for component inspection while the local app is running.
- `npm run playwright:install`
  Downloads the Playwright Chromium runtime into `.playwright-browsers` so E2E scripts stay self-contained in this repo.
- `npm run test:e2e`
  Runs Playwright against a local dev server started from `npm run dev` using the repo-local browser cache.
- `npm run test:smoke`
  Runs the smoke-tagged Playwright checks for the homepage, fabric listing, and public product detail page.
- `npm run test:e2e:prod`
  Runs Playwright against `npm run start`. Build first with `npm run build`.
- `npm run lhci`
  Runs Lighthouse CI against the local production server started from `npm run start`. Build first with `npm run build`.
- `npm run build:analyze`
  Builds with bundle analysis enabled through `@next/bundle-analyzer`.
- `npm run analyze:nextjs`
  Opens the Next.js 16 experimental bundle analyzer.
- `npm run analyze:nextjs:output`
  Writes the Next.js 16 bundle analyzer report to `.next/diagnostics/analyze`.

## Config Locations

- Codex user MCP config: `%USERPROFILE%\.codex\config.toml`
- Playwright repo config: `playwright.config.ts`
- Playwright tests: `tests/e2e`
- Project-local MCP config: `.mcp.json`
- Lighthouse CI repo config: `.lighthouserc.json`
- Next.js config and bundle analyzer wiring: `next.config.js`
- VS Code launch configs for Chrome/Node debugging: `.vscode/launch.json`
- Next.js instrumentation entrypoint: `src/instrumentation.js`
- Browser-side monitoring bootstrap: `src/instrumentation-client.js`
- Sentry runtime configs: `src/sentry.server.config.js`, `src/sentry.edge.config.js`
- App Router global error capture: `src/app/global-error.jsx`

## Codex MCP Restart Note

The user-level Codex MCP config for `playwright`, `chrome_devtools`, and `figma` lives in `%USERPROFILE%\.codex\config.toml`.

If that file changes, do a full Codex Windows app restart before expecting new MCP servers or arguments to load.

If the file does not change, no restart is needed.

For Next.js MCP specifically, this repo also includes a root `.mcp.json` entry for `next-devtools-mcp`, which allows compatible coding agents to discover the running app through the project itself.

## Monitoring Setup

The project now includes:

- `@sentry/nextjs` for browser, server, edge, and App Router global-error capture
- `@vercel/otel` plus the core OpenTelemetry packages for server startup instrumentation
- `@vercel/speed-insights` mounted in the root layout
- `react-devtools` as a local standalone inspector

Before Sentry starts sending data, set the placeholders added to `.env.example` in your local `.env`.

## Figma MCP Note

Figma is a user-level MCP integration, not a project dependency. If it is not working, the current blocker is usually missing auth in `%USERPROFILE%\.codex\config.toml` or a missing Figma API key for the Codex session.
