import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";

import { globSync } from "fs";
import { resolve } from "node:path";

export default defineConfig({
  root: "src",
  build: {
    rollupOptions: {
      input: globSync("src/*.html"),
    },
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [
    svelte(),
    monoserve({
      monoserverURL: "https://benignmonoserver.fly.dev",
      rolldownInputOptions: { resolve: { alias: { "/lib": resolve(__dirname, "src/lib") } } },
    }),
  ],
});
