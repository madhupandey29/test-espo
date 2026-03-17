---
name: chrome-devtools-lighthouse
description: Use when the task needs quick Lighthouse checks during coding on local, preview, or authenticated pages through the Chrome DevTools MCP server, especially for iterative performance, accessibility, SEO, and best-practices debugging.
---

# Chrome DevTools Lighthouse

Use the existing `chrome_devtools` MCP server for fast, interactive audits while coding. This is the best fit for local URLs, preview builds, authenticated flows, and page states that are awkward to test from a public endpoint.

## Workflow

1. Open or select the target page with the Chrome DevTools MCP tools.
2. Resize or emulate device or network conditions when the task needs a mobile or constrained profile.
3. Run `lighthouse_audit`.
4. Review the report and inspect the page again if you need DOM, console, or network context.
5. Re-run after changes. For noisy performance numbers, run more than once before drawing conclusions.

## When to switch tools

- Use the `lighthouse-cli` skill when you need saved local reports or multiple repeatable runs before merge.
- Use the `pagespeed-insights` skill when the URL is public and the user wants CrUX field data.
- Use the `lighthouse-ci` skill when the goal is regression detection, assertions, or CI gating.

## Guardrails

- Prefer this skill during development, not as the final merge gate.
- Treat single-run performance scores as directional.
- Keep comparisons apples-to-apples by using the same route, device mode, and throttling assumptions.
