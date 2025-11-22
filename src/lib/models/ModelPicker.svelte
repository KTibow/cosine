<script lang="ts">
  import { Layer } from "m3-svelte";
  import type { ComponentProps } from "svelte";
  import type { Stack } from "../types";
  import ModelPickerLogic from "./ModelPickerLogic.svelte";
  import ModelPickerMenu from "./ModelPickerMenu.svelte";

  let {
    stack = $bindable(),
    bottomRight = false,
    ...extra
  }: { stack: Stack; bottomRight?: boolean } & Omit<
    ComponentProps<typeof ModelPickerLogic>,
    "stack" | "model" | "open" | "children"
  > = $props();

  let model = $state("Kimi K2");
  let choosingSince: number | undefined = $state();
</script>

<ModelPickerLogic bind:stack bind:model {...extra}>
  {#snippet children({ model, modelsDisplayed, sort, thinking, setSort, setThinking, selectModel })}
    <button
      class="chooser"
      class:bottomRight
      onpointerdown={() => {
        choosingSince = Date.now();
      }}
      style:opacity={choosingSince ? 0 : undefined}
    >
      <Layer />
      {model}
    </button>
    {#if choosingSince}
      <ModelPickerMenu
        {bottomRight}
        {modelsDisplayed}
        {selectModel}
        bind:sort={() => sort, setSort}
        bind:thinking={() => thinking, setThinking}
        bind:choosingSince
      />
    {/if}
  {/snippet}
</ModelPickerLogic>

<style>
  .chooser {
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
    z-index: 1;
    padding: 0.5rem 1rem;
    border-radius: 1.5rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    transition: opacity var(--m3-util-easing-fast);

    &.bottomRight {
      /* already positioned */
    }
  }
</style>
