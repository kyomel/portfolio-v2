# portfolio-v2

Personal CV portfolio of Michael Stevan Lapandio ([KyoMel](https://github.com/kyomel)). Single-page Swiss dossier: label rail, evidence-first record rows, light/dark theme, one pixel signature element. Design note: `docs/design/dossier.md`.

## Stack

- [Astro 7](https://astro.build) - static output, zero framework JS except one island
- [React 19](https://react.dev) - single island: the contact form (`client:load`)
- TypeScript (strict) - all CV content is typed data
- [Bun](https://bun.sh) - package manager and script runner

## Project structure

```
src/
  data/profile.ts            # all CV content (typed)
  data/evidence.ts           # record rows, headline metrics, build-time facts
  pages/index.astro          # the single page
  layouts/Base.astro         # head: favicon, OG tags, theme restore script
  components/ContactForm.tsx # only React island; builds a mailto: link
  components/PixelPortrait.astro  # pixel plate for the portrait
  components/PixelSprite.astro    # the signature bot
  styles/global.css          # all styling
  assets/                    # profile photo (optimized by astro:assets)
public/                      # favicon set, og.png, brand font subset
```

## Commands

| Command           | Action                         |
| ----------------- | ------------------------------ |
| `bun install`     | Install dependencies           |
| `bun run dev`     | Dev server at `localhost:4321` |
| `bun run build`   | Production build to `./dist/`  |
| `bun run preview` | Preview the production build   |

## Deployment

The site is a static build (`dist/`) served by the **Cloudflare Worker** `portfolio-v2` through Workers Builds (git-connected). One deployer: push `main` and Cloudflare builds and deploys.

```
push main -----> Workers Builds: bun install -> bun run build -> npx wrangler deploy
pull request --> GitHub Actions: build only, no deploy (validation)
```

`wrangler.jsonc` is assets-only (no script, no bindings): `wrangler deploy` serves `dist/` from Cloudflare's asset CDN. The repo owns the config, so Cloudflare's automatic framework configuration never runs - the build is the same locally, in Actions, and on Cloudflare.

Workflow: `.github/workflows/ci.yml` (build validation only).

### Bun version

`bun.lock` is `lockfileVersion: 2`, which only Bun 1.4 and newer can parse. Cloudflare's build image defaults to Bun 1.2.15 and stops with `UnknownLockfileVersion: failed to parse lockfile: 'bun.lock'`. `.tool-versions` pins Bun 1.4.2 for every consumer:

| Consumer         | How it reads the pin                        |
| ---------------- | ------------------------------------------- |
| GitHub Actions   | `oven-sh/setup-bun` via `bun-version-file`  |
| Cloudflare build | the build image provisions tools with asdf  |

Keep `.tool-versions`, `bun.lock`, and your local Bun on the same version. If a Cloudflare build still reports Bun 1.2.15, set the `BUN_VERSION` environment variable to `1.4.2` in the Worker's build settings (dashboard > portfolio-v2 > Settings > Build).

### Site URL

`site` in `astro.config.mjs` is the live URL `https://portfolio-v2.michaellapandio04.workers.dev`; the `og:image` meta tag is built from it. Update it when a custom domain is added.

### Custom domain

1. Add the domain on the Worker: dashboard > Workers & Pages > portfolio-v2 > Domains.
2. Set `site` in `astro.config.mjs` so the `og:image` meta tag gets an absolute URL:

   ```js
   export default defineConfig({
     site: "https://your-domain.com",
     integrations: [react()],
   });
   ```
