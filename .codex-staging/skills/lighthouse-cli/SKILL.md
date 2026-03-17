---
name: lighthouse-cli
description: Use when the task needs repeatable local Lighthouse CLI audits, saved HTML or JSON reports, or multiple local runs against localhost, preview URLs, or staging builds before merge or deployment.
---

# Lighthouse CLI

Use Lighthouse CLI for repeatable local lab runs and archived reports. This skill is the best fit for pre-merge checks where a single DevTools run is not enough.

## Prerequisites

- Confirm `npx` is available before using the wrapper.
- Prefer auditing a production-like build, not a hot-reloading dev server, when the user wants merge-quality numbers.

## Wrapper

Use the bundled PowerShell wrapper:

```powershell
powershell -File "$env:CODEX_HOME\skills\lighthouse-cli\scripts\run-lighthouse.ps1" `
  -Url "http://localhost:3000" `
  -Runs 3 `
  -Preset desktop
```

The wrapper writes `html` and `json` reports to `output/lighthouse/` by default.

## Recommended flow

1. Point the audit at the exact route the user cares about.
2. Run at least 3 local audits for merge-quality checks.
3. Compare medians or look for repeated regressions instead of overreacting to one noisy run.
4. Keep the same preset and categories across comparisons.

## Common examples

Desktop run:

```powershell
powershell -File "$env:CODEX_HOME\skills\lighthouse-cli\scripts\run-lighthouse.ps1" `
  -Url "http://localhost:3000/products" `
  -Runs 3 `
  -Preset desktop
```

Mobile run with extra flags:

```powershell
powershell -File "$env:CODEX_HOME\skills\lighthouse-cli\scripts\run-lighthouse.ps1" `
  -Url "http://localhost:3000" `
  -Runs 3 `
  -Preset mobile `
  -ExtraArgs "--only-categories=performance","--throttling-method=simulate"
```

## Guardrails

- Use Incognito and keep local machine conditions stable when you need cleaner comparisons.
- Prefer `lighthouse-ci` once the user wants assertions, budgets, or automation.
