import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";
import { tokenShaker } from "vite-plugin-token-shaker";
import { functionsMixins } from "vite-plugin-functions-mixins";

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
    tokenShaker({ verbose: true }),
    functionsMixins({ deps: ["m3-svelte"] }),
  ],
});
