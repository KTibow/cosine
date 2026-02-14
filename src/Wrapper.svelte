<script lang="ts">
  import { Snackbar } from "m3-svelte";
  import { Monoidentity } from "monoidentity";
  import type { Snippet } from "svelte";
  import "./lib/tob64-polyfill"; // todo remove when chrome is updated
  let { children }: { children: Snippet } = $props();
</script>

<Monoidentity
  getSyncStrategy={(path) => {
    if (path.startsWith(".config/cosine")) return { mode: "immediate" };
    if (path.startsWith(".userdata/cosine")) return { mode: "debounced", debounceMs: 4000 };
    return undefined;
  }}
>
  {@render children()}
</Monoidentity>
<Snackbar />
