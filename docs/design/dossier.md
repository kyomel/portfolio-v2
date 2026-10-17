# Swiss dossier

Added 2026-10-16, replacing the sticky-rail layout. Research input:
`docs/research/style-directions.md`, rendered comparisons in
`docs/research/style-directions.html`.

## Why it changed

The old page used the standard dev-portfolio skeleton (rail, avatar, numbered nav,
stats strip, timeline, card grid, pill tags) and carried its identity in decoration.
The new page carries identity in the order of the information: claim, evidence,
record, proof.

## Pages

```text
/               hub: summary metrics, two doors (Build & Grow, Contribute), proof, contact
/work/          case studies, then the record: one row per role, jobs and community programs
/work/<slug>/   one case study: problem, decisions, outcome
/daily-terms/   term index: search box, month jump rail, collapsible month sections
/daily-terms/a-z/   the whole glossary in alphabetical order, letter jumps
/daily-terms/<y>/<m>/<slug>/   one term: derived meta, archive markdown, keep reading
/contribute/    pull requests upstream, community repos, maintained resources
/about/         bio, education, licenses, stack
/contact/       direct links and the React form
masthead        KyoMel brand, page links, theme toggle (sticky, opaque)
horizon         wave band, screentone ramp, stars (decorative)
footer          copyright, Astro line, motion switch
```

Work and community merged into `/work/` on 2026-10-16: the programs fold into the
record rows (`what`, `did`, `link` in `evidence.ts`), so one list of roles covers
both. The record left `/about/`, which keeps the bio, education, licenses, and
stack. Job rows follow the LinkedIn profile; Build App Today Heroes stays in the
record (it predates LinkedIn and lives in the commit history and the old
`kyomel.github.io` CV).

## Visual language: 2D pixel, lofi, anime

The dossier skeleton stays. The surface speaks pixel and lofi: a warm dusk palette
(paper and ink by day, a desk lamp in a dark room at night), a fine grain plate over
the page, dithered rules instead of hairlines, and pixel objects drawn in code.

- Palette: `#f3ead8` paper and `#241a10` ink by day; `#17110b` room and `#f0e3cf`
  lamplight at night. Accent is amber: `#a1500f` light, `#eeab54` dark. The light
  value is darkened until accent text passes WCAG AA on the paper background.
- Grain: one fixed plate on `body::before` with a fractal-noise SVG. The opacity is
  set per theme (0.022 light, 0.05 dark) because `light-dark()` does not resolve
  inside `opacity`. Measured lift is about 3 percent of luminance, which reads as
  texture, not as noise.
- Rules: section separators and the footer rule are a 50 percent checker dither at
  2px cells. Rules inside a section stay solid hairlines, so density has hierarchy.
- Objects drawn in code: `PixelSprite.astro` (13x14 bot) and `PixelLamp.astro`
  (9x8 desk lamp). The lamp is the light source of the page: its glow, the sprite
  halo, and the warm cast on the portrait all use `--glow` and `--wash`.
- The lamp pulse and the 2px rule march are the ambient motion. The reveals land
  in `steps(6)` instead of gliding, and the measured metrics count up in seven
  integer steps when they enter the viewport. Everything stops under
  `prefers-reduced-motion`, and the footer motion switch freezes it on demand
  (WCAG 2.2.2); the choice survives reload.
- Navigation is motion too (2026-10-16): cross-document view transitions carry
  the masthead across pages unchanged, morph the page label and the case-study
  titles in `steps(6)`, and land the page itself in `steps(4)`. Rows enter one
  step after the one before them (`sibling-index()`, Baseline 2026). The
  masthead marks its stuck state with the dithered rule through a
  `scroll-state()` query. Each of these is a layer with a plain fallback: no
  support means the page navigates, lists, and reveals exactly as before.
- Term pages render the archive markdown in `.term-body`: section labels in
  mono, code blocks on the surface colour with shiki tokens that follow the
  page theme, and tables that scroll inside the column. The term index stays
  zero-framework: search is a ~2 KB inline script over a lazily-fetched
  title+excerpt index, months collapse into native `details` with a jump rail
  that opens them, and the A-Z page is pure build-time HTML.

## Rules that hold the look

- Fonts: system sans for reading, monospace for data, labels, and page furniture.
- One label rail (132px) on desktop, stacked labels below 860px.
- Solid 1px rules only. No shadows, no gradients, no rounded corners.
- Accent is reserved for metrics and links. It never fills a large area.
- One signature element: the pixel plate, with the bot and the lamp on it. The
  plate keeps its frame and gains 8px ink corner blocks (manga panel marks).
- The lofi/manga pass (2026-10-16, from `research/motion-background-options`): a
  decorative horizon strip above the footer carries the screentone dot ramp, the
  seigaiha waves as 2px pixel stairs (96x48 half-drop tile, radii step 12px), seven
  2px stars and a pixel crescent; six 2px motes drift in the plate's lamp light;
  the theme icon flips one whole 16px frame (`@property` + `round()`); links
  march a 2px block underline on hover and focus.
- Warmth comes from light, not from extra hues. One accent, one glow, no second colour.

## Evidence layer

`src/data/evidence.ts` holds the record rows, the headline metrics, and the facts
table. Facts are measured at build time: dependency counts from `package.json`,
handwritten lines of `src/`, gzipped size of `src/styles/global.css`, and the build
date. Nothing is invented, and `dist/` is cleared on every build, so no row claims a
file size it cannot read.

To add a metric, add an outcome to a record in that file. To add a proof link, set
`proofs` with `external: true` for public artifacts, or `external: false` to print
the label with "private" instead of a dead link.

## Removed

`PixelField.astro` is no longer mounted. The ambient dot lattice and the dust canvas
left with the old direction. The component file stays in the repository; delete it if
the direction holds.
