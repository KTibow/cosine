<script lang="ts">
  import { getStorage } from "monoidentity";
  import { Button, ConnectedButtons, easeEmphasized, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Options, Stack, StackItem } from "../types";
  import type { Provider } from "../generate/providers";
  import getAccessToken from "../generate/copilot/get-access-token";
  import { elos, ghcTPS, ghmTPS, k, orfTPS, processName, alwaysReasoners } from "./const";
  import { flip } from "svelte/animate";
  import listORF, { type ORFModel } from "./list-orf.remote";
  import listGHM, { type GHMModel } from "./list-ghm.remote";
  import listGHC, { type GHCModel } from "./list-ghc.remote";

  let {
    stack = $bindable(),
    inverted,
    minContext,
    useImageInput,
  }: {
    stack: Stack;
    inverted: boolean;
    minContext: number;
    useImageInput: boolean | undefined;
  } = $props();

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
  type Conn = StackItem & { name: string; specs: Specs };
  let conns = $derived.by(() => {
    let output: Conn[] = [];
    const addEntry = (
      provider: Provider,
      name: string,
      options: Options,
      context: number,
      speed: number,
      pricing: Pricing,
      vision: boolean,
    ) => {
      if (name != processName(name)) console.warn("Unprocessed name:", name);
      if (
        [
          "Claude Sonnet 3.5",
          "Claude Sonnet 4",
          "o1 Thinking",
          "o1 preview Thinking",
          "o1 mini Thinking",
          "o3 Thinking",
          "o3 mini Thinking",
          "o4 mini Thinking",
        ].includes(name)
      )
        return;
      if (context < minContext) return;
      if (useImageInput == true && !vision) return;
      if (useImageInput == false && vision && name.startsWith("Llama 3.2")) return;

      output.push({
        provider,
        name,
        options,
        specs: {
          speed: speed * (name.endsWith(" Thinking") ? 0.7 : 1),
          pricing,
        },
      });
    };
    const addCosineGroq = (
      name: string,
      model: string,
      speed: number,
      context: number,
      vision = false,
      disableThinking = false,
    ) =>
      addEntry("Groq via Cosine", name, { model, disableThinking }, context, speed, "free", vision);
    const addCosineCerebras = (
      name: string,
      model: string,
      speed: number,
      context: number,
      disableThinking = false,
    ) =>
      addEntry(
        "Cerebras via Cosine",
        name,
        { model, disableThinking },
        context,
        speed,
        "free",
        false,
      );
    const addCosineGemini = (
      name: string,
      model: string,
      speed: number,
      context: number,
      thinkingBudget?: number,
    ) =>
      addEntry("Gemini via Cosine", name, { model, thinkingBudget }, context, speed, "free", true);
    addCosineGroq("Llama 3.1 8b", "llama-3.1-8b-instant", 560, 6000);
    addCosineGroq("Llama 3.3 70b", "llama-3.3-70b-versatile", 280, 12000);
    addCosineGroq("gpt oss 20b Thinking", "openai/gpt-oss-20b", 1000, 8000);
    addCosineGroq("gpt oss 120b Thinking", "openai/gpt-oss-120b", 500, 8000);
    addCosineGroq("Llama 4 Scout", "meta-llama/llama-4-scout-17b-16e-instruct", 750, 30000, true);
    addCosineGroq(
      "Llama 4 Maverick",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      600,
      6000,
      true,
    );
    addCosineGroq("Kimi K2", "moonshotai/kimi-k2-instruct-0905", 300, 10000);
    addCosineGroq("Qwen3 32b Thinking", "qwen/qwen3-32b", 400, 6000);
    addCosineGroq("Qwen3 32b", "qwen/qwen3-32b", 400, 6000, false, true);
    // consult https://cloud.cerebras.ai/platform/[org]/models
    addCosineCerebras("Llama 3.1 8b", "llama3.1-8b", 2200, k(8));
    addCosineCerebras("Llama 3.3 70b", "llama-3.3-70b", 2100, 64000);
    addCosineCerebras("Llama 4 Scout", "llama-4-scout-17b-16e-instruct", 1600, k(8));
    addCosineCerebras("gpt oss 120b Thinking", "gpt-oss-120b", 1600, 64000);
    addCosineCerebras("Qwen3 32b Thinking", "qwen-3-32b", 1000, 64000);
    addCosineCerebras("Qwen3 32b", "qwen-3-32b", 1000, 64000, true);
    addCosineCerebras("Qwen3 235b 2507", "qwen-3-235b-a22b-instruct-2507", 600, 60000);
    addCosineCerebras("Qwen3 235b 2507 Thinking", "qwen-3-235b-a22b-thinking-2507", 800, 60000);
    addCosineGemini("Gemini 2.5 Pro Thinking", "models/gemini-2.5-pro", 100, k(1024));
    addCosineGemini("Gemini 2.5 Flash Thinking", "models/gemini-2.5-flash", 100, k(1024));
    addCosineGemini("Gemini 2.5 Flash", "models/gemini-2.5-flash", 100, k(1024), 0);
    addCosineGemini("Gemini 2.5 Flash Lite", "models/gemini-2.5-flash-lite", 200, k(1024));
    addCosineGemini(
      "Gemini 2.5 Flash Lite Thinking",
      "models/gemini-2.5-flash-lite",
      200,
      k(1024),
      k(24),
    );
    addCosineGemini("Gemini 2.0 Flash", "models/gemini-2.0-flash", 100, k(1024));

    for (const {
      name,
      id: model,
      context_length,
      architecture,
      supported_parameters,
    } of cosineORFModels) {
      let processedName = processName(name);
      if (supported_parameters?.includes("reasoning")) {
        processedName += " Thinking";
      }
      addEntry(
        "OpenRouter Free via Cosine",
        processedName,
        { model },
        context_length,
        orfTPS[processedName] || 40,
        "free",
        architecture.input_modalities.includes("image"),
      );
    }
    for (const { name, id: model, limits, capabilities, supported_input_modalities } of ghmModels) {
      let processedName = processName(name);
      if (
        (capabilities.includes("reasoning") && !model.endsWith("chat")) ||
        model == "xai/grok-3-mini"
      ) {
        processedName = processedName.replace(" reasoning", "");
        processedName += " Thinking";
      }
      let context = limits.max_input_tokens;
      if (context > 8000) {
        context = 8000;
      }
      if (
        [
          "DeepSeek R1 Thinking",
          "DeepSeek R1 0528 Thinking",
          "MAI DS R1 Thinking",
          "Grok 3",
          "Grok 3 Mini Thinking",
          "GPT 5 Thinking",
          "GPT 5 mini Thinking",
          "GPT 5 nano Thinking",
          "GPT 5 chat",
        ].includes(processedName) &&
        context > 4000
      ) {
        context = 4000;
      }
      let speed = ghmTPS[processedName];
      if (!speed) {
        speed = 50;
      }
      addEntry(
        "GitHub Models",
        processedName,
        { model },
        context,
        speed,
        "free",
        supported_input_modalities.includes("image"),
      );
    }
    for (const { name, id: model, billing, capabilities } of ghcModels) {
      let processedName = processName(name);
      if (alwaysReasoners.includes(processedName)) {
        processedName += " Thinking";
      }
      const pricing = billing.multiplier == 0 ? "free" : "paid";
      let context = capabilities.limits?.max_context_window_tokens;
      if (!context) {
        console.warn("No context for", name);
        context = 8000;
      }
      addEntry(
        "GitHub Copilot",
        processedName,
        { model },
        context,
        ghcTPS[processedName] || 100,
        pricing,
        capabilities.supports.vision,
      );
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
        console.debug("No elo for", name);
      }
      elo ||= 1200;
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
              ? normSpeed
              : normElo;
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

  const COSINE_ORF_CACHE_KEY = "OpenRouter Free via Cosine models";
  const GHM_CACHE_KEY = "GitHub Models models";
  const GHC_CACHE_KEY = "GitHub Copilot models";
  let cosineORFModels: ORFModel[] = $state(cache[COSINE_ORF_CACHE_KEY] || []);
  let ghmModels: GHMModel[] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: GHCModel[] = $state(cache[GHC_CACHE_KEY] || []);
  const updateCosineORF = async () => {
    const models = await listORF();
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
            "MiniMax",
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

        return { ...m, name };
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
    const models = await listGHC({ key: await getAccessToken(token) });
    const modelsFormatted = models.filter(
      (m) => m.model_picker_enabled && m.capabilities.type == "chat",
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
    {#each modelsDisplayed as { name, visualScore } (name)}
      {@const paid = modelStacks[name][0].specs.pricing == "paid"}
      {@const isThinking = name.endsWith(" Thinking")}
      {@const baseName = isThinking ? name.slice(0, -9) : name}
      <button
        class="model"
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
  .thinking-badge {
    opacity: 0.5;
    margin-left: 0.5ch;
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
