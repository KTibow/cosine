<script lang="ts">
  import { NewSnackbar } from "m3-svelte";
  import { Monoidentity } from "monoidentity";
  import type { Snippet } from "svelte";
  import "./lib/tob64-polyfill"; // todo remove when chrome is updated
  let { children }: { children: Snippet } = $props();
</script>

<Monoidentity
  app="cosine"
  getSyncStrategy={(path) => {
    if (path.startsWith(".config/cosine")) return { mode: "immediate" };
    if (path.startsWith(".userdata/cosine")) return { mode: "debounced", debounceMs: 4000 };
    return { mode: "none" };
  }}
>
  {@render children()}
</Monoidentity>
<NewSnackbar />
