/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'virtual:cod-js' {
  /** The full source of the cod script, bundled at build time from the gadidae package. */
  const codJs: string;
  export default codJs;
}
