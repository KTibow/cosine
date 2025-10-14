<script lang="ts">
  import { getStorage } from "monoidentity";
  import type { Stack } from "../types";
  import type { Provider } from "../generate/directory";
  import useDirectoryListRemote from "../generate/use-directory-list.remote";
  import getAccessToken from "../generate/copilot/get-access-token";
  import modelData from "./modelData";
  import { Button, ConnectedButtons, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import ghmListRemote from "../generate/ghm-list.remote";

  let { stack = $bindable(), inverted }: { stack: Stack; inverted: boolean } = $props();

  const cache = getStorage("cache");
  const config = getStorage("config");

  let choosingSince: number | undefined = $state();
  let sort: "recommended" | "speed" | "intelligence" = $state("recommended");
  let model = $state("Kimi K2");
  $effect(() => {
    stack = models[model];
  });

  const modelsExtended = $derived.by(() => {
    const ms = Object.keys(models);
    let msExtended = ms.map((m) => {
      const data = (modelData as Record<string, any>)[m] || { speed: 0, intelligence: 0 };
      const score =
        sort == "speed"
          ? data.speed
          : sort == "intelligence"
            ? data.intelligence
            : data.speed + data.intelligence;
      return { name: m, score };
    });
    msExtended.sort((a, b) => b.score - a.score);
    if (sort == "recommended") {
      msExtended = msExtended.slice(0, 6);
    }

    let minScore = msExtended.reduce((min, m) => Math.min(min, m.score), Infinity);
    let maxScore = msExtended.reduce((max, m) => Math.max(max, m.score), -Infinity);
    if (maxScore > minScore) {
      for (const m of msExtended) {
        m.score = (m.score - minScore) / (maxScore - minScore);
      }
    } else {
      for (const m of msExtended) {
        m.score = 0;
      }
    }

    return msExtended;
  });

  const groqModels = {
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "Kimi K2": "moonshotai/kimi-k2-instruct-0905",
  };
  const cerebrasModels = { "gpt-oss-120b": "gpt-oss-120b" };
  const geminiModels = { "Gemini 2.5 Pro": "models/gemini-2.5-pro" };
  const GHM_CACHE_KEY = "GitHub Models models";
  const GHC_CACHE_KEY = "GitHub Copilot models";
  let ghmModels: Record<string, string> = $state(cache[GHM_CACHE_KEY] || {});
  let ghcModels: Record<string, string> = $state(cache[GHC_CACHE_KEY] || {});

  const cleanName = (name: string) =>
    name
      .replace(/^OpenAI (?=o|gpt)/i, "")
      .replace(/^Meta-Llama/, "Llama")
      .replace(/^Llama-/, "Llama ")
      .replace(/^DeepSeek-/, "DeepSeek ")
      .replace("gpt", "GPT")
      .replace("GPT-oss", "gpt-oss")
      .replace(/-(8|11|70|90|405)b/i, " $1b")
      .replace("-nano", " nano")
      .replace(/(?<=GPT.+)-mini/, " mini")
      .replace("-chat", " chat")
      .replace(/ \(Preview\)$/i, "")
      .replace(/[ -]Instruct$/, "")
      .replace(/(?<=3\.2.+)-Vision$/, "");
  const hiddenModels = [
    "Claude Sonnet 3.5",
    "Claude Sonnet 3.7",
    "Claude Sonnet 4",
    "o1",
    "o1-preview",
    "o1-mini",
    "o3",
    "o3-mini",
    "o4-mini",
  ];
  const updateGHM = async ({ token }: { token: string }) => {
    const models = (await ghmListRemote({
      key: token,
    })) as any[];
    const modelsFormatted = Object.fromEntries(
      models
        .filter((m) => m.supported_output_modalities.includes("text"))
        .map((m) => [m.name, m.id]),
    );
    ghmModels = modelsFormatted;
    cache[GHM_CACHE_KEY] = modelsFormatted;
  };
  const updateGHC = async ({ token }: { token: string }) => {
    const models = (await useDirectoryListRemote({
      provider: "GitHub Copilot",
      key: await getAccessToken(token),
    })) as any[];
    const modelsFormatted = Object.fromEntries(
      models
        .filter((m) => m.model_picker_enabled && !m.supported_endpoints)
        .map((m) => [m.name, m.id]),
    );
    ghcModels = modelsFormatted;
    cache[GHC_CACHE_KEY] = modelsFormatted;
  };
  if (config.providers?.ghm) updateGHM(config.providers.ghm);
  if (config.providers?.ghc) updateGHC(config.providers.ghc);

  let models = $derived.by(() => {
    const output: Record<string, Stack> = {};

    const addModels = (provider: Provider, modelList: Record<string, string>) => {
      for (let [name, model] of Object.entries(modelList)) {
        name = cleanName(name);
        if (hiddenModels.includes(name)) continue;
        output[name] ||= [];
        output[name].push({ provider, model });
      }
    };
    addModels("GitHub Models", ghmModels);
    addModels("GitHub Copilot", ghcModels);
    addModels("Cerebras via Cosine", cerebrasModels);
    addModels("Groq via Cosine", groqModels);
    addModels("Gemini via Cosine", geminiModels);

    return output;
  });
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
        model = newModel;
      }

      delayIfSmall(() => (choosingSince = undefined));
    }
  }}
