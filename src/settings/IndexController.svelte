<script lang="ts" module>
  import type { Component } from 'svelte';

  let View: Component | undefined = $state();
  export const setView = (v: Component) => (View = v);
</script>

<script lang="ts">
  import { getStorage } from 'monoidentity';
  import Index from './Index.svelte';
  import { DEFAULT_SHOW_EXPENSIVE_MODELS } from './constants';

  const config = getStorage('config');
  if (!config.providers) {
    config.sync('providers').then(() => {
      config.providers ||= {};
    });
  }
  if (config.showExpensiveModels == null) {
    config.sync('showExpensiveModels').then(() => {
      config.showExpensiveModels ??= DEFAULT_SHOW_EXPENSIVE_MODELS;
    });
  }
</script>

{#if View}
  <View />
{:else if !config.providers || config.showExpensiveModels == null}
  <p style:margin="auto" style:color="var(--m3c-on-surface-variant)">Syncing</p>
{:else}
  <Index />
{/if}
