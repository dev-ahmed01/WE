# Workspace by Emlen — Navigation audit and implementation

## Scope
Four existing public pages, with no new page types and no modifications to hero, section order, enquiry forms, illustrations, or existing animations:

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | Introduction and overview |
| Workspaces | `/workspaces/` | Workspace solutions overview |
| Managed Offices | `/managed-office/south-bangalore/` | Category page |
| One-Person Office | `/managed-office/one-person-office/` | Detail/sub-solution |

## Findings in the shipped website

1. The primary header labels changed meaning between pages. Some pages offered page-level navigation while others offered only in-page anchors.
2. The Managed Offices header sent both “Locations” and “Workspaces” to `#offices`.
3. The Managed Offices One-Person Office tile used `href="#enquiry"` although a complete detail page exists.
4. Home and Workspaces hid primary links at narrow breakpoints without introducing an equivalent mobile page-navigation menu.
5. Current-page indication, page hierarchy, and return paths were inconsistent.
6. Footer links connected all four pages, but those links were not consistently available in the primary navigation.

## Implemented solution

- Shared cross-page primary links on **every** page: Home, Workspaces, Managed Offices, One-Person Office.
- The redundant “On this page” dropdown is removed from the global header; in-page sections remain reachable by scrolling and existing contextual links.
- Active-page indication with `aria-current="page"`; keyboard-visible focus styles.
- One-Person Office category tile routes to its dedicated detail page; remaining tiles keep their existing enquiry logic because no detail pages exist for them yet.
- Restored a lighter, genuinely translucent liquid-glass header: lower-alpha layered surface, backdrop blur/saturation, fine edge highlights, and softer shadow. Uses Poppins navigation type, subdued red current-state and a yellow enquiry CTA.
- Replaced the dropdown with a direct **Call now** phone link (existing business number: `+91 98149 53954`, `tel:+919814953954`). Mobile links include both Call now and Enquire now.
- Escape/outside click closes the mobile menu; reduced-motion support remains.
- The old header remains in the DOM but becomes inert and visually hidden **only after** the shared replacement successfully initializes, preserving dependent page scripts and the page's existing layout geometry.
- No new site sections or changes to the CMS, hosting, Caddy, or APIs.

## Source and maintenance

- `source/site-navigation.js` — page map, in-page anchors, menu behavior.
- `source/site-navigation.css` — responsive shared design system.
- `tools/build.py` — writes those two files to `public/assets/` and links them on all four pages; also fixes the One-Person Office card route.
- `tools/check_navigation.js` — validates all route entries, real section anchors, asset inclusion and the card link.
- `tools/test_navigation.js` — desktop/mobile browser navigation smoke tests.

Do **not** edit generated `public/` files by hand: `python tools/build.py` regenerates them from `source/`.

## Acceptance checks

- All four pages build and pass existing link validation.
- All four headers contain direct links to all four pages.
- Exactly one page link shows `aria-current="page"`.
- Desktop Call now invokes the existing contact number; no “On this page” item appears.
- Mobile menu opens, exposes all four routes plus Call now and Enquire now, and navigates across pages.
- Enquire now points to a real on-page form.
- Category One-Person Office tile opens its detail page.
- No navbar horizontal overflow at desktop or mobile viewports.
- The existing visual sections and their interactions remain unchanged.

## Future content policy

Add a primary navigation route only after the corresponding public page is implemented. Until then, other office products continue to direct visitors to the enquiry form, avoiding dead links.
