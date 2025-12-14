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
  })}
    <button
      class="chooser"
      onpointerdown={() => {
        choosingSince = Date.now();
      }}
      style:opacity={choosingSince ? 0 : undefined}
    >
      <span>{model}</span>
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
    position: fixed;
    bottom: 0;
    right: 0;
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
