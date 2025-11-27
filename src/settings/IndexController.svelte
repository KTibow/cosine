<script lang="ts" module>
  import type { Component } from "svelte";

  let View: Component | undefined = $state();
  export const setView = (v: Component) => (View = v);
</script>

<script lang="ts">
  import { getStorage, completeSync } from "monoidentity";
  import Index from "./Index.svelte";

  const config = getStorage("config");
  if (!config.providers) {
    completeSync().then(() => {
      config.providers ||= {};
    });
  }
</script>

{#if View}
  <View />
{:else if !config.providers}
  <p style:margin="auto" style:color="rgb(var(--m3-scheme-on-surface-variant))">Syncing</p>
{:else}
  <Index />
{/if}
