<script lang="ts">
  import { Icon, easeEmphasized } from 'm3-svelte';
  import iconCheck from '@ktibow/iconset-material-symbols/check-rounded';
  import { slide } from 'svelte/transition';
  import type { Stack } from '/lib/types';
  import { toolLabels, toolsFor, type ToolName } from './index';

  let { stack, enabledTools = $bindable([]) }: { stack: Stack; enabledTools: ToolName[] } =
    $props();

  // Offer a tool as long as something we'd fall back to runs it; providers that
  // don't simply never get asked.
  let available = $derived([
    ...new Set(stack.flatMap(({ provider, options }) => toolsFor(provider, options.model))),
  ]);

  const toggleTool = (tool: ToolName) => {
    if (enabledTools.includes(tool)) {
      enabledTools = enabledTools.filter((t) => t !== tool);
    } else {
      enabledTools = [...enabledTools, tool];
    }
  };
</script>

{#each available as tool}
  {@const isEnabled = enabledTools.includes(tool)}
  <button class="chooser m3-layer" class:enabled={isEnabled} onclick={() => toggleTool(tool)}>
    <span>{toolLabels[tool]}</span>
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
