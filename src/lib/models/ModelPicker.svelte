<script lang="ts">
  import { getStorage } from "monoidentity";
  import { Button, ConnectedButtons, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Stack } from "../types";
  import type { Provider } from "../generate/directory";
  import getAccessToken from "../generate/copilot/get-access-token";
  import listWithDirectory from "../generate/list-with-directory.remote";
  import listGHM from "../generate/list-ghm.remote";
  import { elos, ghcTPS, ghmTPS, k, orfTPS } from "./const";
  import { flip } from "svelte/animate";

  let {
    stack = $bindable(),
    inverted,
    minContext,
  }: { stack: Stack; inverted: boolean; minContext: number } = $props();

  const cache = getStorage("cache");
  const config = getStorage("config");

  let choosingSince: number | undefined = $state();
  let sort: "recommended" | "speed" | "intelligence" = $state("recommended");
  let model = $state("Kimi K2");
  $effect(() => {
    let computedStack = modelStacks[model];
    if (!computedStack) {
      if (modelsDisplayed.length) {
        model = modelsDisplayed[0].name;
        computedStack = modelStacks[model];
      }
    }
    if (!computedStack) {
      console.warn("Model", model, "not found");
      return;
    }
    stack = computedStack;
  });

  type Pricing = "free" | "paid";
  type Specs = { speed: number; pricing: Pricing };
  type Conn = { provider: Provider; name: string; model: string; specs: Specs };
  const processName = (name: string) =>
    (name = name
      .replace(/^OpenAI (?=o|gpt)/i, "")
      .replace(/^Meta-Llama/, "Llama")
      .replace(/^Llama-/, "Llama ")
      .replace(/^DeepSeek-/, "DeepSeek ")
      .replace("gpt", "GPT")
      .replace("GPT-oss", "gpt-oss")
      .replace(/\bV([0-9])/, "v$1")
      .replace(/[ -](1|3|4|8|11|12|14|17|22|27|30|32|70|90|235|405)b/i, " $1b")
      .replace(/(?<=A)(3|22)b/i, "$1b")
      .replace(/3n ([0-9]+)b/i, "3n E$1b")
      .replace("-nano", " nano")
      .replace(/(?<=GPT.+)-mini/, " mini")
      .replace("-chat", " chat")
      .replace(/ ([0-9]{4})\b/, "-$1")
      .replace(/(?<=Mistral Small.+) 24b/i, "")
      .replace(/[ -]instruct$/i, "")
      .replace(/ 17b 128e instruct fp8$/i, "")
      .replace(/ 17b 128e$/i, "")
      .replace(/ 17b 16e instruct$/i, "")
      .replace(/ 17b 16e$/i, "")
      .replace(/ \(preview\)$/i, "")
      .replace(/(?<=3\.2.+)-Vision$/, ""));
  for (const obj of [elos, orfTPS, ghmTPS, ghcTPS]) {
    for (const key of Object.keys(obj)) {
      const processed = processName(key);
      if (processed !== key) {
        console.warn(key, "is unprocessed!");
      }
    }
  }
  let conns = $derived.by(() => {
    let output: Conn[] = [];
    const addEntry = (
      provider: Provider,
      name: string,
      model: string,
      context: number,
      speed: number,
      pricing: Pricing,
    ) => {
      name = processName(name);
      if (
        [
          "Claude Sonnet 3.5",
          "Claude Sonnet 3.7",
          "Claude Sonnet 3.7 Thinking",
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
      if (context < minContext) return;

      output.push({
        provider,
        name,
        model,
        specs: {
          speed,
          pricing,
        },
      });
    };
    const addCosineGroq = (name: string, model: string, speed: number, context: number) =>
      addEntry("Groq via Cosine", name, model, context, speed, "free");
    const addCosineCerebras = (name: string, model: string, speed: number, context: number) =>
      addEntry("Cerebras via Cosine", name, model, context, speed, "free");
    const addCosineGemini = (name: string, model: string, speed: number, context: number) =>
      addEntry("Gemini via Cosine", name, model, context, speed, "free");
    addCosineGroq("Llama 3.1 8b", "llama-3.1-8b-instant", 560, 6000);
    addCosineGroq("Llama 3.3 70b", "llama-3.3-70b-versatile", 280, 12000);
    addCosineGroq("gpt-oss-20b", "openai/gpt-oss-20b", 1000, 8000);
    addCosineGroq("gpt-oss-120b", "openai/gpt-oss-120b", 500, 8000);
    addCosineGroq("Llama 4 Scout", "meta-llama/llama-4-scout-17b-16e-instruct", 750, 30000);
    addCosineGroq("Llama 4 Maverick", "meta-llama/llama-4-maverick-17b-128e-instruct", 600, 6000);
    addCosineGroq("Kimi K2", "moonshotai/kimi-k2-instruct-0905", 300, 10000);
    addCosineGroq("Qwen3 32b", "qwen/qwen3-32b", 400, 6000);
    // consult https://cloud.cerebras.ai/platform/[org]/models
    addCosineCerebras("Llama 3.1 8b", "llama3.1-8b", 2200, k(8));
    addCosineCerebras("Llama 3.3 70b", "llama-3.3-70b", 2100, 64000);
    addCosineCerebras("Llama 4 Scout", "llama-4-scout-17b-16e-instruct", 800, k(8));
    addCosineCerebras("gpt-oss-120b", "gpt-oss-120b", 800, 64000);
    addCosineCerebras("Qwen3 32b", "qwen-3-32b", 600, 64000);
    addCosineCerebras("Qwen3 235b-2507", "qwen-3-235b-a22b-instruct-2507", 600, 60000);
    addCosineCerebras("Qwen3 235b-2507 Thinking", "qwen-3-235b-a22b-thinking-2507", 800, 60000);
    addCosineGemini("Gemini 2.5 Pro", "models/gemini-2.5-pro", 100, k(1024));
    addCosineGemini("Gemini 2.0 Flash", "models/gemini-2.0-flash", 100, k(1024));

    for (const { name, id: model, context_length } of cosineORFModels) {
      const processedName = processName(name);
      addEntry(
        "OpenRouter Free via Cosine",
        name,
        model,
        context_length,
        orfTPS[processedName] || 40,
        "free",
      );
    }
    for (const { name, id: model, limits } of ghmModels) {
      const processedName = processName(name);
      let context = limits.max_input_tokens;
      if (context > 8000) {
        context = 8000;
      }
      if (
        [
          "DeepSeek R1",
          "DeepSeek R1-0528",
          "MAIS-DS-R1",
          "Grok 3",
          "Grok 3 Mini",
          "GPT-5",
          "GPT-5 mini",
          "GPT-5 nano",
          "GPT-5 chat",
        ].includes(processedName) &&
        context > 4000
      ) {
        context = 4000;
      }
      addEntry("GitHub Models", name, model, context, ghmTPS[processedName] || 50, "free");
    }
    for (const { name, id: model, billing, capabilities } of ghcModels) {
      const processedName = processName(name);
      const pricing = billing.multiplier == 0 ? "free" : "paid";
      let context = capabilities.limits?.max_context_window_tokens;
      if (!context) {
        console.warn("No context for", name);
        context = 8000;
      }
      addEntry("GitHub Copilot", name, model, context, ghcTPS[processedName] || 100, pricing);
    }

    return output;
  });
  let modelNames = $derived([...new Set(conns.map((c) => c.name))]);
  let modelStacks = $derived(
    Object.fromEntries(
      modelNames.map((name) => {
        const stack = conns.filter((c) => c.name == name);
        const stackPt1 = stack.filter((c) => c.specs.pricing == "free");
        const stackPt2 = stack.filter((c) => c.specs.pricing == "paid");
        stackPt1.sort((a, b) => b.specs.speed - a.specs.speed);
        stackPt2.sort((a, b) => b.specs.speed - a.specs.speed);
        return [name, [...stackPt1, ...stackPt2]];
      }),
    ),
  );
  let modelsDisplayed = $derived.by(() => {
    const modelEntries = modelNames.map((name) => {
      const stack = modelStacks[name];
      const speed = Math.log(stack[0].specs.speed);
      let elo = elos[name];
      if (!elo) {
        console.warn("No elo for", name);
      }
      elo ||= 1200;
      return [name, { speed, elo }] as const;
    });
    const minElo = 1200;
    const maxElo = Math.max(...Object.values(elos));
    const eloRange = maxElo - minElo;
    const minSpeed = Math.log(20);
    const maxSpeed = Math.log(3000);
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
    }
    const minScore = Math.min(...modelEntriesScored.map((m) => m.score));
    const maxScore = Math.max(...modelEntriesScored.map((m) => m.score));
    const scoreRange = maxScore - minScore;
    return modelEntriesScored.map((m) => ({
      name: m.name,
      score: scoreRange ? (m.score - minScore) / scoreRange : 0.5,
    }));
  });

  const COSINE_ORF_CACHE_KEY = "OpenRouter Free via Cosine models";
  const GHM_CACHE_KEY = "GitHub Models models";
  const GHC_CACHE_KEY = "GitHub Copilot models";
  let cosineORFModels: { name: string; id: string; context_length: number }[] = $state(
    cache[COSINE_ORF_CACHE_KEY] || [],
  );
  let ghmModels: { name: string; id: string; limits: { max_input_tokens: number } }[] = $state(
    cache[GHM_CACHE_KEY] || [],
  );
  let ghcModels: {
    name: string;
    id: string;
    capabilities: { limits: { max_context_window_tokens: number } };
    billing: { multiplier: number };
  }[] = $state(cache[GHC_CACHE_KEY] || []);
  const updateCosineORF = async () => {
    const models: any[] = await listWithDirectory({
      provider: "OpenRouter Free via Cosine",
    });
    const modelsFormatted = models
      .filter((m) => m.id.endsWith(":free"))
      .map((m) => {
        let name = m.name;
        name = name.split(" (free)")[0];

        const shortened = name.split(": ")[1];
        if (
          shortened &&
          [
            "DeepHermes",
            "DeepSeek",
            "Devstral",
            "Gemini",
            "Gemma",
            "GLM",
            "gpt",
            "Hunyuan",
            "Kimi",
            "Llama",
            "LongCat",
            "MAI",
            "Mistral",
            "Nemotron",
            "Qwen",
            "QwQ",
          ].some((prefix) => shortened.startsWith(prefix))
        ) {
          name = shortened;
        }
        name = name.replaceAll(":", "");
        name = name.trim();

        return {
          name,
          id: m.id,
          context_length: m.context_length,
        };
      });
    cosineORFModels = modelsFormatted;
    cache[COSINE_ORF_CACHE_KEY] = modelsFormatted;
  };
  const updateGHM = async ({ token }: { token: string }) => {
    const models = await listGHM({
      key: token,
    });
    const modelsFormatted = models.filter((m) => m.supported_output_modalities.includes("text"));
    ghmModels = modelsFormatted;
    cache[GHM_CACHE_KEY] = modelsFormatted;
  };
  const updateGHC = async ({ token }: { token: string }) => {
    const models: any[] = await listWithDirectory({
      provider: "GitHub Copilot",
      key: await getAccessToken(token),
    });
    const modelsFormatted = models.filter(
      (m) => m.model_picker_enabled && m.capabilities.type == "chat" && !m.supported_endpoints,
    );
    ghcModels = modelsFormatted;
    cache[GHC_CACHE_KEY] = modelsFormatted;
  };
  updateCosineORF();
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
    {#each modelsDisplayed as { name, score } (name)}
      {@const paid = modelStacks[name][0].specs.pricing == "paid"}
      <button
        class="model"
        data-model={name}
        style:background-color="color-mix(in oklab, rgb(var(--m3-scheme-secondary-container-subtle)) {score *
          100}%, rgb(var(--m3-scheme-surface-container-low)))"
        style:color="color-mix(in oklab, rgb(var(--m3-scheme-on-secondary-container-subtle)) {score *
          100}%, rgb(var(--m3-scheme-on-surface-variant)))"
        animate:flip={{ duration: 400, easing: easeEmphasized }}
      >
        <Layer />
        {name}
        {#if paid}
          <span class="badge">$</span>
        {/if}
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

      transition:
        background-color var(--m3-util-easing-slow),
        color var(--m3-util-easing-slow);
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
  .badge {
    display: flex;
    width: 1.5rem;
    height: 1.5rem;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }
</style>
