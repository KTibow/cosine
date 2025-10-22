<script lang="ts">
  import { NewSnackbar } from "m3-svelte";
  import { Monoidentity } from "monoidentity";
  import type { Snippet } from "svelte";
  import "./lib/tob64-polyfill"; // todo remove when chrome is updated
  let { children }: { children: Snippet } = $props();
</script>

<Monoidentity app="cosine" shouldBackup={(path) => path.startsWith(".config/cosine")}>
  {@render children()}
</Monoidentity>
<NewSnackbar />
