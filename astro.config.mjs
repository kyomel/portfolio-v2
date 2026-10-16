import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://portfolio-v2.michaellapandio04.workers.dev",
  integrations: [react()],
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
