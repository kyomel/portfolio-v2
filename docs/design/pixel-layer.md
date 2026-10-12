# Pixel layer

Added 2026-10-12. Three self-contained components add the "2D pixel" layer; the rest
are CSS accents in `src/styles/global.css`. Research input: `docs/research/pixel-animation.md`.

## Components

- `src/components/PixelField.astro` - fixed background. An 8px dot lattice drawn with CSS
  `radial-gradient`; drifting 2px dust on a canvas (30fps, ~55 pixels desktop, 26 under 700px).
- `src/components/PixelPortrait.astro` - rail avatar. Median-cut quantized (24 colors) pixel
  version that assembles in 1.1s; the sharp `astro:assets` image sits underneath and shows on
  hover / keyboard focus / tap. No rAF after assembly.
- `src/components/PixelSprite.astro` - 13x14 block bot, art defined in code. Idle blink, antenna
  pulse and bob; `[data-px-host]` hover wakes it (wave + hop); click spins it; theme change
  glitches it. Mounted in the rail slot in `src/pages/index.astro`.

## CSS accents (`src/styles/global.css`)

- `--px-tick` and 7px L corner ticks on `.stat`, `.details`, `.card`, `.cert-pointer`
- 3px-on / 4px-off pixel dash for section + footer separators; dashed timeline entry rules
- 5px block before every `.eyebrow`; 4px bullet inside every `.tag`
- pixel sun/moon theme icons (8x8 inline SVG rects, `shape-rendering: crispEdges`)

## Motion control

- `prefers-reduced-motion` renders every piece in its static final state.
- The footer `motion: on/off` button writes `localStorage.motion` and `data-motion` on `<html>`.
  Components watch that attribute: dust freezes, the bot stops idling, the role scramble pauses.
  Hover/click reactions still work (user-initiated). Default: on.

## Removing a piece

Delete the component file and its tag/import in `src/pages/index.astro`. For an accent, delete
the matching rule block (all pixel accents are grouped before the `/* Motion */` comment or sit
next to the element they style).
