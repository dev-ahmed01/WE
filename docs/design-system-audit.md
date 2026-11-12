# Workspace by Emlen — Design System Audit

Site: https://workspacebyemlen.co.uk/ · Repo: `dev-ahmed01/WE`
Four pages, each built from its own hand-written HTML + inline `<style>` block
(`source/WE_Home_v28_Audited.html`, `WE_property_v6.html`, `WE_Category.html`,
`WE_Solution.html`). Because each page's CSS was authored independently, the
same visual "element type" often has a different shape on every page. This
doc catalogues what was found, what "canonical" now means for each element
type, and what has been fixed vs. what's flagged for a follow-up pass.

## How to read this

For each element type: **Found** = the distinct variants that existed across
the 4 pages before this pass. **Canonical** = the single spec chosen.
**Status** = done in this pass, or flagged for later (with why).

---

## 1. CTA Button (primary / solid red)

**Found** — corner radius alone had 6 different values across pages:
`999px` (pill), `20px`, `18px`, `17px`, `16px`, and effectively square via
flex sizing. Shadows ranged from `0 12px 24px` to `0 18px 34px` blur, alpha
from `.15` to `.7`, some with a negative Y-offset (lifted look), some
without.

| Page | Selector | Radius (before) | Shadow (before) |
|---|---|---|---|
| Home | `.cta` | 16px | `0 18px 34px -16px rgba(237,32,36,.7)` |
| Home | `.btn-red` | 999px | `0 14px 28px rgba(237,32,36,.26)` |
| Home | `.fm button` | 999px | `0 14px 26px -14px rgba(237,32,36,.7)` |
| Workspaces | `.solid-btn` | 999px | `0 16px 28px rgba(237,32,36,.2)` |
| Category | `.button` | 17px | `0 13px 30px rgba(237,32,36,.17)` |
| Category | `.checklist-cta` | 18px | `0 12px 28px rgba(237,32,36,.16)` |
| Category | `.subscribe-btn`/`.callback-btn` | 16px | `0 12px 25px rgba(237,32,36,.15)` |
| One-Person | `.submit-btn` | 16px | `0 13px 23px rgba(237,32,36,.16)` |
| One-Person | `.cz-cta` | 16px | `0 12px 24px rgba(190,20,24,.32)` |

**Canonical:**
```
border-radius: 999px;
box-shadow: 0 14px 28px -14px rgba(237,32,36,.35);
background: #ED2024 (var(--red));
color: #fff;
font-weight: 700;
```
(Compact/full-width variants keep their own padding — a "Request a
Callback" full-width button and an inline "Enquire now" button are
legitimately different sizes — but now share radius, color and shadow.)

**Status: ✅ Fixed** across all 4 pages (9 rules edited, radius + shadow
unified, no padding/layout changes — zero regression risk, verified with
screenshots).

---

## 2. CTA Button (secondary / ghost)

**Found:** `.btn-line` (home), `.ghost-btn` (workspaces), `.we-mt__cta`,
`.we-btn--line` — all already pill-shaped (999px) with a translucent
background + thin border, which is good. Padding varies 15px 22–26px
(minor), border color/opacity tuned per background (white glass over red
vs. dark hairline over cream) — this variance is **intentional** (same
button needs a different border treatment on a dark vs. light background),
so it was left alone.

**Status:** ✅ Already consistent in shape; no change needed.

---

## 3. CTA Button (compact / in-card — map pins, lightbox, popovers)

**Found:** `.location-details-cta`, `.we-pop__cta`, `.we-lc__cta`,
`.lx-btn` — already 999px pill with red fill, shadows in the same family
(`rgba(237,32,36,.25–.28)`, 24–26px blur). This is the one category that
was **already reasonably uniform** — the differences are sub-pixel and not
visually noticeable.

**Status:** Left as-is (would be cosmetic over-polishing).

---

## 4. Nav CTA (header "Enquire now" style buttons)

**Found:** base (desktop) padding/font-size differs slightly per page —
Workspaces `15px 28px / 15px`, Category `15px 25px / 14px / weight 700`,
One-Person `13px 25px / 14px`. All already pill-shaped with the brand
yellow. Each page's own responsive breakpoints (tablet/mobile shrink
values) are tuned per that page's nav layout and were **not** touched —
changing those without per-page visual QA risks nav items wrapping or
overlapping at specific breakpoints.

**Status:** Flagged, not changed this pass — low visual impact, higher
regression risk relative to benefit. Candidate for a dedicated nav-polish
pass with breakpoint-by-breakpoint screenshots.

---

## 5. Pills / Tags / Chips (filters, category tags, landmark chips)

**Found:** almost all already `border-radius: 999px` — good. One outlier:
Category page's `.other-pill` (the dark "Emergency office / Specialist
office" tags) was `18px`, breaking the pill pattern used everywhere else.

**Canonical:** `border-radius: 999px` for every pill/chip/tag, regardless
of background treatment (solid, glass, gradient).

