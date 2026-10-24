import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const virtualModuleId = 'virtual:cod-js';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

/** Serves the full source of the cod script (from the gadidae npm package) as a string. */
export default function codJs(): Plugin {
  return {
    name: 'vite-plugin-cod-js',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;
      // gadidae's exports map only exposes ".", whose target is dist/index.js
      const entry = createRequire(import.meta.url).resolve('gadidae');
      return `export default ${JSON.stringify(readFileSync(entry, 'utf8'))};`;
    },
  };
}
