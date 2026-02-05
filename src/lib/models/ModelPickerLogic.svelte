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
    orhcTPS,
    processName,
    alwaysReasoners,
    crofReasonPatches,
    crofTPS,
    identifiablePrefixes,
    DEFAULT_ELO,
    ORF_DEFAULT_TPS,
    ORHC_DEFAULT_TPS,
    CROF_DEFAULT_TPS,
    GHM_DEFAULT_TPS,
    GHC_DEFAULT_TPS,
    allReasoningEfforts,
    type ReasoningEffort,
    crofDisabledModels,
  } from "./const";
  import listORF, { type ORFModel } from "./list-orf.remote";
  import listGHM, { type GHMModel } from "./list-ghm.remote";
  import listGHC, { type GHCModel } from "./list-ghc.remote";
  import listCrof, { type CrofModel } from "./list-crof.remote";
  import listORHC, { type ORHCModel } from "./list-orhc.remote";
  import { getAbortSignal, type Snippet } from "svelte";

  type Specs = { speed: number; cost: number; groupName: string; effort?: string };
  type Conn = StackItem & { name: string; specs: Specs };

  type ChildrenProps = {
    model: string;
    modelsDisplayed: Array<{ name: string; visualScore: number; cost: number }>;
    eloWeight: number;
    thinking: "only" | "exclude" | undefined;
    setWeight: (w: number) => void;
    setThinking: (t: "only" | "exclude" | undefined) => void;
    selectModel: (name: string) => void;
    currentReasoningEffort: string | undefined;
    availableReasoningEfforts: string[] | undefined;
    setReasoningEffort: (effort: string) => void;
    selectedModelGroupName: string;
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

  let thinking: "only" | "exclude" | undefined = $state();

  const setWeight = (newWeight: number) => {
    eloWeight = newWeight;
  };

  const setThinking = (newThinking: "only" | "exclude" | undefined) => {
    thinking = newThinking;
  };

  const selectModel = (name: string) => {
    const prefix = name + "::";
    model = modelStacks[name]
      ? name
      : (modelNames.find((n) => n.startsWith(prefix) && n.includes("::medium")) ??
        modelNames.find((n) => n.startsWith(prefix)) ??
        name);
  };

  const setReasoningEffort = (effort: string) => {
    // Find the current group name
    const currentConn = conns.find((c) => c.name == model);
    if (!currentConn) return;
    const groupName = currentConn.specs.groupName;

    // Find the candidate with the target effort in the same group
    const candidate = conns.find((c) => c.specs.groupName == groupName && c.specs.effort == effort);
    if (candidate) {
      selectModel(candidate.name);
    }
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
      cost: number,
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

      output.push([provider, name, options, context, speed, cost, vision]);
    };
    // const addCosineAnt = (
    //   name: string,
    //   model: string,
    //   speed: number,
    //   context: number,
    //   thinkingBudget?: number,
    // ) => addEntry("Anthropic via Cosine", name, { model, thinkingBudget }, context, speed, 1, true);
    const addCosineGroq = (
      name: string,
      model: string,
      speed: number,
      context: number,
      vision = false,
      disableThinking = false,
    ) => addEntry("Groq via Cosine", name, { model, disableThinking }, context, speed, 0, vision);
    const addCosineCerebras = (
      name: string,
      model: string,
      speed: number,
      context: number,
      disableThinking = false,
    ) =>
      addEntry("Cerebras via Cosine", name, { model, disableThinking }, context, speed, 0, false);
    const addCosineGemini = (
      name: string,
      model: string,
      speed: number,
      context: number,
      thinkingBudget?: number,
    ) => addEntry("Gemini via Cosine", name, { model, thinkingBudget }, context, speed, 0, true);
    // addCosineAnt("Claude Haiku 3", "claude-3-haiku-20240307", 80, 200000);
    // addCosineAnt("Claude Haiku 3.5", "claude-3-5-haiku-20241022", 80, 200000);
    // addCosineAnt("Claude Haiku 4.5", "claude-haiku-4-5-20251001", 80, 200000);
    // addCosineAnt("Claude Haiku 4.5 Thinking", "claude-haiku-4-5-20251001", 80, 200000, 32000);
    // addCosineAnt("Claude Sonnet 4.5", "claude-sonnet-4-5-20250929", 80, 200000);
    // addCosineAnt("Claude Sonnet 4.5 Thinking", "claude-sonnet-4-5-20250929", 80, 200000, 32000);
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
    addCosineCerebras("GLM 4.7 Thinking", "zai-glm-4.7", 800, k(128));
    addCosineGemini(
      "Gemini 2.5 Flash 2509 Thinking",
      "models/gemini-2.5-flash-preview-09-2025",
      100,
      250000,
    );
    addCosineGemini(
      "Gemini 2.5 Flash 2509",
      "models/gemini-2.5-flash-preview-09-2025",
      100,
      250000,
      0,
    );
    addCosineGemini(
      "Gemini 2.5 Flash Lite 2509",
      "models/gemini-2.5-flash-lite-preview-09-2025",
      200,
      250000,
    );
    addCosineGemini(
      "Gemini 2.5 Flash Lite 2509 Thinking",
      "models/gemini-2.5-flash-lite-preview-09-2025",
      200,
      250000,
      k(24),
    );

    for (const { name, id: model, reasoning, input_modalities, providers } of cosineORFModels) {
      const context = providers.map((p) => p.context_length).reduce((a, b) => Math.max(a, b), 0);
      const add = (name: string, options: Options) =>
        addEntry(
          "OpenRouter Free via Cosine",
          name,
          options,
          context,
          orfTPS[name] || ORF_DEFAULT_TPS,
          0,
          input_modalities.includes("image"),
        );
      if (reasoning) {
        let withThinking = processName(name) + " Thinking";
        withThinking = withThinking.replace("Thinking Thinking", "Thinking");
        add(withThinking, { model, reasoning: { enabled: true } });
        // TODO: disable reasoning logic
        // add(processName(name), { model, reasoning: { enabled: false } });
      } else {
        add(processName(name), { model });
      }
    }
    for (const {
      name,
      id: model,
      context_length,
      architecture,
      supported_parameters,
    } of cosineORHCModels) {
      const add = (name: string, options: Options) =>
        addEntry(
          "Hack Club via Cosine",
          name,
          options,
          context_length,
          orhcTPS[name] || ORHC_DEFAULT_TPS,
          0,
          architecture.input_modalities.includes("image"),
        );
      const supportsReasoning = supported_parameters?.includes("reasoning");

      if (supportsReasoning) {
        let withThinking = processName(name) + " Thinking";
        withThinking = withThinking.replace("Thinking Thinking", "Thinking");
        add(withThinking, { model, reasoning: { enabled: true } });
      } else {
        add(processName(name), { model });
      }
    }
    for (const { name, id: model, context_length } of cosineCrofModels) {
      if (crofDisabledModels.includes(model)) continue;

      let fixedName = name;

      const add = (name: string, options: Options) => {
        let speed = crofTPS[model];
        if (!speed) {
          console.warn("No speed for", model);
          speed = CROF_DEFAULT_TPS;
        }

        addEntry("CrofAI via Cosine", name, options, context_length, speed, 0, false);
      };
      if (
        crofReasonPatches.includes(processName(fixedName)) ||
        alwaysReasoners.includes(processName(fixedName)) ||
        model.endsWith("-reasoner") ||
        model == "kimi-k2.5"
      ) {
        if (crofReasonPatches.includes(processName(fixedName))) {
          add(processName(fixedName), { model, disableThinking: true });
        }
        fixedName += " Thinking";
      }
      add(processName(fixedName), { model });
    }
    for (const {
      name,
      id: model,
      limits,
      capabilities,
      supported_input_modalities,
    } of ghmModels.filter((m) => m.supported_output_modalities.includes("text"))) {
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
        0,
        supported_input_modalities.includes("image"),
      );
    }
    for (const { name, id: model, billing, capabilities, supported_endpoints } of ghcModels.filter(
      (m) => m.model_picker_enabled && m.capabilities.type == "chat",
    )) {
      const processedName = processName(name);
      let context = capabilities.limits?.max_prompt_tokens;
      if (!context) {
        console.warn("No context for", name);
        context = 8000;
      }
      const cost = billing.multiplier;
      const useResponses = supported_endpoints?.includes("/responses");

      const add = (name: string, reasoningEffort?: ReasoningEffort) =>
        addEntry(
          "GitHub Copilot",
          name,
          { model, useResponses, reasoningEffort },
          context,
          ghcTPS[processedName] || GHC_DEFAULT_TPS,
          cost,
          capabilities.supports.vision,
        );
      const efforts = allReasoningEfforts[processedName];
      if (efforts) {
        for (const effort of efforts) {
          if (effort == "none") {
            add(processedName, effort);
          } else {
            add(`${processedName} Thinking::${effort}`, effort);
          }
        }
      } else {
        if (alwaysReasoners.includes(processedName)) {
          add(`${processedName} Thinking`);
        } else {
          add(processedName);
        }
      }
    }

    return output;
  });
  $effect(() => {
    const models = new Set<string>();
    for (const [_, name] of connsRaw) {
      models.add(name);
    }
    for (const name of models) {
      const [groupName] = name.split("::");

      if (groupName != processName(groupName))
        console.warn("Unprocessed name:", groupName, "(from", name, ")");

      const elo = elos[groupName];
      if (!elo) {
        console.debug("No elo for", groupName);
      }
    }
  });
  let conns = $derived.by(() => {
    const output: Conn[] = [];
    for (const [provider, name, options, context, speed, cost, vision] of connsRaw) {
      if (context < minContext) continue;
      if (useImageInput == true && !vision) continue;
      if (useImageInput == false && vision && name.startsWith("Llama 3.2")) continue;

      const [groupName, effort] = name.split("::");

      output.push({
        provider,
        name,
        options,
        specs: {
          speed: speed * (name.includes(" Thinking") ? 0.7 : 1),
          cost,
          groupName,
          effort,
        },
      });
    }
    return output;
  });
  let modelNames = $derived([...new Set(conns.map((c) => c.name))]);
  let modelGroups = $derived.by(() => {
    const groups: Record<string, Conn[]> = {};
    for (const conn of conns) {
      (groups[conn.specs.groupName] ||= []).push(conn);
    }
    return groups;
  });
  let modelStacks = $derived(
    Object.fromEntries(
      modelNames.map((name) => {
        const stack = conns.filter((c) => c.name == name);
        // Fused score: higher speed and lower cost = better
        // Speed is normalized logarithmically (base 10), cost applies a penalty
        const scoreProvider = (c: Conn) => {
          const speedScore = Math.log10(c.specs.speed);
          const costPenalty = c.specs.cost; // Each cost unit penalizes by 1 log10-speed point (10× slower)
          return speedScore - costPenalty;
        };
        stack.sort((a, b) => scoreProvider(b) - scoreProvider(a));
        return [name, stack];
      }),
    ),
  );
  let modelsDisplayed = $derived.by(() => {
    const groupNames = Object.keys(modelGroups);

    const modelEntries = groupNames
      .filter((name) => {
        if (thinking == "only") {
          return name.includes(" Thinking");
        }
        if (thinking == "exclude") {
          return !name.includes(" Thinking");
        }
        return true;
      })
      .map((groupName) => {
        // Find the best variant to represent the group
        // If the current model is in this group, use it. Otherwise use the first one.
        const variants = modelGroups[groupName] || [];
        const activeVariant = variants.find((v) => v.name == model) || variants[0];
        const stack = modelStacks[activeVariant.name];

        const speed = Math.log(stack[0].specs.speed);
        const elo = elos[groupName] || DEFAULT_ELO;
        const cost = stack[0].specs.cost;
        return [groupName, { speed, elo, cost }] as const;
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
        const score = eloWeight * normElo + (1 - eloWeight) * normSpeed;
        const visualScore = score;
        return { name, score, visualScore, cost: m.cost };
      })
      .sort((a, b) => b.score - a.score);

    const minScore = Math.min(...modelEntriesScored.map((m) => m.visualScore).filter((m) => m));
    const maxScore = Math.max(...modelEntriesScored.map((m) => m.visualScore).filter((m) => m));
    const scoreRange = maxScore - minScore;
    return modelEntriesScored.map((m) => ({
      name: m.name,
      visualScore: m.visualScore && scoreRange ? (m.visualScore - minScore) / scoreRange : 0,
      cost: m.cost,
    }));
  });

  let conn = $derived(conns.find((c) => c.name == model));
  let selectedModelGroupName = $derived(conn?.specs.groupName || model);
  let currentReasoningEffort = $derived(conn?.specs.effort);

  let availableReasoningEfforts = $derived.by(() => {
    if (!conn) return undefined;
    const groupName = conn.specs.groupName;
    const variants = modelGroups[groupName];
    if (!variants) return undefined;

    const order = ["minimal", "low", "medium", "high", "xhigh"];
    return Array.from(new Set(variants.map((v) => v.specs.effort).filter((e) => e))).sort(
      (a, b) => {
        const ia = order.indexOf(a!);
        const ib = order.indexOf(b!);
        if (ia != -1 && ib != -1) return ia - ib;
        if (ia != -1) return -1;
        if (ib != -1) return 1;
        return a!.localeCompare(b!);
      },
    ) as string[];
  });

  const COSINE_ORF_CACHE_KEY = "models/OpenRouter Free via Cosine";
  const COSINE_ORHC_CACHE_KEY = "models/Hack Club via Cosine";
  const COSINE_CROF_CACHE_KEY = "models/CrofAI via Cosine";
  const GHM_CACHE_KEY = "models/GitHub Models";
  const GHC_CACHE_KEY = "models/GitHub Copilot";
  let cosineORFModels: ORFModel[] = $state(cache[COSINE_ORF_CACHE_KEY] || []);
  let cosineORHCModels: ORHCModel[] = $state(cache[COSINE_ORHC_CACHE_KEY] || []);
  let cosineCrofModels: CrofModel[] = $state(cache[COSINE_CROF_CACHE_KEY] || []);
  let ghmModels: GHMModel[] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: GHCModel[] = $state(cache[GHC_CACHE_KEY] || []);
  const updateCosineORF = async () => {
    const models = await listORF();
    cosineORFModels = models;
    cache[COSINE_ORF_CACHE_KEY] = models;
  };
  const updateCosineORHC = async () => {
    const models = await listORHC();
    cosineORHCModels = models;
    cache[COSINE_ORHC_CACHE_KEY] = models;
  };
  const updateCosineCrof = async () => {
    const models = await listCrof();
    cosineCrofModels = models;
    cache[COSINE_CROF_CACHE_KEY] = models;
  };
  const updateGHM = async ({ token }: { token: string }, signal: AbortSignal) => {
    const models = await listGHM(
      {
        key: token,
      },
      { signal },
    );
    ghmModels = models;
    cache[GHM_CACHE_KEY] = models;
  };
  const updateGHC = async ({ token }: { token: string }, signal: AbortSignal) => {
    const models = await listGHC({ key: await getAccessToken(token) }, { signal });
    ghcModels = models;
    cache[GHC_CACHE_KEY] = models;
  };
  updateCosineORF();
  updateCosineORHC();
  updateCosineCrof();
  $effect(() => {
    const signal = getAbortSignal();
    if (config.providers?.ghm) updateGHM(config.providers.ghm, signal);
    if (config.providers?.ghc) updateGHC(config.providers.ghc, signal);
  });
</script>

{@render children({
  model,
  modelsDisplayed,
  eloWeight,
  thinking,
  setWeight,
  setThinking,
  selectModel,
  currentReasoningEffort,
  availableReasoningEfforts,
  setReasoningEffort,
  selectedModelGroupName,
})}
