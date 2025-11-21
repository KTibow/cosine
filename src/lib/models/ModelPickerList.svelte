<script lang="ts">
  import { Button, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import { flip } from "svelte/animate";

  let {
    bottomRight = false,
    modelNames,
    modelStacks,
    elos,
    onModelSelect,
    initialThinking,
  }: {
    bottomRight?: boolean;
    modelNames: string[];
    modelStacks: Record<string, any[]>;
    elos: Record<string, number>;
    onModelSelect: (model: string) => void;
    initialThinking?: "only" | "exclude" | undefined;
  } = $props();

  // Internal state - the list controls its own filtering/sorting
  let sort: "recommended" | "speed" | "intelligence" = $state("recommended");
  let thinking: "only" | "exclude" | undefined = $state(initialThinking);

  // Compute displayed models based on internal state
  let modelsDisplayed = $derived.by(() => {
    const modelEntries = modelNames
      .filter((name) => {
        if (thinking == "only") {
          return name.endsWith(" Thinking");
        }
        if (thinking == "exclude") {
          return !name.endsWith(" Thinking");
        }
        return true;
      })
      .map((name) => {
        const stack = modelStacks[name];
        const speed = Math.log(stack[0].specs.speed);
        const elo = elos[name] || 1200;
        return [name, { speed, elo }] as const;
      });
    const minElo = 1200;
    const maxElo = Math.max(...Object.values(elos));
    const eloRange = maxElo - minElo;
    const minSpeed = Math.log(20);
    const maxSpeed = Math.log(2500);
    const speedRange = maxSpeed - minSpeed;
    let modelEntriesScored = modelEntries
      .map(([name, m]) => {
        const normElo = eloRange ? (m.elo - minElo) / eloRange : 0.5;
        const normSpeed = speedRange ? (m.speed - minSpeed) / speedRange : 0.5;
        const score =
          sort == "recommended"
            ? 0.6 * normElo + 0.4 * normSpeed
            : sort == "speed"
              ? normSpeed + 0.00001 * normElo
              : normElo + 0.00001 * normSpeed;
        const visualScore = sort == "recommended" ? Math.log(score) : score;
        return { name, score, visualScore };
      })
      .sort((a, b) => b.score - a.score);
    if (sort == "recommended") {
      modelEntriesScored = modelEntriesScored.slice(0, 8);
    }
    const minScore = Math.min(...modelEntriesScored.map((m) => m.visualScore).filter((m) => m));
    const maxScore = Math.max(...modelEntriesScored.map((m) => m.visualScore).filter((m) => m));
    const scoreRange = maxScore - minScore;
    return modelEntriesScored.map((m) => ({
      name: m.name,
      visualScore: m.visualScore && scoreRange ? (m.visualScore - minScore) / scoreRange : 0,
    }));
  });
</script>

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
  <input
    type="radio"
    id="thinking-exclude"
    name="thinking"
    value="exclude"
    bind:group={thinking}
  />
  <Button for="thinking-exclude" square>Direct</Button>
</div>
<div
  class="popup popup-models"
  class:bottomRight
  transition:slide={{ duration: 500, easing: easeEmphasized }}
>
  {#each modelsDisplayed as { name, visualScore } (name)}
    {@const paid = modelStacks[name][0].specs.pricing == "paid"}
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
      onpointerdown={() => onModelSelect(name)}
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
    > :global(input) {
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
