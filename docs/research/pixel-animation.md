# Pixel-art / "2D pixel" animation - research note (portfolio-v2)

Date: 2026-10-12. Status: research input for design + implementation decisions (no site code touched).
Tools used: built-in websearch (Serper) has no API key and the exa MCP is not connected in this environment; used the Exa REST API directly via the helper `/tmp/ppix/harness/exa_search.py` (`search` + `agent` endpoints), and `curl` / `r.jina.ai` for deep page reads. All URLs below were fetched and read, unless marked "snippet".

Map: (A) ambient dither -> A1 CSS / A2 small canvas / A3 WebGL (optional) / A4 LED strip  ·  (B) sprites -> B1 steps() / B2 interactive @property / B3 canvas fallback  ·  (C) images -> C1 pixelated portrait / C2 pixelate reveal  ·  (D) UI accents -> D1 steps micro / D2 box-shadow icons / D3 scroll-driven  ·  (E) perf + a11y.

Top-3 picks (each marked `TOP:` below):
1. Pure-CSS dither + pixel accents (patterns, dividers, stepped hovers) - zero JS, ~zero bytes, uses the current palette; reads as craft, not arcade.
2. Pixelated portrait / photo asset with `image-rendering: pixelated` - the personal "CV" signature; pre-rendered asset, no runtime cost.
3. Interactive pixel theme-toggle sprite with `@property` + `round()` - pure CSS, upgrades the existing toggle micro-interaction.

## A. Ambient pixel / dither motion

### A1. TOP: Pure-CSS ordered-dither patterns + pixel dividers
What: Bayer-style shades built from gradient cells: 25% coverage = one quadrant, 50% = checkerboard, 75% = inverse; steps()-driven marching turns it into motion. Dividers: conic-gradient checker rule, staircase mask rule, fading dither band.
Impl: `.rule { --px:8px; height:calc(2*var(--px)); background:conic-gradient(var(--ink) 0 25%, transparent 0 50%, var(--ink) 0 75%, transparent 0) 0 0/calc(2*var(--px)) calc(2*var(--px)); animation: march 1.2s steps(8,end) infinite; }` plus thin dither bands via `repeating-conic-gradient` cells. No JS, no images.
Perf: static gradient paint; stepped repaint per frame only while on screen; keep bands thin, never full-screen.
Fit: section dividers, footer rule, small status chips; ink color = --border or --accent; no new colors needed.
Refs: codefronts.com/snippets/css-dividers/retro-dividers/ (live code, Aug 2026); codefronts.com/design-styles/css-retro-designs/dithering-patterns-with-css-gradients/; css-tip.com/pixelated-corner/ (Temani Afif: pixelated cut corners via clip-path + mask, 4 properties).

### A2. Canvas ordered dither (Bayer 4x4) + optional CRT shimmer
What: per-pixel quantize using a 4x4 Bayer matrix: `T=(v+0.5)/16-0.5`, `q=round((value/255+t)*(levels-1))`; optional animated CRT subpixel mask (cycles the active R/G/B channel per frame) on a second pass.
Impl: plain canvas 2D, `x&3`/`y&3` indexing, no shaders, no deps. Mono mode = threshold to 1 bit.
Perf: JS per-pixel loop - use for small art (avatar, thumbnail), not full-screen; `getImageData` needs same-origin/CORS. Static variant = one cheap pass; skip the CRT.
Fit: hero/rail avatar in a small canvas; mono ink in --fg, accent in --accent.
Refs: seangeng.com/writing/ordered-dithering-and-a-crt-mask (2026, component included); neddev.com/en/lab/backgrounds/image-dithering/ (ready HTML/CSS/JS on Paper Shaders, Apache-2.0).

