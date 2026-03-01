<script lang="ts">
  import { getStorage } from 'monoidentity';
  import { Button } from 'm3-svelte';
  import GHC from './providers/GHC.svelte';
  import GHM from './providers/GHM.svelte';
  import GHCLimits from './limits/GHCLimits.svelte';
  import { setView } from './IndexController.svelte';

  const config = getStorage('config');
</script>

<div class="grid">
  <div class="provider">
    <div class="header">
      <h3>Cosine Models</h3>
      <Button disabled>Included</Button>
    </div>

    <p>Free access via Groq, Cerebras, Gemini, Anthropic, CrofAI, and OpenRouter.</p>
    <p>
      (To protect Cosine, observability infra is used for these models. You can verify this by
      looking at <a href="https://github.com/KTibow/cosine">its source</a>.)
    </p>
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

  <div class="provider">
    <div class="header">
      <h3>GitHub Models</h3>
      {#if config.providers.ghm}
        <Button disabled>Connected</Button>
      {:else}
        <Button onclick={() => setView(GHM)}>Connect</Button>
      {/if}
    </div>

    <p>A variety of OpenAI and non-OpenAI models.</p>
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
</style>
