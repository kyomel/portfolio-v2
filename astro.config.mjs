import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://portfolio-v2.michaellapandio04.workers.dev",
  integrations: [react()],
  markdown: {
    shikiConfig: {
      // dual themes; the page CSS picks the token palette from the dataset
      // theme and keeps our warm surface as the block background
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
  vite: {
    // `astro build` pre-bundles production React into `node_modules/.vite/deps`,
    // which is also the cache the dev server serves from. When both share it,
    // a build poisons the running dev server: islands hydrate against
    // production React without `jsxDEV` and crash. Give build its own cache.
    cacheDir:
      process.env.NODE_ENV === "production"
        ? "node_modules/.vite-build"
        : "node_modules/.vite",
  },
});
