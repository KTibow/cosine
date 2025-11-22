<script lang="ts">
  import { getStorage } from "monoidentity";
  import type { Options, Stack, StackItem } from "../types";
  import type { Provider } from "../generate/providers";
  import getAccessToken from "../generate/copilot/get-access-token";
  import {
    elos,
    ghcTPS,
    ghmTPS,
    k,
    orfTPS,
    processName,
    alwaysReasoners,
    crofReasonPatches,
    crofTPS,
    identifiablePrefixes,
    ORF_DEFAULT_TPS,
    CROF_DEFAULT_TPS,
    GHM_DEFAULT_TPS,
    GHC_DEFAULT_TPS,
  } from "./const";
  import listORF, { type ORFModel } from "./list-orf.remote";
  import listGHM, { type GHMModel } from "./list-ghm.remote";
  import listGHC, { type GHCModel } from "./list-ghc.remote";
  import listCrof, { type CrofModel } from "./list-crof.remote";
  import type { Snippet } from "svelte";

  type Pricing = "free" | "paid";
  type Specs = { speed: number; pricing: Pricing };
  type Conn = StackItem & { name: string; specs: Specs };

  type ChildrenProps = {
    model: string;
    modelsDisplayed: Array<{ name: string; visualScore: number; pricing: Pricing }>;
    sort: "recommended" | "speed" | "intelligence";
    thinking: "only" | "exclude" | undefined;
    setSort: (sort: "recommended" | "speed" | "intelligence") => void;
    setThinking: (thinking: "only" | "exclude" | undefined) => void;
    selectModel: (name: string) => void;
  };

  let {
    stack = $bindable(),
    model = $bindable(),
    minContext,
    useImageInput,
    eloWeight = 0.6,
    children,
  }: {
    stack: Stack;
    model: string;
    minContext: number;
    useImageInput: boolean | undefined;
    eloWeight?: number;
    children: Snippet<[ChildrenProps]>;
  } = $props();

  const cache = getStorage("cache");
  const config = getStorage("config");

  let sort: "recommended" | "speed" | "intelligence" = $state("recommended");
  let thinking: "only" | "exclude" | undefined = $state();

  const setSort = (newSort: "recommended" | "speed" | "intelligence") => {
    sort = newSort;
  };

  const setThinking = (newThinking: "only" | "exclude" | undefined) => {
    thinking = newThinking;
  };

  const selectModel = (name: string) => {
    model = name;
  };

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

  let connsRaw = $derived.by(() => {
    let output: Parameters<typeof addEntry>[] = [];
    const addEntry = (
      provider: Provider,
      name: string,
      options: Options,
      context: number,
      speed: number,
      pricing: Pricing,
      vision: boolean,
    ) => {
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

      output.push([provider, name, options, context, speed, pricing, vision]);
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
    addCosineCerebras("gpt oss 120b Thinking", "gpt-oss-120b", 1600, 64000);
    addCosineCerebras("Qwen3 32b Thinking", "qwen-3-32b", 1000, 64000);
    addCosineCerebras("Qwen3 32b", "qwen-3-32b", 1000, 64000, true);
    addCosineCerebras("Qwen3 235b 2507", "qwen-3-235b-a22b-instruct-2507", 600, 60000);
    addCosineCerebras("GLM 4.6 Thinking", "zai-glm-4.6", 800, k(128));
    // addCosineGemini("Gemini 3 Pro Thinking", "models/gemini-3-pro-preview", 100, k(1024));
    addCosineGemini("Gemini 2.5 Pro Thinking", "models/gemini-2.5-pro", 100, k(1024));
    addCosineGemini(
      "Gemini 2.5 Flash 2509 Thinking",
      "models/gemini-2.5-flash-preview-09-2025",
      100,
      k(1024),
    );
    addCosineGemini(
      "Gemini 2.5 Flash 2509",
      "models/gemini-2.5-flash-preview-09-2025",
      100,
      k(1024),
      0,
    );
    addCosineGemini(
      "Gemini 2.5 Flash Lite",
      "models/gemini-2.5-flash-lite-preview-09-2025",
      200,
      k(1024),
    );
    addCosineGemini(
      "Gemini 2.5 Flash Lite Thinking",
      "models/gemini-2.5-flash-lite-preview-09-2025",
      200,
      k(1024),
      k(24),
    );
    addCosineGemini("Gemini 2.0 Flash", "models/gemini-2.0-flash", 100, k(1024));

    for (const {
      name,
      id: model,
      reasoning,
      mandatory_reasoning,
      input_modalities,
      providers,
    } of cosineORFModels) {
      const context = providers.map((p) => p.context_length).reduce((a, b) => Math.max(a, b), 0);
      const add = (name: string, options: Options) =>
        addEntry(
          "OpenRouter Free via Cosine",
          name,
          options,
          context,
          orfTPS[name] || ORF_DEFAULT_TPS,
          "free",
          input_modalities.includes("image"),
        );
      if (reasoning) {
        let withThinking = processName(name) + " Thinking";
        withThinking = withThinking.replace("Thinking Thinking", "Thinking");
        add(withThinking, { model, reasoning: { enabled: true } });
        if (!mandatory_reasoning) {
          // TODO: once mandatory reasoning is fixed won't need this
          if (name.includes("3.1") || name.includes("GLM"))
            add(processName(name), { model, reasoning: { enabled: false } });
        }
      } else {
        add(processName(name), { model });
      }
    }
    for (const { name, id: model, context_length } of cosineCrofModels) {
      if (model == "kimi-k2-0905-turbo") {
        // bad quality
        continue;
      }
      const [authorName, _fixedName] = name.split(": ");
      let fixedName = _fixedName;
      if (!identifiablePrefixes.some((prefix) => fixedName.startsWith(prefix))) {
        fixedName = `${authorName} ${fixedName}`;
      }
      fixedName = fixedName
        .replace(" Free", "")
        .replace(/Kimi K2(?! 0905)(?! Thinking)/, "Kimi K2 0711")
        .replace("Kimi K2 0905", "Kimi K2");

      const add = (preprocessedName: string, name: string, options: Options) => {
        let speedName = preprocessedName;
        if (model.endsWith("-eco")) speedName += " Eco";
        if (model.endsWith("-turbo")) speedName += " Turbo";
        speedName = processName(speedName);

        let speed = crofTPS[speedName];
        if (!speed) {
          speed = CROF_DEFAULT_TPS;
        }

        addEntry("CrofAI via Cosine", name, options, context_length, speed, "free", false);
      };
      if (
        crofReasonPatches.includes(processName(fixedName)) ||
        alwaysReasoners.includes(processName(fixedName)) ||
        model.endsWith("-reasoner")
      ) {
        if (crofReasonPatches.includes(processName(fixedName))) {
          add(fixedName, processName(fixedName), { model, disableThinking: true });
        }
        fixedName += " Thinking";
      }
      add(fixedName, processName(fixedName), { model });
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
        speed = GHM_DEFAULT_TPS;
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
    for (const { name, id: model, billing, capabilities, supported_endpoints } of ghcModels) {
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
      let useResponses = supported_endpoints?.includes("/responses");
      addEntry(
        "GitHub Copilot",
        processedName,
        { model, useResponses },
        context,
        ghcTPS[processedName] || GHC_DEFAULT_TPS,
        pricing,
        capabilities.supports.vision,
      );
    }

    return output;
  });
  $effect(() => {
    const models = new Set<string>();
    for (const [_, name] of connsRaw) {
      models.add(name);
    }
    for (const name of models) {
      if (name != processName(name)) console.warn("Unprocessed name:", name);

      const elo = elos[name];
      if (!elo) {
        console.debug("No elo for", name);
      }
    }
  });
  let conns = $derived.by(() => {
    const output: Conn[] = [];
    for (const [provider, name, options, context, speed, pricing, vision] of connsRaw) {
      if (context < minContext) continue;
      if (useImageInput == true && !vision) continue;
      if (useImageInput == false && vision && name.startsWith("Llama 3.2")) continue;

      output.push({
        provider,
        name,
        options,
        specs: {
          speed: speed * (name.endsWith(" Thinking") ? 0.7 : 1),
          pricing,
        },
      });
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
        const pricing = stack[0].specs.pricing;
        return [name, { speed, elo, pricing }] as const;
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
            ? eloWeight * normElo + (1 - eloWeight) * normSpeed
            : sort == "speed"
              ? normSpeed + 0.00001 * normElo
              : normElo + 0.00001 * normSpeed;
        const visualScore = sort == "recommended" ? Math.log(score) : score;
        return { name, score, visualScore, pricing: m.pricing };
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
      pricing: m.pricing,
    }));
  });

  const COSINE_ORF_CACHE_KEY = "models/OpenRouter Free via Cosine";
  const COSINE_CROF_CACHE_KEY = "models/CrofAI via Cosine";
  const GHM_CACHE_KEY = "models/GitHub Models";
  const GHC_CACHE_KEY = "models/GitHub Copilot";
  let cosineORFModels: ORFModel[] = $state(cache[COSINE_ORF_CACHE_KEY] || []);
  let cosineCrofModels: CrofModel[] = $state(cache[COSINE_CROF_CACHE_KEY] || []);
  let ghmModels: GHMModel[] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: GHCModel[] = $state(cache[GHC_CACHE_KEY] || []);
  const updateCosineORF = async () => {
    const models = await listORF();
    const modelsFormatted = models.map((m) => {
      let name = m.name;
      name = name.split(" (free)")[0];
      if (
        !identifiablePrefixes.some((prefix) => name.startsWith(prefix)) &&
        m.author_name != "alibaba" &&
        m.author_name != "openrouter"
      ) {
        name = `${m.author_name} ${name}`;
      }

      return { ...m, name };
    });
    cosineORFModels = modelsFormatted;
    cache[COSINE_ORF_CACHE_KEY] = modelsFormatted;
  };
  const updateCosineCrof = async () => {
    const models = await listCrof();
    cosineCrofModels = models;
    cache[COSINE_CROF_CACHE_KEY] = models;
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
  updateCosineCrof();
  if (config.providers?.ghm) updateGHM(config.providers.ghm);
  if (config.providers?.ghc) updateGHC(config.providers.ghc);
</script>

{@render children({
  model,
  modelsDisplayed,
  sort,
  thinking,
  setSort,
  setThinking,
  selectModel,
})}
