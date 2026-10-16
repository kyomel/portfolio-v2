# Swiss dossier

Added 2026-10-16, replacing the sticky-rail layout. Research input:
`docs/research/style-directions.md`, rendered comparisons in
`docs/research/style-directions.html`.

## Why it changed

The old page used the standard dev-portfolio skeleton (rail, avatar, numbered nav,
stats strip, timeline, card grid, pill tags) and carried its identity in decoration.
The new page carries identity in the order of the information: claim, evidence,
record, proof.

## Structure

```
masthead        name, section links, theme toggle (sticky, opaque)
01 summary      headline claim, tagline, four headline metrics
02 profile      prose from profile.ts, then the method table
03 record       one row per role: period, org, outcomes with a metric each
04 stack        tools in two or three columns
05 education    education, builds, licenses in one definition list
06 proof        pixel plate plus the build-time facts
07 contact      direct links and the React form
```

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
- The lamp pulse is the only ambient motion, and it stops under
  `prefers-reduced-motion`.

## Rules that hold the look

- Fonts: system sans for reading, monospace for data, labels, and page furniture.
- One label rail (132px) on desktop, stacked labels below 860px.
- Solid 1px rules only. No shadows, no gradients, no rounded corners.
- Accent is reserved for metrics and links. It never fills a large area.
- One signature element: the pixel plate, with the bot and the lamp on it.
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
