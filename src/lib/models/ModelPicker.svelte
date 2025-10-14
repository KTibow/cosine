<script lang="ts">
  import { getStorage } from "monoidentity";
  import { Button, ConnectedButtons, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Stack } from "../types";
  import type { Provider } from "../generate/directory";
  import useDirectoryListRemote from "../generate/use-directory-list.remote";
  import getAccessToken from "../generate/copilot/get-access-token";
  import ghmListRemote from "../generate/ghm-list.remote";
  import { elos, ghcTPS, ghmTPS } from "./const";

  let { stack = $bindable(), inverted }: { stack: Stack; inverted: boolean } = $props();

  const cache = getStorage("cache");
  const config = getStorage("config");

  let choosingSince: number | undefined = $state();
  let sort: "recommended" | "speed" | "intelligence" = $state("recommended");
  let model = $state("Kimi K2");
  $effect(() => {
    stack = modelStacks[model];
  });

  type Pricing = "free" | "paid";
  type Conn = { pricing: Pricing; provider: Provider; name: string; model: string; speed: number };
  let conns = $derived.by(() => {
    let output: Conn[] = [];
    const processName = (name: string) =>
      (name = name
        .replace(/^OpenAI (?=o|gpt)/i, "")
        .replace(/^Meta-Llama/, "Llama")
        .replace(/^Llama-/, "Llama ")
        .replace(/^DeepSeek-/, "DeepSeek ")
        .replace("gpt", "GPT")
        .replace("GPT-oss", "gpt-oss")
        .replace(/[ -](8|11|17|32|70|90|405)b/i, " $1b")
        .replace("-nano", " nano")
        .replace(/(?<=GPT.+)-mini/, " mini")
        .replace("-chat", " chat")
        .replace(/ \(Preview\)$/i, "")
        .replace(/[ -]instruct$/i, "")
        .replace(/(?<=3\.2.+)-Vision$/, ""));
    const addEntry = (
      pricing: Pricing,
      provider: Provider,
      name: string,
      model: string,
      speed: number,
    ) => {
      name = processName(name);
      if (
        [
          "Claude Sonnet 3.5",
          "Claude Sonnet 3.7",
          "Claude Sonnet 4",
          "o1",
          "o1-preview",
          "o1-mini",
          "o3",
          "o3-mini",
          "o4-mini",
        ].includes(name)
      )
        return;

      output.push({ pricing, provider, name, model, speed });
    };
    const addCosineGroq = (name: string, model: string, speed: number) =>
      addEntry("free", "Groq via Cosine", name, model, speed);
    const addCosineCerebras = (name: string, model: string, speed: number) =>
      addEntry("free", "Cerebras via Cosine", name, model, speed);
    const addCosineGemini = (name: string, model: string, speed: number) =>
      addEntry("free", "Gemini via Cosine", name, model, speed);
    addCosineGroq("Llama 3.1 8b", "llama-3.1-8b-instant", 560);
    addCosineGroq("Llama 3.3 70b", "llama-3.3-70b-versatile", 280);
    addCosineGroq("gpt-oss-20b", "openai/gpt-oss-20b", 1000);
    addCosineGroq("gpt-oss-120b", "openai/gpt-oss-120b", 500);
    addCosineGroq("Llama 4 Scout 17b 16E", "meta-llama/llama-4-scout-17b-16e-instruct", 750);
    addCosineGroq(
      "Llama 4 Maverick 17b 128E",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      600,
    );
    addCosineGroq("Kimi K2", "moonshotai/kimi-k2-instruct-0905", 300);
    addCosineGroq("Qwen3 32b", "qwen/qwen3-32b", 400);
    addCosineCerebras("Llama 3.1 8b", "llama3.1-8b", 2200);
    addCosineCerebras("Llama 3.3 70b", "llama-3.3-70b", 2100);
    addCosineCerebras("gpt-oss-120b", "gpt-oss-120b", 3000);
    addCosineCerebras("Llama 4 Scout 17b 16E", "llama-4-scout-17b-16e-instruct", 2600);
    addCosineCerebras("Llama 4 Maverick 17b 128E", "llama-4-maverick-17b-128e-instruct", 2400);
    addCosineCerebras("Qwen3 32b", "qwen-3-32b", 1400);
    addCosineCerebras("Qwen3 235b 2507", "qwen-3-235b-a22b-instruct-2507", 1400);
    addCosineGemini("Gemini 2.5 Pro", "models/gemini-2.5-pro", 100);

    for (const [name, model] of ghmModels) {
      const processedName = processName(name);
      addEntry("free", "GitHub Models", name, model, ghmTPS[processedName] || 50);
    }
    for (const [name, model] of ghcModels) {
      const processedName = processName(name);
      addEntry(
        name == "GPT-5 mini" ? "free" : "paid",
        "GitHub Copilot",
        name,
        model,
        ghcTPS[processedName] || 100,
      );
    }

    return output;
  });
  let modelNames = $derived([...new Set(conns.map((c) => c.name))]);
  let modelStacks = $derived(
    Object.fromEntries(
      modelNames.map((name) => {
        const stack = conns.filter((c) => c.name == name);
        const stackPt1 = stack.filter((c) => c.pricing == "free");
        const stackPt2 = stack.filter((c) => c.pricing == "paid");
        stackPt1.sort((a, b) => b.speed - a.speed);
        stackPt2.sort((a, b) => b.speed - a.speed);
        return [name, [...stackPt1, ...stackPt2]];
      }),
    ),
  );
  let modelsDisplayed = $derived.by(() => {
    const modelEntries = modelNames.map((name) => {
      const stack = modelStacks[name];
      const speed = Math.log(stack[0].speed);
      let elo = elos[name];
      if (!elo) {
        console.warn("No elo for", name);
      }
      elo ||= 1200;
      return [name, { speed, elo }] as const;
    });
    const minElo = Math.min(...modelEntries.map(([, m]) => m.elo));
    const maxElo = Math.max(...modelEntries.map(([, m]) => m.elo));
    const eloRange = maxElo - minElo;
    const minSpeed = Math.min(...modelEntries.map(([, m]) => m.speed));
    const maxSpeed = Math.max(...modelEntries.map(([, m]) => m.speed));
    const speedRange = maxSpeed - minSpeed;
    let modelEntriesScored = modelEntries
      .map(([name, m]) => {
        const normElo = eloRange ? (m.elo - minElo) / eloRange : 0.5;
        const normSpeed = speedRange ? (m.speed - minSpeed) / speedRange : 0.5;
        const score =
          sort == "recommended"
            ? Math.log(0.6 * normElo + 0.4 * normSpeed)
            : sort == "speed"
              ? normSpeed
              : normElo;
        return { name, score };
      })
      .sort((a, b) => b.score - a.score);
    if (sort == "recommended") {
      modelEntriesScored = modelEntriesScored.slice(0, 8);
    } else {
      modelEntriesScored = modelEntriesScored.slice(0, 24);
    }
    const minScore = Math.min(...modelEntriesScored.map((m) => m.score));
    const maxScore = Math.max(...modelEntriesScored.map((m) => m.score));
    const scoreRange = maxScore - minScore;
    return modelEntriesScored.map((m) => ({
      ...m,
      score: scoreRange ? (m.score - minScore) / scoreRange : 0.5,
    }));
  });

  const GHM_CACHE_KEY = "GitHub Models models";
  const GHC_CACHE_KEY = "GitHub Copilot models";
  let ghmModels: [string, string][] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: [string, string][] = $state(cache[GHC_CACHE_KEY] || []);
  const updateGHM = async ({ token }: { token: string }) => {
    const models = (await ghmListRemote({
      key: token,
    })) as any[];
    const modelsFormatted = models
      .filter((m) => m.supported_output_modalities.includes("text"))
      .map((m) => [m.name, m.id] satisfies [string, string]);
    ghmModels = modelsFormatted;
    cache[GHM_CACHE_KEY] = modelsFormatted;
  };
  const updateGHC = async ({ token }: { token: string }) => {
    const models = (await useDirectoryListRemote({
      provider: "GitHub Copilot",
      key: await getAccessToken(token),
    })) as any[];
    const modelsFormatted = models
      .filter((m) => m.model_picker_enabled && !m.supported_endpoints)
      .map((m) => [m.name, m.id] satisfies [string, string]);
    ghcModels = modelsFormatted;
    cache[GHC_CACHE_KEY] = modelsFormatted;
  };
  if (config.providers?.ghm) updateGHM(config.providers.ghm);
  if (config.providers?.ghc) updateGHC(config.providers.ghc);
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
    {#each modelsDisplayed as { name, score }}
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
