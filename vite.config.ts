import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { monoserve } from "monoserve/plugin";

import type { Plugin } from "vite";
import { globSync, existsSync } from "fs";
import { rename, mkdir } from "fs/promises";
import { resolve, dirname } from "node:path";

export function routeGroups(): Plugin {
  const srcFiles = globSync("src/**/!(*.*)/*.html");
  const fileMap = new Map<string, string>();
  let outDirAbs = "";

  const scanFiles = () => {
    fileMap.clear();
    srcFiles.forEach((file) => {
      const url = "/" + file.replace("src/", "").replace(/\([^)]+\)\//g, ""); // remove (anything)/;

      fileMap.set(url, file);

      // Support root URL (/) for any .../index.html
      if (url.endsWith("/index.html")) {
        const base = url.replace(/index\.html$/, "");
        fileMap.set(base, file);
      }
    });
  };

  return {
    name: "vite-plugin-route-groups",

    configResolved(config) {
      scanFiles();
      outDirAbs = resolve(config.root || process.cwd(), config.build?.outDir || "dist");
    },

    configureServer(server) {
      // Rewrite URLs in dev server
      server.middlewares.use((req, _, next) => {
        if (req.url) {
          const cleanUrl = req.url.split("?")[0];
          const mapped = fileMap.get(cleanUrl);

          if (mapped) {
            const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
            req.url = "/" + mapped.replace(/^src\//, "") + query;
          }
        }
        next();
      });
    },

    // After Vite has written files to disk, move HTML files out of route-group folders
    // (generateBundle can't rename Vite's HTML files because they're written to disk separately)
    async writeBundle() {
      for (const srcHtml of srcFiles) {
        const rel = srcHtml.replace(/^src\//, ""); // e.g. "(home)/index.html"
        const cleaned = rel.replace(/\([^)]+\)\//g, ""); // e.g. "index.html"
        if (rel == cleaned) continue;

        const from = resolve(outDirAbs, rel);
        const to = resolve(outDirAbs, cleaned);

        // If source wasn't emitted, skip
        if (!existsSync(from)) continue;

        // collision check
        if (existsSync(to)) {
          this.error(`Route-group collision when renaming ${rel} -> ${cleaned}`);
        }

        // ensure destination directory exists
        await mkdir(dirname(to), { recursive: true });

        await rename(from, to);
      }
    },

    config() {
      return {
        build: {
          rollupOptions: {
            input: srcFiles,
          },
        },
      };
    },
  };
}

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [
    svelte(),
    routeGroups(),
    monoserve({ monoserverURL: "https://benignmonoserver.fly.dev" }),
  ],
});
