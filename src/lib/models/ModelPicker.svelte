<script lang="ts">
  import type { ComponentProps } from "svelte";
  import type { Stack } from "../types";
  import ModelPickerLogic from "./ModelPickerLogic.svelte";
  import ModelPickerMenu from "./ModelPickerMenu.svelte";

  let {
    stack = $bindable(),
    ...extra
  }: { stack: Stack } & Omit<
    ComponentProps<typeof ModelPickerLogic>,
    "stack" | "model" | "open" | "children"
  > = $props();

  let model = $state("Kimi K2");
  let choosingSince: number | undefined = $state();
</script>

<ModelPickerLogic bind:stack bind:model {...extra}>
  {#snippet children({
    model,
    modelsDisplayed,
    eloWeight,
    thinking,
    setWeight,
    setThinking,
    selectModel,
    currentReasoningEffort,
    availableReasoningEfforts,
    setReasoningEffort,
    selectedModelGroupName,
  })}
    <div class="controls" style:opacity={choosingSince ? 0 : undefined}>
      {#if availableReasoningEfforts}
        <div class="effort-chooser">
          {#each availableReasoningEfforts as effort}
            <button
              class="m3-layer"
              class:selected={currentReasoningEffort == effort}
              onclick={() => setReasoningEffort(effort)}
            >
              {effort}
            </button>
          {/each}
        </div>
      {/if}
      <button
        class="chooser"
        onpointerdown={() => {
          choosingSince = Date.now();
        }}
      >
        <span>{selectedModelGroupName}</span>
      </button>
    </div>
    {#if choosingSince}
      <ModelPickerMenu
        bottomRight
        {modelsDisplayed}
        {selectModel}
        bind:sort={() => eloWeight, setWeight}
        bind:thinking={() => thinking, setThinking}
        bind:choosingSince
      />
    {/if}
  {/snippet}
</ModelPickerLogic>

<style>
  .controls {
    position: fixed;
    bottom: 0;
    right: 0;
    display: flex;
  }
  .effort-chooser {
    display: flex;
    background-color: var(--m3c-surface-container-high);
    border-radius: var(--m3-shape-medium);
    margin-block: 0.25rem;

    button {
      @apply --m3-label-medium;
      display: flex;
      align-items: center;
      padding-inline: 0.5rem;
      border-radius: var(--m3-shape-medium);
      color: var(--m3c-on-surface-variant);
      transition: var(--m3-easing-fast);

      &.selected {
        background-color: var(--m3c-primary);
        color: var(--m3c-on-primary);
      }
    }
  }
  .chooser {
    padding-block: 0.5rem;
    padding-inline: 0.5rem;
  }
  span {
    display: flex;
    padding-block: 0.5rem;
    padding-inline: 0.5rem;
    border-radius: 0.5rem;
    outline: solid 1px var(--m3c-outline-variant);
    color: var(--m3c-on-surface-variant);
    transition: var(--m3-easing-fast);
  }
  .chooser:hover span {
    outline-color: var(--m3c-outline);
  }
</style>
