# Next Quality Audit Report

## Summary
- Project: E:\SoftwareDevelopment\Shopy4\front-end\espo-shofy-final-project-07march2026
- Package manager: npm
- Router: app-router
- Styling: Tailwind, Sass, CSS Modules, Global CSS
- Safe first actions: 0
- Needs review: 13

## Unused Dependencies
- none

## Unused Files
- .codex-staging/mcp-servers/lighthouse-ci/server.js
- .codex-staging/mcp-servers/next-quality-audit/cli.js
- .codex-staging/mcp-servers/next-quality-audit/server.js
- .codex-staging/mcp-servers/purgecss/server.js
- src/utils/__tests__/productStructuredData.test.js
- .codex-staging/mcp-servers/next-quality-audit/lib/audits.js
- .codex-staging/mcp-servers/next-quality-audit/lib/exec.js
- .codex-staging/mcp-servers/next-quality-audit/lib/project-intel.js
- .codex-staging/mcp-servers/next-quality-audit/lib/report.js

## Unused Exports
- none

## Risky CSS Cleanup Candidates
- public/assets/css/animate.css (large global stylesheet)
- public/assets/scss/layout/ecommerce/_productDetails.scss (large global stylesheet)
- public/assets/scss/components/_offcanvas.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/pages/_slider.scss (legacy or global stylesheet should be reviewed before cleanup)
- src/app/globals.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/blog/_postbox.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/ecommerce/_product.scss (legacy or global stylesheet should be reviewed before cleanup)
- src/components/chatbot/FloatingChatbot.scss (global stylesheet may contain dynamic selectors)
- public/assets/scss/layout/pages/_profile.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/menu/_categoryMenu.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/header/_header-5.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/menu/_menu.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/ecommerce/_banner.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/ecommerce/_category.scss (legacy or global stylesheet should be reviewed before cleanup)
- public/assets/scss/layout/ecommerce/_checkout.scss (legacy or global stylesheet should be reviewed before cleanup)

## Large JS Bundles
- 164f4fb6.96b9f50d9f5f168e.js (330491 B)
- 4bd1b696-96fa2570c3ed041f.js (198840 B)
- 3794-b4e05dddc9f64f63.js (190763 B)
- framework-7e54adbbc2ea18ad.js (140116 B)
- main-be594706ce6a5d1b.js (130666 B)
- polyfills-42372ed130431b0a.js (112594 B)
- 5135.cd14a1151e4cc5ec.js (106486 B)
- 4561-2ff583cd3838a152.js (80271 B)
- 2018-20c59523f480bef6.js (65571 B)
- 1001-c7786fe7436a77c7.js (53310 B)
- 345-a0699c737033b992.js (51406 B)
- 3820-20b8e5622bbd6a9f.js (47222 B)
- 280273a7.560b210d0885bf74.js (45648 B)
- 8394-95b65f3ea7b1da73.js (37856 B)
- 5724-b32d17ef63f51df1.js (31225 B)

## Recommended Package Upgrades
- @typescript-eslint/eslint-plugin: 8.56.1 -> 8.57.0 [medium]
- @typescript-eslint/parser: 8.56.1 -> 8.57.0 [medium]

## Safe First Actions
- none

## Medium-Risk Actions
- Review dead-file candidate .codex-staging/mcp-servers/lighthouse-ci/server.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/cli.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/server.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/purgecss/server.js with route and runtime checks before deletion.
- Review dead-file candidate src/utils/__tests__/productStructuredData.test.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/lib/audits.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/lib/exec.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/lib/project-intel.js with route and runtime checks before deletion.
- Review dead-file candidate .codex-staging/mcp-servers/next-quality-audit/lib/report.js with route and runtime checks before deletion.
- Review CSS candidate public/assets/css/animate.css (large global stylesheet) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/ecommerce/_productDetails.scss (large global stylesheet) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/components/_offcanvas.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/pages/_slider.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate src/app/globals.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/blog/_postbox.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/ecommerce/_product.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate src/components/chatbot/FloatingChatbot.scss (global stylesheet may contain dynamic selectors) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/pages/_profile.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/menu/_categoryMenu.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/header/_header-5.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/menu/_menu.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/ecommerce/_banner.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/ecommerce/_category.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review CSS candidate public/assets/scss/layout/ecommerce/_checkout.scss (legacy or global stylesheet should be reviewed before cleanup) with safelists before any PurgeCSS apply step.
- Review minor upgrade for @typescript-eslint/eslint-plugin from 8.56.1 to 8.57.0.
- Review minor upgrade for @typescript-eslint/parser from 8.56.1 to 8.57.0.

## Actions Requiring Human Review
- Major upgrade review required for @hookform/resolvers (3.10.0 -> 5.2.2).
- Major upgrade review required for @types/node (24.12.0 -> 25.5.0).
- Major upgrade review required for @types/react (18.3.28 -> 19.2.14).
- Major upgrade review required for @types/react-dom (18.3.7 -> 19.2.3).
- Major upgrade review required for @vercel/speed-insights (1.3.1 -> 2.0.0).
- Major upgrade review required for eslint (9.39.4 -> 10.0.3).
- Major upgrade review required for postcss-preset-env (10.6.1 -> 11.2.0).
- Major upgrade review required for react (18.3.1 -> 19.2.4).
- Major upgrade review required for react-dom (18.3.1 -> 19.2.4).
- Major upgrade review required for swiper (11.2.10 -> 12.1.2).
- Framework-critical package eslint needs explicit review (9.39.4 -> 10.0.3).
- Framework-critical package react needs explicit review (18.3.1 -> 19.2.4).
- Framework-critical package react-dom needs explicit review (18.3.1 -> 19.2.4).

## Commands Used
- E:\SoftwareDevelopment\Shopy4\front-end\espo-shofy-final-project-07march2026\node_modules\.bin\knip.cmd --reporter json
- npm.cmd outdated --json
- npm.cmd audit --omit=dev --json

## Files Touched
- none

## Rollback Guidance
- Commit before autofix or dependency changes.
- Keep build output and smoke-test evidence for before/after review.
- Revert only the targeted batch if verification fails.