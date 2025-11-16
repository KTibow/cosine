<script lang="ts">
  import type { Component } from "svelte";
  import { getStorage } from "monoidentity";
  import { Button } from "m3-svelte";
  import GHC from "./providers/GHC.svelte";
  import GHM from "./providers/GHM.svelte";
  import ONav from "/lib/ONav.svelte";
  import GHCLimits from "./limits/GHCLimits.svelte";

  const allProviders = {
    ghc: {
      name: "GitHub Copilot",
      description: "Tons of free monthly usage.",
      component: GHC,
    },
    ghm: {
      name: "GitHub Models",
      description: "A variety of OpenAI and non-OpenAI models.",
      component: GHM,
    },
  };

  const config = getStorage("config");
  config.providers ||= {};

  let ExpandedComponent: Component | undefined = $state();
</script>

<ONav />
{#if ExpandedComponent}
  <ExpandedComponent />
{:else}
  <h2 class="m3-font-headline-large">Limits</h2>
  <div class="grid limits root">
    {#if config.providers.ghc}
      <div class="limit">
        <h2>GitHub Copilot</h2>
        <GHCLimits {...config.providers.ghc} />
      </div>
    {/if}
  </div>
  <h2 class="m3-font-headline-large root">
    Providers
    <span class="supporting">More providers → more models and more usage.</span>
  </h2>
  <div class="grid root">
    {#each Object.entries(allProviders) as [key, provider]}
      {@const configured = config.providers[key]}
      <div class="provider">
        <h2>{provider.name}</h2>
        <p>{provider.description}</p>
        {#if configured}
          <Button disabled>Connected</Button>
        {:else}
          <Button onclick={() => (ExpandedComponent = provider.component)}>Connect</Button>
        {/if}
      </div>
    {/each}
  </div>
  <h2 class="m3-font-headline-large root">Disclosure</h2>
  <p class="root">
    We have observability infrastructure set up on models we provide to protect and improve Cosine.
  </p>
{/if}

<style>
  .root {
    margin-top: 1em;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 25rem));
    gap: 0.5rem;
  }

  h2 {
    display: flex;
    align-items: center;
  }
  .supporting {
    margin-left: auto;
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  :global(body:has(.limits:empty)) {
    > h2:first-of-type,
    > .limits {
      display: none;
    }
    > h2:nth-of-type(2) {
      margin-top: 0;
    }
  }

  .limit {
    display: flex;
    flex-direction: column;

    padding: 0.5rem;
    border-radius: 1.25rem;
    background: rgb(var(--m3-scheme-surface-container));

    > h2 {
      font-weight: bold;
    }
  }

  .provider {
    display: flex;
    flex-direction: column;

    padding: 0.5rem;
    border-radius: 1.25rem;
    background: rgb(var(--m3-scheme-surface-container));

    > h2 {
      font-weight: bold;
    }
    > :global(button) {
      margin: 0.5rem -0.5rem -0.5rem -0.5rem;
    }
  }
</style>
