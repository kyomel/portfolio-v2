# Motion and background options - lofi Japanese manga + 2D pixel

Research date: 2026-10-16. Status: proposal for review. Nothing is on the site yet.
Live preview, real CSS in both palettes: `motion-background-options.html`
(open it in a browser; it has a theme switch and a motion switch).

Method: audit of the shipped page (`src/`), Exa search over primary sources, and the
repo's own prior notes (`pixel-animation.md`, `style-directions.md`, `dossier.md`).

## 1. What the page runs now

```text
element                     motion today                                  notes
--------------------------  --------------------------------------------  ---------------------------------------
grain plate (body::before)  static                                        opacity 0.022 light / 0.05 dark
section dither rules        static                                        the 2px checker separators
lamp (plate)                steps(6) 4.6s opacity pulse                   the only ambient motion; reduced-motion off
.reveal (facts, record)     fade-up on view(), glides                     12px rise, linear clock
theme toggle                view-transition circle wipe, 480ms            from the click point
sprite (plate corner)       idle blink/bob + hover wave + click spin      pauses offscreen and on hidden tab
portrait (plate)            1.1s stepped assembly, sharpens on hover      no rAF after assembly
PixelField (dot lattice)    NOT mounted                                   component kept dormant in src/
motion switch               gone since the dossier rebuild                WCAG 2.2.2 control to restore
prefers-reduced-motion      global kill switch                            every piece renders its final state
```

## 2. What the genre actually is (grounded, not invented)

The lofi visual code, from the sources below: a single warm practical light as the
only light; a cozy interior; minimal motion ("enough to read as alive, not enough to
demand attention"); dust motes or rain as the loopable element; a muted earthy
palette with soft film grain; evening light. The page already carries most of this
(warm dusk palette, lamp, grain, one pulse). The missing pieces are the print
texture, a wave horizon, and one or two living details.

The manga print code: screentone (a dot screen over paper), halftone ramps for
shading, ink rules, panel frames. In CSS a dot screen is one radial-gradient at a
6px pitch with 9 percent ink (the ceiling where text lives is about ten percent); a
ramp is two dot grids fading under a mask, or the higher-fidelity `contrast()`
trick that varies the dot size itself. All pure CSS.

The Japanese pattern code: seigaiha (wave scales) and asanoha. Construction of
seigaiha is exact and small: concentric rings, radius step = tile / 10, in a
half-drop tile (a 96x48 tile in our scale). Shipping sites that use these patterns
keep them at 0.03 to 0.06 opacity with 150 to 250px tiles, so they read as paper,
never as wallpaper.

## 3. Motion options

| id | option | how | cost / risk |
| --- | --- | --- | --- |
| M1 | dither rule march | the section dither crawls in 2px steps (`steps(8)`, 3s) | CSS only; very subtle by design |
| M2 | stepped reveal | existing view() reveals swap easing for `steps(6)` | one line per rule; near-zero risk |
| M3 | stepped metric count | the four summary numbers tick up in integer jumps on first view | ~12 lines JS; final value stays in the DOM |
| M4 | dust motes | 2px motes drifting in the lit area; CSS-only version or the dormant PixelField dust canvas | CSS / ~4 kB canvas; needs the motion switch back |
| M5 | sakura petals | the same drift with 4px accent petals | CSS only; taste risk, show to a reviewer first |
| M6 | seigaiha band march | the wave band steps sideways, 24 jumps over 9s | CSS only; pairs with B2 |
| M7 | micro interactions | theme icon flips on whole frames (`@property` + `round()`); links get a marching block underline on hover | CSS only; interaction-triggered, never unattended |
| M8 | lamp flicker variation | swap the even pulse for an irregular 2-3 frame flicker | CSS only; micro |
| M9 | scroll-direction sprite | the bot turns to face scroll direction | view-timeline; Chrome/Safari only, enhancement only |

## 4. Background options

| id | option | how | cost / risk |
| --- | --- | --- | --- |
| B1a | screentone wash, uniform | 1px dots at 6px pitch, 9 percent ink on surfaces | CSS only; keep under 10 percent where text lives |
| B1b | screentone ramp, corner | two dot grids fading from a corner (coarse over fine), the manga shading gradient | CSS only; decorative layer, never under text |
| B2 | seigaiha band | wave scales as 2px pixel stairs (96x48 half-drop tile), a quiet horizon above the footer | CSS only; 0.35-0.45 opacity |
| B3 | dusk window | the plate gains pixel stars and a crescent in the dark palette; lamp glow stays the corner light | CSS only; static, no twinkle |
| B5 | manga panel frame | the plate reads as one panel: ink corner blocks, or a cut corner (one style only) | CSS only |
| - | asanoha anywhere else | too busy next to the plate | rejected |
| - | full-page screentone | fights the Swiss grid and the grain | rejected |
| - | CRT scanlines, glitch, shake | kitsch; the pixel-accent rules in the vault already ban them | rejected |

## 5. Recommendation - the calm bundle

```text
motion      M1 + M2 + M3 + M4 + M7  (and the footer motion switch back)
surface     B5 plate corners + B1b corner ramp + B2 wave band + B3 dusk stars
optional    M5 petals, M6 band march
guardrails  reduced motion renders static final states; the motion switch covers
            WCAG 2.2.2; dust pauses offscreen and on hidden tab; accent stays for
            values; the plate stays the one signature object
```

Why this bundle: it keeps the dossier's promise (evidence first, one signature
element) and adds the genre through texture and one living detail, not through a
new object or a second colour. M2 and M7 upgrade what already exists; M3 makes the
evidence block read like a scoreboard; M4 is the lofi element the sources name
first; B1b and B2 are the manga and Japanese print surfaces, both under 10 percent
ink by construction.

## Sources

- Lofi visual codes: <https://echonos.ai/blog/lofi-visualizer>,
  <https://ethanthompson.org/blog/looping-lofi-animation-scene>
- Halftone and screentone in CSS: <https://nodlume.dev/texture-playground/halftone>,
  <https://css-irl.info/css-halftone-patterns/>,
  <https://leanrada.com/notes/pure-css-halftone/>
- Seigaiha construction: <https://nghia.pt/blog/seigaiha/>,
  <https://commons.wikimedia.org/wiki/File:Japanese_Wave_Pattern.svg>
- Pattern usage precedent (0.03-0.06 opacity):
  <https://mintlify.wiki/RogerCiv/japanese-portfolio/customization/japanese-patterns>
- Stepped sprite and `@property` frame snapping:
  <https://kbravh.dev/interactive-pixel-spritesheet-animations-with-css>
- In-repo: `docs/research/pixel-animation.md`, `docs/research/style-directions.md`,
  `docs/design/dossier.md`; vault `knowledge/pixel-accent-layer.md`
