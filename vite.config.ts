import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";

// https://vite.dev/config/
export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [svelte(), monoserve({ monoserverURL: "https://benignmonoserver.fly.dev" })],
});
