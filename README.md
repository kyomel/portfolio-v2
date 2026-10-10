# portfolio-v2

Personal CV portfolio of Michael Stevan Lapandio ([KyoMel](https://github.com/kyomel)). Minimalist single-page site: sticky sidebar rail, editorial main column, light/dark theme, CSS-only motion.

## Stack

- [Astro 7](https://astro.build) - static output, zero framework JS except one island
- [React 19](https://react.dev) - single island: the contact form (`client:load`)
- TypeScript (strict) - all CV content is typed data
- [Bun](https://bun.sh) - package manager and script runner

## Project structure

```
src/
  data/profile.ts            # all CV content (typed)
  pages/index.astro          # the single page
  layouts/Base.astro         # head: favicon, OG tags, theme restore script
  components/ContactForm.tsx # only React island; builds a mailto: link
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

Do not connect this repo through the dashboard Git integration (Workers & Pages > Connect to Git). A Git-connected Pages project rejects `wrangler pages deploy`, and the Cloudflare build image ships an older Bun (1.2.15) that cannot parse this repo's `bun.lock` (`lockfileVersion: 2`, written by Bun 1.4+). Deploys come from GitHub Actions only.

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
