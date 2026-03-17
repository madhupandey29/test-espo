---
name: lighthouse-ci
description: Use when the task needs automated Lighthouse regression checks, repeated local runs before merge, CI assertions, score budgets, report upload workflows with Lighthouse CI, or the local `lighthouse_ci` MCP server tools.
---

# Lighthouse CI

Use Lighthouse CI for ongoing regression protection and for merge-quality local checks that need assertions or budgets.

## Prefer the MCP server when available

Use the local `lighthouse_ci` MCP server first when the session exposes it. The MCP tools are the clearest way to run LHCI from Codex because they return structured output and manifest details.

Available MCP tools:

- `lhci_healthcheck`
- `lhci_collect`
- `lhci_assert`
- `lhci_autorun`
- `lhci_upload`
- `lhci_read_manifest`

Always pass the repo root as `cwd`.

## CLI wrapper fallback

If the MCP server is not available in the current session yet, use the bundled PowerShell wrapper to pass through to `@lhci/cli`:

```powershell
powershell -File "$env:CODEX_HOME\skills\lighthouse-ci\scripts\run-lhci.ps1" autorun
```

Pass any standard LHCI arguments after the command:

```powershell
powershell -File "$env:CODEX_HOME\skills\lighthouse-ci\scripts\run-lhci.ps1" `
  collect `
  --url=http://localhost:3000 `
  --numberOfRuns=3
```

## Recommended flow

1. Prefer a production-like local server or preview build.
2. Run `lhci_collect` or `lhci_autorun` with at least 3 runs for merge-quality checks.
3. Add assertions in `lighthouserc.json` when the user wants regression enforcement.
4. Use `lhci_read_manifest` after collection when you need local report paths or upload links.
5. Use upload targets only when the project already has an LHCI server or temporary-public-storage workflow.

## Guardrails

- Use this skill for automation and budgets, not one-off ad hoc diagnosis.
- Keep the audited URL list intentionally small and stable.
- Pair this with `pagespeed-insights` after production deployment if the user also wants field data.
