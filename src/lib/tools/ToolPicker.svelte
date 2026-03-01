<script lang="ts">
  import { Icon, easeEmphasized } from 'm3-svelte';
  import iconCheck from '@ktibow/iconset-material-symbols/check-rounded';
  import { slide } from 'svelte/transition';
  import { tools } from './index';

  let { enabledTools = $bindable([]) }: { enabledTools: string[] } = $props();

  let innerWidth: number | undefined = $state();

  const toggleTool = (toolName: string) => {
    if (enabledTools.includes(toolName)) {
      enabledTools = enabledTools.filter((t) => t !== toolName);
    } else {
      enabledTools = [...enabledTools, toolName];
    }
  };
</script>

<svelte:window bind:innerWidth />

{#each Object.keys(tools) as toolName}
  {@const isEnabled = enabledTools.includes(toolName)}
  <button class="chooser m3-layer" class:enabled={isEnabled} onclick={() => toggleTool(toolName)}>
    {#if toolName == 'eval_code'}
      <span>Calculator</span>
    {:else if toolName == 'web_search'}
      <span>Search</span>
    {/if}
    {#if isEnabled}
      <div
        class="check-icon"
        transition:slide={{ axis: 'x', duration: 300, easing: easeEmphasized }}
      >
        <Icon icon={iconCheck} />
      </div>
    {/if}
  </button>
{/each}

<style>
  .chooser {
    @apply --m3-label-large;
    letter-spacing: 0;
    display: flex;
    align-items: center;
    transition: opacity var(--m3-easing-fast);
  }

  .check-icon {
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
  }
</style>
