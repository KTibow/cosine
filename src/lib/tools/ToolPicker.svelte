<script lang="ts">
  import { Layer, Icon, easeEmphasized } from "m3-svelte";
  import iconTools from "@ktibow/iconset-material-symbols/construction-rounded";
  import iconCheck from "@ktibow/iconset-material-symbols/check-rounded";
  import { slide } from "svelte/transition";
  import { tools } from "./index";

  let { enabledTools = $bindable([]) }: { enabledTools: string[] } = $props();

  let toolsOpenSince: number | undefined = $state();
  let innerWidth: number | undefined = $state();

  const toggleTool = (toolName: string) => {
    if (enabledTools.includes(toolName)) {
      enabledTools = enabledTools.filter((t) => t !== toolName);
    } else {
      enabledTools = [...enabledTools, toolName];
    }
  };

  const toolMetadata: Record<string, { displayName: string }> = {
    eval_code: { displayName: "Calculator" },
  };
</script>

<svelte:window
  bind:innerWidth
  onpointerup={(e) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth && innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    const target = e.target as HTMLElement;
    if (toolsOpenSince && Date.now() - toolsOpenSince > 333) {
      const clickedOnTools = Boolean(target.closest(".tool-picker-root"));
      if (!clickedOnTools) {
        delayIfSmall(() => (toolsOpenSince = undefined));
      }
    }
  }}
/>

<div class="tool-picker-root">
  <button
    class="chooser"
    onpointerdown={() => {
      toolsOpenSince = Date.now();
    }}
    style:opacity={toolsOpenSince ? 0 : undefined}
  >
    <Layer />
    <Icon icon={iconTools} />
    Tools
  </button>
  {#if toolsOpenSince}
    <div class="menu" transition:slide={{ duration: 500, easing: easeEmphasized }}>
      {#each Object.keys(tools) as toolName}
        {@const isEnabled = enabledTools.includes(toolName)}
        <button class="tool-item" class:enabled={isEnabled} onclick={() => toggleTool(toolName)}>
          <Layer />
          {#if isEnabled}
            <div
              class="check-icon"
              transition:slide={{ axis: "x", duration: 300, easing: easeEmphasized }}
            >
              <Icon icon={iconCheck} />
            </div>
          {/if}
          <span>{toolMetadata[toolName]?.displayName || toolName}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tool-picker-root {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .chooser {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 3rem;
    padding-inline: 1rem;
    border-radius: 1.5rem;
    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    color: rgb(var(--m3-scheme-on-surface-variant));
    transition: opacity var(--m3-util-easing-fast);
    position: relative;
  }

  .menu {
    position: absolute;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column-reverse;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .tool-item {
    display: flex;
    align-items: center;
    height: 3rem;
    padding-inline: 1rem;
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
    transition: var(--m3-util-easing);
    white-space: nowrap;
    position: relative;
  }

  .tool-item.enabled {
    background-color: rgb(var(--m3-scheme-primary-container-subtle));
    color: rgb(var(--m3-scheme-on-primary-container-subtle));
  }

  .check-icon {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
  }
</style>
