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

The site is a static build (`dist/`) deployed to **Cloudflare Pages** with GitHub Actions.

```
push main -----> build (bun) -> wrangler pages deploy dist --project-name=portfolio-v2
pull request --> build only, no deploy
```

Workflow: `.github/workflows/deploy.yml`.

### Bun version

`bun.lock` is `lockfileVersion: 2`, which only Bun 1.4 and newer can parse. Cloudflare's build image defaults to Bun 1.2.15 and stops with `UnknownLockfileVersion: failed to parse lockfile: 'bun.lock'`. `.tool-versions` pins Bun 1.4.2 for every consumer:

| Consumer         | How it reads the pin                        |
| ---------------- | ------------------------------------------- |
| GitHub Actions   | `oven-sh/setup-bun` via `bun-version-file`  |
| Cloudflare build | the build image provisions tools with asdf  |

Keep `.tool-versions`, `bun.lock`, and your local Bun on the same version. If a Cloudflare build still reports Bun 1.2.15, set the `BUN_VERSION` environment variable to `1.4.2` in the project's build settings.

### One deployer only

This Pages project is Direct Upload, so CI is the only deployer. Do not connect the repo through the dashboard Git integration (Workers & Pages > Connect to Git): that flow creates a Worker with Workers Builds, which then builds on every push next to this workflow and deploys somewhere else. If such a Worker already exists, delete it or turn its automatic builds off.

### One-time setup

1. Create the Pages project. CI cannot create it for you:

   ```
   bunx wrangler login
   bunx wrangler pages project create portfolio-v2 --production-branch=main
   ```

2. Create an API token: Cloudflare dashboard > My Profile > API Tokens > Create Token > Custom token > Permissions: `Account` / `Cloudflare Pages` / `Edit`.

3. Copy your Cloudflare account ID. It shows in the right sidebar of any dashboard page.

4. Add two repository secrets: GitHub > Settings > Secrets and variables > Actions.

   | Secret                  | Value                 |
   | ----------------------- | --------------------- |
   | `CLOUDFLARE_API_TOKEN`  | API token from step 2 |
   | `CLOUDFLARE_ACCOUNT_ID` | Account ID from step 3 |

   Without `CLOUDFLARE_API_TOKEN`, the deploy job fails with `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work`.

5. Push `main` to GitHub. The workflow deploys to `https://portfolio-v2-6be.pages.dev` (Cloudflare appended the suffix because the plain name was taken).

### Custom domain

1. Add the domain in the Pages project: dashboard > portfolio-v2 > Custom domains.
2. Set `site` in `astro.config.mjs` so the `og:image` meta tag gets an absolute URL:

   ```js
   export default defineConfig({
     site: "https://your-domain.com",
     integrations: [react()],
   });
   ```
