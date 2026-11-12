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

## Summary (Pass 1)

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

---

## Pass 2 — headings, bullets, cards, spacing tokens

A second pass went through the categories flagged above. The guiding
principle throughout: **uniform system, contextual sizing.** A hero H1
and a testimonial card's H3 are supposed to be different sizes — that's
not a bug. What should be uniform is the *rules* underneath every size:
the same weight, the same letter-spacing curve, the same marker shape —
not literally identical pixel values regardless of context (that would
actively break layouts tuned for their own content).

### 15. Headings — weight & letter-spacing (H1–H4, all 4 pages)

**Found:** 300+ individual heading rules across the 4 pages (every hero,
card title, modal heading, stat number has its own rule — expected, since
each is sized for its own container). Within that, two real system-level
bugs:
- **Font-weight drift:** mostly `800`, but `750` and `650` leaked in on
  Category and One-Person pages for no reason (not a deliberate lighter
  tier — just inconsistency).
- **Letter-spacing drift:** two headings of near-identical size would get
  different tracking on different pages (e.g. two ~50px headings at
  `-.05em` on one page, `-.07em` on another) with no content reason.

**Canonical:** `font-weight: 800` everywhere. Letter-spacing follows one
formula by size tier (tighter tracking as text gets bigger):
```
≥70px   → -.06em
50–69px → -.055em
34–49px → -.05em
24–33px → -.045em
<24px   → -.035em
```
Font-size and line-height were **left untouched** — those are legitimately
content-dependent and the highest risk to touch blind.

**Status: ✅ Fixed.** 7 font-weight fixes + 60 letter-spacing fixes applied
programmatically across all 4 pages (media-query/`!important` breakpoint
overrides were skipped — those are deliberate per-breakpoint tuning, not
bugs). Verified with a full regression pass: `document.scrollWidth ===
clientWidth` on every page at desktop/tablet/mobile (no new overflow), no
JS errors, and the project's own `tools/audit.js` shows no new issues.

### 16. Bullet points (font, color, icon)

**Found:** 5 distinct bullet-list styles across the site, all doing the
same job ("feature included" lists) with completely different markers:

| List | Page | Marker (before) |
|---|---|---|
| `.ap-ls` | Home (Emlen App section) | 22px dark circle + white check icon |
| `.bn-points` | Category / One-Person (dark "Enterprise" card) | 18px accent circle + drawn checkmark |
| `.consult-points` | Category | 8px plain red dot, no check |
| `.highlights` | One-Person | plain red "✓" character, no circle |
| `.lm-points` | One-Person | 5px plain red dot, no check |

**Canonical:** 18px red circle (`var(--red)`) with a white checkmark icon
(the same SVG already used by `.ap-ls`), `font-weight: 600` for the list
text. `.bn-points` (the one list that sits on a dark/yellow-themed card)
keeps its own accent color — same shape, contextual color, same logic as
the ghost button.

**Status: ✅ Fixed**, all 4 plain-background lists now share one marker.
Verified visually (cropped screenshots of each list, before/after).

### 17. Icon Card (plus-marker rollout)

**Found:** Home's 4 value-prop cards (`.cd`) already use a custom
plus-mark icon (one arm highlighted in yellow) — this matches your
stated preference to reuse that mark everywhere instead of icon-library
glyphs. The equivalent cards on other pages have **no icon at all**:
Workspaces' `.benefit-card` (3 cards) and One-Person's `.value-card`
(4 cards) are bare `h3` + `p`, no header, no icon slot.

**Status: ⚠️ Scoped, not implemented this pass.** This isn't a CSS value
fix — it needs new markup (a header wrapper + inline SVG) inserted into
each card. One-Person's `.value-card` in particular already has its own
hover/reveal interaction system (`--ct`/`--cr`/`--cb`/`--cl` custom
properties driving a per-side color transition, plus a JS-driven
"copy-reveal" state) — inserting new markup there without first reading
the associated JS risks breaking that interaction. This needs its own
pass: read the hover-state JS for `.value-card`, design the icon-header
markup to not conflict with it, then roll out to `.benefit-card` (lower
risk, no JS dependency) and `.value-card` (higher risk) separately, with
screenshots of the hover state before/after each.

### 18. Card shells (radius / padding / shadow)

**Found:** Checked radius across every major card type
(`.cd`, `.benefit-card`, `.value-card`, `.highlight-card`, `.bn-card`,
location/testimonial cards) — unlike buttons, these were already in a
fairly tight, reasonable range (19–34px depending on card size), with no
"16px vs 999px"-style outlier. Category's `.bn-card` is a distinct richer
component (flip animation, photo, its own benefit list) — structurally a
different thing from the simple icon-card family, not a uniformity bug.

**Status:** No changes made — nothing here was actually broken.

### 19. Section spacing — token scale

**Found:** Category and One-Person already define a shared spacing scale
(`--sp-1` through `--sp-8` = 8/16/24/32/48/64px) but don't consistently
*use* it for section-level vertical padding (actual values found: 62px,
78px, 90px, 92px, 100–104px, 104–112px, 132px — not clean multiples of
the scale). Home and Workspaces had no spacing scale defined at all.

**Canonical:** one shared 8px-based scale (`--sp-1`…`--sp-8`) defined on
every page.

**Status: ✅ Partially fixed (infrastructure only).** Added the same
`--sp-1`…`--sp-8` tokens to Home's and Workspaces' `:root` (previously
missing) — purely additive, changes nothing visually yet, but means all
4 pages now share one spacing vocabulary. **Not yet done:** migrating the
actual section `padding` declarations (62px, 78px, 90px, etc.) onto the
token scale. That's the highest-risk remaining item — each section's
background art/gradient was positioned relative to its current padding,
so this needs a dedicated pass with full-page before/after screenshots
per section, not a batch find-and-replace.

### 20. Backgrounds / gradients

Not yet audited in detail (large surface area — every section has its
own gradient angle/stops). Flagged for the same follow-up pass as section
spacing, since the two are visually tied together.

---

## Updated summary (after Pass 2)

| Element | Status |
|---|---|
| Primary CTA button | ✅ Fixed |
| Secondary/ghost button | ✅ Already consistent |
| Pills / tags | ✅ Fixed |
| Headings — weight & letter-spacing | ✅ Fixed (300+ rules, size-tier formula) |
| Headings — font-size / line-height | Untouched (content-dependent, by design) |
| Bullet points | ✅ Fixed — 1 canonical marker, 4 lists |
| Icon card plus-marker rollout | ⚠️ Scoped — needs JS review, own pass |
| Card shells (radius/padding/shadow) | ✅ Checked — already consistent |
| Section spacing tokens | ✅ Infrastructure added (tokens defined) |
| Section padding (actual values) | ⚠️ Flagged — needs per-section screenshots |
| Backgrounds / gradients | ⚠️ Not yet audited |
| Nav CTA | ⚠️ Flagged — needs breakpoint QA |

**Verification method used throughout:** `document.scrollWidth ===
document.documentElement.clientWidth` checked on all 4 pages at
desktop/tablet/mobile after every change (catches any new horizontal
overflow), plus the project's own `tools/audit.js`, plus targeted
before/after crop screenshots of the actual elements changed.
