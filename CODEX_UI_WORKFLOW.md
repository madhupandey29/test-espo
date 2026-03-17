# Codex UI Review Workflow

This project is a product-led fabric catalogue, so the first UI review pass should focus on the pages that shape a visitor's first impression and product discovery path.

## How to use this later with Codex and Figma

1. Map the design system basics first:
   typography scale, brand colors, spacing rhythm, buttons, cards, filters, breadcrumbs, and form controls.
2. Capture the current live states from the repo:
   homepage, `/fabric`, a representative `/fabric/[slug]` product page, and the fallback `/product-details?id=...` page.
3. Compare implementation against Figma in small batches:
   layout structure, heading hierarchy, card consistency, filter affordances, tap targets, and responsive behavior.
4. Review interactive states after static parity:
   hover states, sticky headers/toolbars, product-card actions, filters, skeleton/loading states, and empty states.

## Design tokens and components to map first

- Typography:
  the header/navigation scale, product card titles, breadcrumb text, button labels, and section headings.
- Spacing:
  page gutters, card padding, grid gaps, filter panel spacing, and breadcrumb offsets.
- Components:
  header, footer, fabric product cards, shop filter sidebar, sort toolbar, breadcrumbs, and product detail content blocks.
- Visual assets:
  logo usage, hero imagery, product imagery ratios, collection media blocks, and icon sizing.

## Screens to review first

- `/`
  Validate hierarchy, hero clarity, navigation prominence, and the path into the fabric catalogue.
- `/fabric`
  Review grid density, filter usability, sticky toolbar behavior, and how quickly users can scan products.
- `/fabric/[slug]`
  Check breadcrumb clarity, product identity, information grouping, and media presentation.
- `/product-details?id=6431364df5a812bd37e765ac`
  Compare this legacy detail route with the slug route so both stay visually and semantically aligned.
- `/login` and `/profile`
  Review later with real credentials because account flows will need authenticated test data.
