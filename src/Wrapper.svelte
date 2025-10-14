<script lang="ts">
  import { Monoidentity } from "monoidentity";
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

<Monoidentity app="cosine" shouldBackup={(path) => path.startsWith(".config/cosine")}>
  {@render children()}
</Monoidentity>
