# Example Prompts

- Inspect this Next.js app first, then use the local next-quality-audit workflow in stage 1 audit mode and summarize safe fixes only.
- Use the next-quality-audit MCP server to analyze unused code, CSS, bundle size, and dependencies for `E:/path/to/project`, then generate a Markdown report.
- Run a dry verification pass for this React project, including lint, typecheck, build, and Playwright smoke if configured.
- Suggest safe dependency removals and safe patch upgrades, but do not edit code yet.
- Run stage 4 visual verification for this Next.js app and tell me which pages need screenshot coverage before safe cleanup work.
