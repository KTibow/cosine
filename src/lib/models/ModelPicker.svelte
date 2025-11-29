<script lang="ts">
  import { Layer } from "m3-svelte";
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
  })}
    <button
      class="chooser"
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
  .chooser {
    height: 3rem;
    padding-inline: 1rem;
    border-radius: 1.5rem;
    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    color: rgb(var(--m3-scheme-on-surface-variant));
    transition: opacity var(--m3-util-easing-fast);
    position: relative;
  }
</style>