/>
<button
  class="chooser"
  onpointerdown={() => (choosingSince = Date.now())}
  style:opacity={choosingSince ? 0 : undefined}
>
  <Layer />
  {model}
</button>
{#if choosingSince}
  <div class="popup" class:inverted transition:slide={{ duration: 500, easing: easeEmphasized }}>
    <ConnectedButtons>
      <input type="radio" id="sort-recommended" name="sort" value="recommended" bind:group={sort} />
      <Button variant="tonal" for="sort-recommended">Recommended</Button>
      <input type="radio" id="sort-speed" name="sort" value="speed" bind:group={sort} />
      <Button variant="tonal" for="sort-speed">Speed</Button>
      <input
        type="radio"
        id="sort-intelligence"
        name="sort"
        value="intelligence"
        bind:group={sort}
      />
      <Button variant="tonal" for="sort-intelligence">Intelligence</Button>
    </ConnectedButtons>
    {#each modelsExtended as { name, score }}
      <button
        class="model"
        data-model={name}
        style:background-color="color-mix(in oklab, rgb(var(--m3-scheme-secondary-container-subtle)) {score *
          100}%, rgb(var(--m3-scheme-surface-container-low)))"
        style:color="color-mix(in oklab, rgb(var(--m3-scheme-on-secondary-container-subtle)) {score *
          100}%, rgb(var(--m3-scheme-on-surface-variant)))"
      >
        <Layer />
        {name}
      </button>
    {/each}
  </div>
{/if}

<style>
  .chooser {
    display: flex;
    height: 3rem;
    padding-inline: 1rem;
    border-radius: var(--m3-util-rounding-full);
    align-items: center;

    color: rgb(var(--m3-scheme-outline));
    outline: solid 1px currentColor;
    outline-offset: -1px;

    position: relative;
  }
  .popup {
    display: flex;
    flex-direction: column;

    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 1;

    > * {
      border-radius: 0.5rem;
    }
    > .model {
      display: flex;
      align-items: center;
      height: 3rem;
      padding-inline: 0.5rem;

      overflow: hidden;
      position: relative;
    }

    &:not(.inverted) {
      > :first-child {
        border-start-start-radius: 1.5rem;
        border-start-end-radius: 1.5rem;
      }
      > :last-child {
        border-end-start-radius: 1.5rem;
        border-end-end-radius: 1.5rem;
      }
      > * {
        margin-top: 0.25rem;
      }
    }
    &.inverted {
      flex-direction: column-reverse;
      > :first-child {
        border-end-start-radius: 1.5rem;
        border-end-end-radius: 1.5rem;
      }
      > :last-child {
        border-start-start-radius: 1.5rem;
        border-start-end-radius: 1.5rem;
      }
      > * {
        margin-bottom: 0.25rem;
      }
    }
  }
</style>
