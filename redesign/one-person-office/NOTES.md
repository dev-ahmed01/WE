# One Person Office: redesign v3 (draft for review)

Open `index.html` through any static server from the repo root, e.g. `python3 -m http.server` then
`/redesign/one-person-office/index.html`. It reuses photos from `public/assets/img/`. Nothing in `source/`, `public/` or the build was touched.

## Content to confirm before launch
- **Prices**: every `XX,XXX` in `app.js` (`SOLUTIONS`) is a placeholder. Hooks beyond "1 month free on selected plans" are suggestions.
- **Landmarks** in `LOCATIONS` are indicative, check each building. Map uses a Google Maps embed (needs the CSP to allow `maps.google.com`).
- **Amenities**: generic list, confirm per location.
- **Testimonials**: only Saandeep K Das is real; two slots are marked Draft.
- **Photos**: source files are small (max ~900px), the lightbox will look soft until higher-res versions exist.

## Competitor patterns used (WeWork, Regus)
Category switcher above solution cards; tiered private-office sizes by headcount; "from" price plus a hook rather than a hidden price;
amenities grouped and expandable; location-led discovery with map; one persistent callback/tour CTA; FAQs near the end.
(Their sites could not be fetched from this environment, so this comes from search summaries.)