### A3. GPU / WebGL dither background - optional, heavier
What: full-screen Bayer-dither background with fbm noise and click ripples; article reports under 0.2 ms GPU render at 4K and ~3 KB of code (plus Three.js).
Perf: needs WebGL + a lib; overkill for a static one-pager unless it is THE hero showpiece. Proof it reads premium: JetBrains' Junie campaign page uses exactly this.
Fit: hero backdrop only, if we commit to a showpiece; otherwise A1 wins.
Ref: tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/ (read via r.jina.ai).

### A4. Dot-matrix / LED strip (small canvas)
What: a 5x7 LED glyph table, column scroll, glow decay, brightness quantization, row-scan - an old LED sign as dots.
Impl: canvas 2D; ~80 lines custom, or the ledding engine (4.7 KB gz, TS, playlists).
Perf: scale dot pitch with devicePixelRatio; pause offscreen; keep the strip small.
Fit: footer signature or a tiny "now" ticker in the rail; dots in --accent on --bg/--surface.
Refs: godrichstory.com/en/posts/led-sign-dot-matrix-glyph-scroll-glow-roll-scan-scenes/ (9 scene breakdowns); github.com/eddndev/ledding.

## B. Sprite animation with steps() (+ canvas)

### B1. Classic CSS sprite animation with steps()
What: one sprite sheet, `background-position` jumps between frames: `animation: walk 2s steps(N, jump-none) infinite` with keyframes 0 -> -(N-1)*frameW.
Impl notes: `steps(29, jump-none)` is the verified recipe for the 29-frame example; default is `jump-end`; if things look one frame late, try `jump-start`; exact params are fiddly - copy from refs. Clip via background-position (simplest), overflow wrapper, or clip-path. Interactivity via `:checked` / `:hover` selectors, pause/reverse by class.
Perf: CSS-driven, does not block the main thread like rAF; but background-position repaints per frame - fine for icons/micro-interactions, not for large surfaces.
Fit: micro-interactions (hover on links/avatar, a small status sprite), not a scene character.
Refs: leanrada.com/notes/css-sprite-sheets/ (thorough, 2024); blog.teamtreehouse.com/css-sprite-sheet-animations-steps; css-tricks.com/almanac/functions/s/steps/ (syntax, 2025).

### B2. TOP: Interactive sprite via @property + round()
What: a 6-frame pixel lever for the light/dark toggle, all CSS: register `@property --offset { syntax:'<length>'; initial-value:0px; inherits:false }`, set the target per `:checked`, then `translate: 0 round(var(--offset), var(--frame-size)); transition: --offset 500ms linear`.
Why this instead of steps() here: on interrupted/reversed transitions, steps() keeps counting from wherever the hidden linear interpolation is - frames get cut mid-cell; `round()` snaps to whole frames. Verified write-up.
Perf: negligible (one small sprite, one animated custom property). A11y: keep the real checkbox, focus-visible outline, image-rendering: pixelated.
Fit: theme toggle (site already has a view-transition circle wipe; this gives the icon its own tactile flip) or a "resume" button.
Ref: kbravh.dev/interactive-pixel-spritesheet-animations-with-css (2025).

### B3. Canvas sprites (fallback, only if needed)
What: when frames grow into dozens or several sprites share a surface: render on a small canvas (e.g. 128x128), upscale via CSS and `image-rendering: pixelated`.
Perf: canvas is not in the DOM (a11y: aria-label / fallback content); set `imageSmoothingEnabled=false` for 1:1 drawing; non-integer devicePixelRatio or page zoom makes pixel edges uneven - known, test at 100%.
Fit: skip unless B1/B2 outgrow CSS; not needed for a CV page.
Refs: developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look; developer.chrome.com/blog/pixelated.

## C. Pixelated images / portrait

