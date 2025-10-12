<script lang="ts">
  import type { Stack } from "../types";

  let { stack = $bindable(), fixed }: { stack: Stack; fixed: boolean } = $props();

  const models: Record<string, Stack> = {
    "Kimi K2": [
      {
        provider: "Groq via Cosine",
        model: "moonshotai/kimi-k2-instruct-0905",
      },
    ],
    "gpt-oss-120b": [
      {
        provider: "Groq via Cosine",
        model: "openai/gpt-oss-120b",
      },
    ],
    "gpt-oss-20b": [
      {
        provider: "Groq via Cosine",
        model: "openai/gpt-oss-20b",
      },
    ],
  };

  let model = $state("Kimi K2");
  $effect(() => {
    stack = models[model];
  });
</script>

<select class:fixed bind:value={model}>
  {#each Object.keys(models) as modelName}
    <option>{modelName}</option>
  {/each}
</select>

<style>
  select {
    height: 3rem;
    padding-inline: 1rem;
    border-radius: 1.5rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    cursor: pointer;
    &.fixed {
      position: fixed;
      right: 0.5rem;
      bottom: 0.5rem;
    }
  }
</style>
