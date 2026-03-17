---
name: purgecss
description: Use when the task is to identify unused CSS selectors, shrink CSS bundles, review whether stylesheet rules are still referenced by HTML or JS/TS/JSX/TSX templates, or safely remove dead CSS with PurgeCSS through the local `purgecss_local` MCP server or the bundled CLI wrapper.
---

# PurgeCSS

Use this skill to find and remove unused CSS selectors from frontend projects.

## Prefer the MCP server when available

Use the local `purgecss_local` MCP server first when the session exposes it. The MCP tools return structured results and support dry runs before writing changes.

Available MCP tools:

- `purgecss_healthcheck`
- `purgecss_analyze`
- `purgecss_apply`

Always pass the project root as `cwd`.

## CLI wrapper fallback

If the MCP server is not available in the current session, use the bundled PowerShell wrapper:

```powershell
powershell -File "$env:CODEX_HOME\skills\purgecss\scripts\run-purgecss.ps1" `
  -Css "src/styles/app.css" `
  -Content "src/**/*.tsx","public/**/*.html" `
  -Rejected
```

Set `-WriteChanges` only after reviewing the dry-run result:

```powershell
powershell -File "$env:CODEX_HOME\skills\purgecss\scripts\run-purgecss.ps1" `
  -Css "src/styles/app.css" `
  -Content "src/**/*.tsx","public/**/*.html" `
  -WriteChanges `
  -Backup
```

## Recommended flow

1. Start with `purgecss_analyze` to inspect one stylesheet at a time.
2. Include all template and component paths that can generate class names.
3. Add a safelist for dynamic classes, state classes, animation hooks, CMS content, and library-owned selectors.
4. Review rejected selectors before writing changes.
5. Use `purgecss_apply` only when the report looks correct.

## Guardrails

- Prefer a dry run before editing files.
- Treat dynamic class names as risky unless they are safelisted.
- Keep backups enabled when writing changes into tracked files.
- Re-run app smoke tests after cleanup because PurgeCSS cannot infer runtime-only selectors.