**Status: ✅ Fixed** (`.other-pill` radius corrected).

---

## 6. Eyebrow / Sub-heading label (small label above a heading)

**Found:** font-size ranges 11–15px, letter-spacing ranges `.08em` to
`.3em` across pages — e.g. Category's `.eyebrow` is 15px/`.2em` while
One-Person's is 12px/`.15em` and Workspaces' `.mini-eyebrow` is 11px.

**Canonical (proposed, not yet applied):**
```
font-size: 12px; font-weight: 700; letter-spacing: .14em;
text-transform: uppercase; color: var(--red);
```

**Status:** ⚠️ Flagged, not applied. Font-size/letter-spacing changes
affect line length and can cause wrapping in hand-tuned hero/section
layouts — this needs a visual pass per section (take a screenshot, apply,
re-check), not a blind find-and-replace. Recommend as the next phase.

---

## 7. Section / Main Heading (H1, H2)

**Found:** headings already share the same two font families
(`Bricolage Grotesque` for headings, `Poppins` for body) across all 4
pages — good foundation. But weight/letter-spacing/line-height differ:

| Page | Weight | Letter-spacing | Line-height |
|---|---|---|---|
| Home | 800 | -.055em | 1.03 |
| Workspaces | 800 | -.06em | 1.03 |
| Category | 750 | -.055em | 1.08 |
| One-Person | 800 | -.064em | 1.06 |

Category also names its font variable `--header` while the others use
`--heading`/`--head` — same font, inconsistent naming (no visual bug, but
worth aligning for maintainability).

**Status:** ⚠️ Flagged, not applied. Font-size clamps and weight are
load-bearing for each page's hand-tuned hero layout (overflow/wrapping
risk). Recommend fixing in a dedicated pass with before/after screenshots
per hero.

---

## 8. Content Heading (H3 — card titles, "Move in, switch on" etc.)

Not separately audited this pass — same font family throughout, but
likely has the same weight/size drift as H1/H2 above. Bundle into the
heading-harmonization follow-up.

---

## 9. Text / Body copy

Uses `Poppins` consistently across all pages (one page adds a `'Segoe UI'`
fallback, harmless). No major issue found; not touched.

---

## 10. Icon Card (value-prop cards, "Move in, switch on" etc.)

Cards use a plus-shaped mark rather than icon-library icons (see note in
your working notes about a single red plus-marker to replace icons
site-wide) — visible on the home page's four value cards. This is a
**separate, larger design task** (auditing every card's icon slot and
swapping to one consistent plus-marker across all 4 pages) and was out of
scope for this pass — flagged for its own session so it can get proper
visual QA per card.

---

## 11. Background Image Card (location cards, office-type cards)

Location cards (home) and office-type cards (category) both use a
photo + gradient-scrim + label pattern, already structurally similar
(gradient scrim bottom-to-top, pill label with arrow icon bottom-left).
Radius and scrim darkness weren't compared in this pass — candidate for
the next audit round.

---

## 12. Background (section backgrounds, gradients)

Not audited this pass (large surface area, needs per-section screenshots
to compare gradient angles/stops meaningfully). Flagged for follow-up.

---

## 13. Bullet points

Not located as a distinct styled list in the 4 pages scanned (content
tends to use short card copy rather than bulleted lists, except the Emlen
App section's 3 feature bullets). Flagged — needs its own pass once
located precisely in each page.

---

## 14. Section padding / margin

Not touched this pass. Each page defines its own section rhythm; comparing
and unifying vertical section spacing needs full-page screenshots (not
just the CTA crops used to verify this pass) to avoid breaking the visual
balance of each hand-tuned layout.

---

## Summary

| Element | Status |
|---|---|
| Primary CTA button (radius + shadow) | ✅ Fixed, 4/4 pages |
| Secondary/ghost button | ✅ Already consistent |
| Compact in-card CTA | ✅ Already consistent |
| Pills / tags | ✅ Fixed (1 outlier) |
| Nav CTA | ⚠️ Flagged — needs breakpoint QA |
| Eyebrow labels | ⚠️ Flagged — needs per-section QA |
| H1 / H2 / H3 | ⚠️ Flagged — needs per-hero QA |
| Icon cards (plus-marker rollout) | ⚠️ Separate task |
| Background-image cards | ⚠️ Not yet audited |
| Backgrounds/gradients | ⚠️ Not yet audited |
| Bullet points | ⚠️ Not yet located/audited |
| Section padding/margin | ⚠️ Not yet audited |

This pass deliberately fixed the items that were **both** clearly broken
(visibly mismatched corner radii / shadow weights) **and** safe to change
without visual regression (radius and shadow don't affect box size or
text flow). Typography and spacing changes are flagged rather than forced
through blind, because clamp()-based font sizes and section rhythm were
hand-tuned per page and a wrong value can silently overflow or wrap on a
specific breakpoint — those need a screenshot-verified pass, ideally one
page at a time.
