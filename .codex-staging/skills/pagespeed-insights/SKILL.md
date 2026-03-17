---
name: pagespeed-insights
description: Use when the task needs post-deploy checks on a public URL with PageSpeed Insights, especially when the user wants Lighthouse lab data plus Chrome UX Report field data or wants to query a PageSpeed Insights MCP server or API.
---

# PageSpeed Insights

Use this skill after deployment on a public URL. PageSpeed Insights is the right tool when the user wants real-user field data from CrUX in addition to Lighthouse lab results.

## Workflow

1. Confirm the URL is publicly reachable.
2. Prefer the `pagespeed` MCP server when it is available in the session.
3. Use the bundled API wrapper when a direct API response is more useful than an MCP interaction.
4. Compare mobile and desktop separately.

## Wrapper

Use the bundled PowerShell script for direct API calls:

```powershell
powershell -File "$env:CODEX_HOME\skills\pagespeed-insights\scripts\run-psi.ps1" `
  -Url "https://example.com" `
  -Strategy mobile `
  -OutputFile "output/pagespeed/mobile.json"
```

## Notes

- Field data may be missing on newer or lower-traffic pages.
- PSI is not a substitute for CI gating; use `lighthouse-ci` for regression enforcement.
- PSI cannot audit localhost or private preview URLs.