### C1. TOP: Pixelated portrait pipeline
What: downscale a photo to ~64-96 px wide, optionally snap to 4-6 tones (site palette or neutral duotone), save the tiny file; display at an integer multiple with `image-rendering: pixelated`.
Impl: pre-render at build time (ImageMagick / `sips`, or canvas once offline); keep width/height attributes; light/dark variants optional; normal alt text.
Perf: ~5-15 KB asset, zero runtime cost; integer scaling keeps edges even (non-integer zoom distorts slightly - accepted limitation, MDN).
Fit: hero or rail avatar, project thumbnails. Strongest "pixel + CV" signal; keep it grid-aligned with the layout.
Refs: developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look; css-tricks.com/keep-pixelated-images-pixelated-as-they-scale/; developer.chrome.com/blog/pixelated.

### C2. On-scroll pixelate-to-sharp reveal (optional showpiece)
What: an image starts chunky and resolves to sharp as it enters the viewport (recreation of Felicity Ingram's effect).
Impl: tiny canvas: draw a downscaled version with smoothing off, step the scale down over ~10 frames; GSAP in the demo, implementable in <10 lines of plain JS.
Perf: JS + canvas, run once per image; under reduced motion show the final frame directly.
Fit: project screenshots; enhancement only, not core content.
Refs: tympanus.net/codrops/2023/05/24/on-scroll-pixelated-image-loading-effect/ ; fwdtools.com/ui-snippets/canvas-image-pixelate-reveal/ (plain HTML/CSS/JS snippet); stackoverflow.com/questions/19129644 (method).

## D. Pixel UI accents

### D1. Stepped micro-interactions (steps(2) hard toggles)
What: hard on/off transitions instead of easing: `transition: background .12s steps(2)`; a pixel checkbox drawn as a single box-shadow sprite that fades in; 2px block underlines; "INSERT COIN"-style rows show the pattern.
Impl: box-shadow pixel sprite on a `--p`-sized element; focus-visible outline kept; `prefers-reduced-motion` disables transitions (demo does this).
Perf: negligible.
Fit: rail/nav links, small controls, project card corners; ink in --accent on --surface.
Refs: codefronts.com/components/css-checkboxes/retro-pixel-checkbox/; css-tricks.com/almanac/functions/s/steps/.

### D2. Pixel icons via box-shadow art (no assets)
What: draw an icon (sun, star, arrow, cursor) as 0-blur box-shadows on a 1px element; scale with `transform: scale(n)`; one element, self-contained CSS.
Impl: hand-write tiny icons; use the pixelartcss.com generator for bigger art; wrapper needs `overflow: visible`.
Perf: single paint, scales crisply.
Fit: theme toggle icon, small ornaments; pairs with D1. Avoid large art this way (hand-maintenance).
Refs: css-tricks.com/fun-times-css-pixel-art/; empire-ui.com/blog/retro-pixel-css (scale trick + 8-bit borders).

### D3. Stepped scroll reveals + scroll-driven sprites (enhancement only)
What: make the existing `view()` reveals chunky by adding `animation-timing-function: steps(N)`; advanced: a sprite that changes frame with scroll direction (Bramus' concept, 8 directions via style queries).
Perf: compositor-friendly. But scroll-driven animations are still not in Firefox stable (CanIUse Oct 2026: Chrome 115+, Safari 26+, Firefox up to 160 no; ~88% global). Progressive enhancement only, with a static fallback - do not gate content or layout on it.
Fit: hero/section reveals as a small upgrade of what already exists.
Refs: jamesbasoo.com/blog/scroll-driven-pixel-art-sprite/ ; bram.us/2022/10/27/scroll-linked-animations-with-scrolltimeline-and-viewtimeline/ ; caniuse.com/wf-scroll-driven-animations.

## E. Performance + accessibility caveats (apply to all families)
- Reduced motion: gate all optional motion under `@media (prefers-reduced-motion: no-preference)`; keep a meaningful static frame; for canvas check `matchMedia` and react to changes (W3C C39 / SCR40).
- WCAG 2.2: SC 2.2.2 (A) - auto-starting motion >5 s alongside content needs a pause/stop/hide mechanism (a reduce media query alone is not a substitute when the criterion applies); SC 2.3.1 (A) - max 3 flashes/s; SC 2.3.3 (AAA) - interaction-triggered motion must be disable-able.
- Off-screen pause (measured): 4 ambient animations scrolled out of view cost 7.4 s CPU/min unmanaged; `content-visibility: auto` cuts it to 2.1 s; IntersectionObserver + `animation-play-state: paused` + `visibilitychange` cuts it to 0.3 s. Pattern: `data-paused` attribute -> pause CSS animations and stop rAF loops; clamp `dt` on resume to avoid a jump.
- rAF stops in hidden tabs but keeps running off-screen; infinite CSS animations keep ticking off-screen; hidden-tab CSS animation produces no frames.
- Canvas a11y: content is invisible to screen readers - aria-label or fallback content; mark decorative pieces aria-hidden; dividers as `role="separator"`.
- Budget: keep everything CSS-first; the heaviest thing we should ship = one small canvas with offscreen pause (A2/C2). No WebGL unless the user wants a hero showpiece (A3).
Refs: css-animation.com pausing page (numbers above); w3.org/WAI/WCAG22/Understanding/pause-stop-hide; Techniques C39 + SCR40; MDN prefers-reduced-motion.

## Kitsch risks / anti-patterns (what makes pixel art look cheap on a CV)
- Arcade default: Press Start font for everything, neon green, "PLAYER 1" copy, blinking text. Reads like a theme, not a portfolio.
- Full-page pixel commitment (1-bit portfolio style) - great as an art piece, wrong here; the site already has a strong editorial identity (Paper Mono, warm neutrals). Do not add a second novelty font.
- Blurry scaling: missing `image-rendering: pixelated` or non-integer upscale = instantly fake. Always integer scale.
- Eased pixel motion: 8-bit motion should jump (steps), not glide. Mixing the two in one element reads as a bug.
- Heavy grime: strong scanlines, constant glitch, screen shake, autoplay audio. User-hostile + kitsch.
- Motion that never stops and cannot be paused (also a WCAG problem).
- Rules that keep it tasteful: pixel as an accent layer (1-2 places per viewport max), every color from existing tokens, small dithers beat big sprites, motion on interaction beats ambient loops, keep type + spacing untouched.

## Style fit (this site: Astro 7, single page; vars as given)
- Dither accents (A1): dividers between sections + above footer; ink --border (#e7e2da light / #342f2b dark); marching band + dots in --accent (#4f46e5 / #8f97f8) with low coverage; background stays --bg; optional dot band over --surface (#f3f1ed / #211e1c).
- Pixel portrait (C1): rail or hero avatar; palette-lock to --accent/--accent-2 (#4f46e5/#8f97f8, #7c5cf7/#b9a4f9) + neutrals; 1px --border frame; same alt text as the photo.
- Theme-toggle sprite (B2): where the toggle is now; light state in --accent, dark state in --accent-2; keep the circle view-transition wipe, add the frame flip on the icon; honor reduced motion (instant swap).
- Secondary: stepped link hovers in the rail (D1, 2px blocks in --accent); pixel corner notch (clip-path) on project cards or a single window box (--border, one notch style only); LED strip (A4) in the footer, dots --fg/--accent on --bg.
- Do not touch: layout, typography, existing view() reveals / split-text / glyph scramble - optionally swap their timing to stepped variants (D3) as an easter egg.

## Examples in the wild (tasteful, from Exa agent research)
- Pascal Pixel - pascalpixel.com: restrained design portfolio; pixel type, small icons, one animated thumbnail.
- Emil - emil.art: small pixel illustrations and animated leaves around client work.
- Catalin Vintila - catalinvintila.design: pixel-mosaic transitions + pixel menu (Awwwards-documented).
- JetBrains Junie campaign - jetbrains.com/junie: Bayer-dither hero on a corporate site.
- Full-commitment references (not the target look): 1-bit Pixel Art Dev Portfolio (Awwwards nominee 2025, console-buche), Reff Pixels, Bitmapbabe, Alex Pixels.
