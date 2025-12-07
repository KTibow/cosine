<script lang="ts">
  import Pane from "./Pane.svelte";
  import OInput, { omniContent } from "/lib/OInput.svelte";
  import ONav from "/lib/ONav.svelte";
  import ModelPicker from "/lib/models/ModelPicker.svelte";
  import type { Stack } from "/lib/types";

  type OPane = { topic: string; parentTopic: string | undefined; ancestry: string[] };
  let allPanes: OPane[] = [];
  let visiblePanes: OPane[] = $state([]);
  let stack: Stack = $state([]);

  function handleLink(newTopic: string, parentTopic?: string) {
    parentTopic ||= visiblePanes.at(-1)?.topic;
    const parent = parentTopic && allPanes.find((p) => p.topic === parentTopic);

    // Check if this topic already exists
    const existingIndex = allPanes.findIndex((p) => p.topic === newTopic);

    if (existingIndex !== -1) {
      // Topic exists - show it and its branch
      const existing = allPanes[existingIndex];
      showBranch(existing.topic);
      return;
    }

    // Get ancestry for new pane
    let ancestry: string[] = [];
    if (parent && parentTopic) {
      ancestry = [...parent.ancestry, parentTopic];
    }

    // Create new pane
    const newPane = {
      topic: newTopic,
      parentTopic,
      ancestry,
    };

    // Add to full tree
    allPanes = [...allPanes, newPane];

    // Update visible panes
    if (parentTopic) {
      // Insert after parent
      const parentIndex = visiblePanes.findIndex((p) => p.topic === parentTopic);
      visiblePanes = [...visiblePanes.slice(0, parentIndex + 1), newPane];
    } else {
      // No parent - clear visible panes and start new branch
      visiblePanes = [newPane];
    }
  }

  function showBranch(topic: string) {
    // Find the pane and all its ancestors
    const pane = allPanes.find((p) => p.topic === topic);
    if (!pane) return;

    // Build array of visible panes starting from root
    let branch = [];
    let current: OPane | undefined = pane;

    while (current) {
      branch.unshift(current);
      current = allPanes.find((p) => p.topic === current!.parentTopic);
    }

    visiblePanes = branch;
  }

  function handleSubmit(topic: string) {
    handleLink(topic);
  }
</script>

<ONav />

{#if visiblePanes.length}
  <div class="panes">
    {#each visiblePanes as pane (pane.topic + pane.parentTopic)}
      <Pane
        topic={pane.topic}
        ancestry={pane.ancestry}
        {stack}
        onLink={(target) => handleLink(target, pane.topic)}
      />
    {/each}
  </div>
{:else}
  <p style:margin="auto">Find your rabbit hole</p>
{/if}

<div class="input">
  <OInput submit={handleSubmit} animate={false} />
</div>
<div class="bottom-right-controls">
  <ModelPicker bind:stack minContext={0} useImageInput={false} />
</div>

<style>
  .panes {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    margin-bottom: -4rem;
    flex: 1 1 0;
    overflow: auto clip;
  }
  .input {
    display: flex;
    position: sticky;
    width: 100%;
    max-width: 50rem;
    @media (width > 50rem) {
      max-width: min(calc(100dvw - 20rem), 50rem);
    }
    align-self: center;
    bottom: 0;
    background-color: var(--m3c-surface-container-low);
    border-start-start-radius: 1.5rem;
    border-start-end-radius: 1.5rem;
  }
  .bottom-right-controls {
    display: flex;
    gap: 0.25rem;
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
  }
</style>
