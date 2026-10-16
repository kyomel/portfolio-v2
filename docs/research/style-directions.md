# Mainstream audit and style directions

Research date: 2026-10-16. Method: Exa search over primary sources (practitioner
write-ups, award galleries, shipping sites, hiring-manager posts). Visual output:
`style-directions.html` in this folder. Portrait plate: `assets/portrait.jpg`.

## Finding 1 - the current page is a template with a themed surface

Source: production build at `dist/`, captured at 1440px.

```text
current skeleton                         distinctive part
-------------------------------------    --------------------------------
sticky rail, avatar, name, roles         pixel bot sprite (decorative)
nav 01/02/03/04                          corner ticks on cards
stats strip of 4 exact numbers           dash section separators
timeline with 01..09 indices             pixel sun/moon theme icons
rounded card grid + pill tags            ambient dot lattice (background)
2-column contact section
```

The skeleton is the default dev-portfolio shape of the last decade. Published
critiques name the same list of signals: dark mode, hero with a wave, project card
grid, identical sections in identical order.

- https://parthh.in/blogs/why-90-percent-of-developer-portfolios-look-the-same
- https://nicopicotto.dev/blog/your-portfolio-should-look-like-you/
- https://thecrit.co/resources/why-every-portfolio-looks-the-same
- https://vanschneider.com/blog/portfolio-tips/the-case-against-portfolio-tempaltes/

The pixel layer is the only authored part. It sits on the trim, so it reads as a
theme, not as an identity.

## Finding 2 - the strongest content is currently the least visible

Your measurable work is real and rare: 70% manual approval work removed, 60% report
time cut, 100+ engineers trained, 4 teams led, 2 Best Team awards. Today it appears
as one stat strip, then as plain sentences inside a timeline.

Hiring material converges on the opposite order: evidence first, claim second.

- https://www.techtrust.com/post/key-projects-in-developer-portfolios-for-hiring
- https://www.index.dev/blog/evaluate-freelance-developer-portfolio
- https://medium.com/@sohail_saifi/i-analyzed-100-tech-lead-portfolios-these-5-projects-are-red-flags-to-recruiters-04d03303d445

## Finding 3 - four directions that are not the default

Each direction is rendered as working CSS in `style-directions.html`.

### 01 Operators desk - the site boots

Desktop metaphor: menu bar, taskbar, windows, terminal that answers real commands
against your own data. Your pixel layer becomes the design system.

- Precedent: https://zezinos.site/ , https://chusmargallo.com/2026/06/19/retro-os-portfolio/ ,
  https://github.com/signingoff-dubey/desktop-portfolio , https://www.awwwards.com/sites/abhishek-jha-folio-25
- Win: highest memorability. Cost: highest build cost, mobile plan required, genre is now crowded.

### 02 Swiss dossier - evidence over decoration

No cards, no pills. Two-rail grid, numbered work index, fact table with metric,
period and proof link per row.

- Precedent: https://dillonsimeone.com/MiniProjects/StyleCollection/index.html ,
  https://www.a1.gallery/websites/varied-layout-portfolio , https://www.awwwards.com/sites/nahel-moussi-portfolio
- Win: fastest to scan, lowest risk, prints cleanly. Cost: less playful, retires most pixel trim.

### 03 Zine press - print, not screen

Two spot inks on uncoated stock, serif headlines, mono data, grain instead of
gradients. The pixel portrait becomes a halftone plate.

- Precedent: https://chrislemke.github.io/website_designs/designs/Risograph.html ,
  https://www.indiebytes.dev/ui-kit ,
  https://europacircuit.com/scene/how-a-design-studio-built-a-website-that-looks-like-its-running-on-1988-hardware
- Win: feels authored, cheap in bandwidth. Cost: needs hard execution and a contrast audit.

### 04 Build status - the proof is the product

Control panel of your practice: deploy status, commit activity, service uptime,
mentoring throughput. Generated at build time, so the site stays static.

- Precedent: https://www.indiebytes.dev/ui-kit ,
  https://skills.rest/skill/industrial-brutalist-ui-otto-poblysh
- Win: answers "does this person operate software" directly. Cost: needs real data and a defined empty state.

## Finding 4 - the recommended combination

Keep the skeleton calm. Move identity into the content and into one signature element.

```text
1. Skeleton        Direction 02 (Swiss dossier) - index of work, fact table, proof links
2. Evidence layer  Direction 04 (Build status) - build-time metrics block per project
3. Signature       Existing pixel sprite + pixel portrait, kept, but promoted to
                   the one memorable element instead of a repeating trim
4. Retire          numbered rail nav, stats strip, rounded card grid, pill tags
```

Why this wins: the recruiter path stays fast, the engineering-lead path gains proof,
and no nostalgia genre is borrowed. It also keeps most of the current content model
(`src/data/profile.ts`) intact, so the change is mostly layout and one build-time data
step.

## Comparison

| Direction | Identity | Hiring signal | Build cost | Mobile risk | Keeps pixel work |
| --- | --- | --- | --- | --- | --- |
| 01 Operators desk | Very high | Craft, playfulness | High, 3-5 days | High | Yes, as the system |
| 02 Swiss dossier | Medium | Clarity, discipline | Low, 1-2 days | Low | Partly |
| 03 Zine press | High | Taste, authorship | Medium, 2-3 days | Low | Yes, as halftone |
| 04 Build status | High | Operational proof | Medium, 2-3 days | Low | No |

## Evidence gallery

Additional shipping examples reviewed:

- https://www.matthewmercado.dev/ - metaphor carried into copy, not only into styling
- https://dev.to/smngvlkz/a-calm-terminal-inspired-portfolio-focused-on-shipped-products-ga8 - terminal look with calm typography
- https://lesfer.ma/projects/terminal-portfolio - scanline membrane that morphs on scroll
- https://github.com/Sigmakib2/CmdFolio , https://command-menu-k.webflow.io/ - Cmd+K palette as the only navigation

## Next step

Pick one direction. Then the work splits into: content model for proof links, layout
rebuild in `src/pages/index.astro` and `src/styles/global.css`, and a mobile pass at
390 / 768 / 1440.

## Follow-up: the pixel + lofi + anime pass (2026-10-16)

Second round of research, same method, on the aesthetic the user asked for.

- The lofi visual language is documented as "warm lamp glow, night-purple skies, and an
  animated girl at her desk": https://designbycurio.com/learn/lofi-hip-hop-chillhop and
  https://designbycurio.com/lofi-hip-hop-anime-girl-2018
- Analog warmth, grain, and faded colour: https://chrislemke.github.io/website_designs/designs/Analog_Warmth.html
  and https://chrislemke.github.io/website_designs/designs/Grain_and_Grit.html
- Dithering belongs in small doses, as a band or a divider, not as a full-page lens:
  https://www.devtools.tools/blog/pixel-art-retro-palettes-sprite-sheets-guide and
  https://empire-ui.com/blog/retro-ui-design
- Pixel objects on a normal page, done well: https://pablomurad.com/how-i-built-pablos-room/ and
  https://www.gulamoff.dev/work/mehsoft

Decision: keep the dossier structure, apply the language through palette, grain, dither
rules, and code-drawn pixel objects. No particle layer, one lamp pulse as the only
ambient motion. See `docs/design/dossier.md`.
