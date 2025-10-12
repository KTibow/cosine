<script lang="ts">
  import type { Component } from "svelte";
  import GHC from "./providers/GHC.svelte";
  import { getStorage } from "monoidentity";
  import { Button } from "m3-svelte";

  const allProviders = {
    ghc: {
      name: "GitHub Copilot",
      description: "Tons of free monthly usage.",
      component: GHC,
    },
  };

  const config = getStorage("config");
  config.providers ||= {};

  let ExpandedComponent: Component | undefined = $state();
</script>

{#if ExpandedComponent}
  <ExpandedComponent />
{:else}
  <h2 class="m3-font-headline-large">
    Providers
    <span class="supporting">More providers means more models and more usage.</span>
  </h2>
  <div class="providers">
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
{/if}

<style>
  h2 {
    display: flex;
    align-items: center;
  }
  .supporting {
    margin-left: auto;
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  .providers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 25rem));
    gap: 0.5rem;
    margin-top: 1.5rem;
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
