<script module lang="ts">
  export const allPrompts: Record<string, string> = {
    None: "",
    Concise: "Be as concise as possible.",
    Socratic:
      "Guide the user through any questions they ask by being socratic. You really want the user to figure this out themselves.",
    "Mental Model":
      "Guide the user through any questions they ask by giving them the larger picture, so they can build a mental model before finding the answers.",
    Research: `You are now in deep research mode. Here's a guide:
1. Research Loop
  a. Reflect on what you know and what you don't know
  b. If you're 100% sure you can write a report, you've used tools enough times, and you're sure you're not missing any context due to recent developments or truncated websites, you can end your research
  c. Otherwise, work towards the goal, applying powerful settings like parallelism and pulling in many results
  d. Read the results
  e. Repeat
2. Plan for Report
  Reflect on everything you've gathered and the large list of (relevant and irrelevant) websites and points along the way
3. Write a report that builds understanding. Write at a length appropriate to cover the complexity of the topic comprehensively, from several paragraphs for quick overviews to many pages for deep inquiries. Follow these requirements:
  1. Begin with the most important insight or conclusion, clearly stated and expanded through several paragraphs that provide essential context
  2. Structure the analysis to reveal connections:
    - For historical topics: Show how each development led to the next
    - For comparative analysis: Examine underlying patterns before specifics
    - For technical topics: Connect features to their implications
    - When comparing options: Use tables
  3. Use sections thoughtfully:
    - The header (#) should cover the main theme
    - Sections (##) should look at complex themes and ideas across multiple paragraphs
    - Don't overcompartmentalize though
    - Prefer extended discussion over lists
  4. Support claims with specific citations: inline citations follow a format like ([Author](url))
  5. Generally be transparent but go beyond a surface level`,
    AumSum: `You're now... the AumSum YouTube channel. AumSum is a YouTube channel that produces animated videos, where the animated character AumSum explores different "what if" scenarios. In the script, each (almost always cheesy) scenario is on a different line. For every scenario the user gives you, produce a script that looks a little like <example>What if offices turned into gyms?
Cool! AumSum has huge muscles. Oh AumSum.
If offices turned into gyms:
Bosses may start thinking twice before scolding any employee.
Even without the boss telling them, people may start working overtime in the office.
Best employee award may be won by the most fit employee instead of the most working employee.
Instead of getting bored, people may be super excited about going to the office.
Gym enthusiasts may never leave the office.
Carrying office boxes and files will be an extremely easy task now.
People may be seen exercising and working at the same time.
Office equipment may go out, gym equipment may come in.
People may start using everything in the office for weight lifting.
Office pizza parties may get replaced with healthy salad parties.
To buy AumSum merchandise visit AumSum.com.`,
  };
</script>

<script lang="ts">
  import { Layer, Icon, easeEmphasized } from "m3-svelte";
  import iconCheck from "@ktibow/iconset-material-symbols/check-rounded";
  import { slide } from "svelte/transition";

  let {
    selectedPrompt = $bindable("None"),
    toolsEnabled = false,
  }: { selectedPrompt: string; toolsEnabled: boolean } = $props();

  let promptsOpenSince: number | undefined = $state();
  let innerWidth: number | undefined = $state();

  const prompts = $derived(
    toolsEnabled
      ? allPrompts
      : Object.fromEntries(Object.entries(allPrompts).filter(([key]) => key !== "Research")),
  );

  $effect(() => {
    if (selectedPrompt === "Research" && !toolsEnabled) {
      selectedPrompt = "None";
    }
  });
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
    if (promptsOpenSince && Date.now() - promptsOpenSince > 333) {
      const button = target.closest("button");
      const newPrompt = button?.dataset.prompt;
      if (newPrompt) {
        selectedPrompt = newPrompt;
      }
      delayIfSmall(() => (promptsOpenSince = undefined));
    }
  }}
/>

<div class="prompt-picker-root">
  <button
    class="chooser"
    class:active={selectedPrompt != "None"}
    onpointerdown={() => {
      promptsOpenSince = Date.now();
    }}
    style:opacity={promptsOpenSince ? 0 : undefined}
  >
    <Layer />
    {selectedPrompt == "None" ? "Prompt" : selectedPrompt}
  </button>
  {#if promptsOpenSince}
    <div class="menu" transition:slide={{ duration: 500, easing: easeEmphasized }}>
      {#each Object.keys(prompts) as promptKey}
        {@const isSelected = selectedPrompt == promptKey}
        <button class="prompt-item" class:enabled={isSelected} data-prompt={promptKey}>
          <Layer />
          {#if isSelected}
            <div
              class="check-icon"
              transition:slide={{ axis: "x", duration: 300, easing: easeEmphasized }}
            >
              <Icon icon={iconCheck} />
            </div>
          {/if}
          <span>{promptKey}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .prompt-picker-root {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .chooser {
    @apply --m3-label-large;
    letter-spacing: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    &.active {
      background-color: var(--m3c-primary-container-subtle);
      color: var(--m3c-on-primary-container-subtle);
    }
    transition: opacity var(--m3-easing-fast);
    position: relative;
  }

  .menu {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--m3c-surface-container-lowest);
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .prompt-item {
    display: flex;
    align-items: center;
    height: 3rem;
    border-radius: var(--m3-shape-full);
    padding-inline: 1rem;
    white-space: nowrap;
    position: relative;
  }

  .prompt-item.enabled {
    background-color: var(--m3c-primary-container-subtle);
    color: var(--m3c-on-primary-container-subtle);
  }

  .check-icon {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
  }
</style>
