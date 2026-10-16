import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://portfolio-v2.michaellapandio04.workers.dev",
  integrations: [react()],
});
