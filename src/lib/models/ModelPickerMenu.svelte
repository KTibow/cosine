<script lang="ts">
  import { Button, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import { flip } from "svelte/animate";

  let {
    bottomRight = false,
    modelsDisplayed,
    sort = $bindable(),
    thinking = $bindable(),
    choosingSince = $bindable(),
    selectModel,
  }: {
    bottomRight?: boolean;
    modelsDisplayed: Array<{ name: string; visualScore: number; pricing: "free" | "paid" }>;
    sort: "recommended" | "speed" | "intelligence";
    thinking: "only" | "exclude" | undefined;
    choosingSince: number | undefined;
    selectModel: (name: string) => void;
  } = $props();
</script>
<svelte:window
  onpointerup={(e) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    const target = e.target as HTMLElement;
    if (choosingSince && Date.now() - choosingSince > 333) {
      const label = target.closest("label");
      if (label?.classList.contains("m3-container")) return;
      const button = target.closest("button");
      const newModel = button?.dataset.model;
      if (newModel) {
        selectModel(newModel);
      }

      delayIfSmall(() => (choosingSince = undefined));
    }
  }}
/>
<div
  class="popup popup-filters"
  class:bottomRight
  transition:slide={{ duration: 500, easing: easeEmphasized }}
>
  <input type="radio" id="sort-recommended" name="sort" value="recommended" bind:group={sort} />
  <Button variant="tonal" for="sort-recommended" square>Recommended</Button>
  <input type="radio" id="sort-intelligence" name="sort" value="intelligence" bind:group={sort} />
  <Button variant="tonal" for="sort-intelligence" square>Intelligence</Button>
  <input type="radio" id="sort-speed" name="sort" value="speed" bind:group={sort} />
  <Button variant="tonal" for="sort-speed" square>Speed</Button>
  <div class="gap"></div>
  <input type="radio" id="thinking-only" name="thinking" value="only" bind:group={thinking} />
  <Button for="thinking-only" square>Thinking</Button>
  <input type="radio" id="thinking-exclude" name="thinking" value="exclude" bind:group={thinking} />
  <Button for="thinking-exclude" square>Direct</Button>
</div>
<div
  class="popup popup-models"
  class:bottomRight
  transition:slide={{ duration: 500, easing: easeEmphasized }}
>
  {#each modelsDisplayed as { name, visualScore, pricing } (name)}
    {@const paid = pricing == "paid"}
    {@const isThinking = name.endsWith(" Thinking")}
    {@const baseName = isThinking ? name.slice(0, -9) : name}
    <button
      class="model"
      class:dont-shrink={sort != "recommended"}
      data-model={name}
      style:background-color="color-mix(in oklab, rgb(var(--m3-scheme-secondary-container-subtle)) {visualScore *
        100}%, rgb(var(--m3-scheme-surface-container-low)))"
      style:color="color-mix(in oklab, rgb(var(--m3-scheme-on-secondary-container-subtle)) {visualScore *
        100}%, rgb(var(--m3-scheme-on-surface-variant)))"
      animate:flip={{ duration: 400, easing: easeEmphasized }}
    >
      <Layer />
      {baseName}
      {#if isThinking}
        <span class="thinking-badge">Thinking</span>
      {/if}
      {#if paid}
        <span class="price-badge">$</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .popup {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    z-index: 1;
    overflow: auto;
  }
  .popup-filters {
    > input {
      position: absolute;
      pointer-events: none;
      opacity: 0;
    }
    > .gap {
      height: 2rem;
    }
    &.bottomRight {
      flex-direction: column-reverse;
      position: fixed;
      bottom: 0.5rem;
      right: 16rem;
    }
  }
  .popup-models {
    width: 15rem;
    &.bottomRight {
      flex-direction: column-reverse;
      position: fixed;
      bottom: 0.5rem;
      right: 0.5rem;
      max-height: calc(100dvh - 1rem);
    }
  }
  .model {
    display: flex;
    align-items: center;
    text-align: start;
    height: 3rem;
    &.dont-shrink {
      min-height: 2rem;
    }
    padding-inline: 0.5rem;
    border-radius: 0.5rem;

    overflow: hidden;
    position: relative;

    transition:
      background-color var(--m3-util-easing-slow),
      color var(--m3-util-easing-slow);

    .thinking-badge {
      opacity: 0.5;
      margin-left: 0.5ch;
    }
    .price-badge {
      display: flex;
      width: 1.5rem;
      height: 1.5rem;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }
  }
</style>
