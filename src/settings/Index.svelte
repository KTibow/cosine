<script lang="ts">
  import { getStorage } from 'monoidentity';
  import { Button, Switch } from 'm3-svelte';
  import GHC from './providers/GHC.svelte';
  import GHCLimits from './limits/GHCLimits.svelte';
  import { setView } from './IndexController.svelte';

  const config = getStorage('config');
  let showExpensiveModels = $state(config.showExpensiveModels ?? false);

  $effect(() => {
    config.showExpensiveModels = showExpensiveModels;
    void config.sync('showExpensiveModels');
  });
</script>

<div class="grid">
  <div class="provider">
    <div class="header">
      <h3>Cosine Models</h3>
      <Button disabled>Included</Button>
    </div>

    <p>
      Free access via OpenRouter + Hack Club, GitHub Models, CrofAI, Groq, Cerebras, and Gemini.
    </p>
    <p>
      (To protect Cosine, observability infra is used for these models. You can verify this by
      looking at <a href="https://github.com/KTibow/cosine">its source</a>.)
    </p>
    <label class="toggle">
      <span>Show models over $20/M output tokens</span>
      <Switch bind:checked={showExpensiveModels} />
    </label>
  </div>

  <div class="provider">
    <div class="header">
      <h3>GitHub Copilot</h3>
      {#if config.providers.ghc}
        <Button disabled>Connected</Button>
      {:else}
        <Button onclick={() => setView(GHC)}>Connect</Button>
      {/if}
    </div>

    <p>Tons of free monthly usage.</p>

    {#if config.providers.ghc}
      <GHCLimits {...config.providers.ghc} />
    {/if}
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: 1rem;
    flex-grow: 1;
  }

  .provider {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    padding: 1rem;
    border-radius: 1.5rem;
    background-color: var(--m3c-surface-container);
    color: var(--m3c-on-surface-variant);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    color: var(--m3c-on-surface);

    > h3 {
      @apply --m3-title-large;
    }
  }

  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: var(--m3c-on-surface);
  }
</style>
