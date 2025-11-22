import { getStorage } from "monoidentity";
import getAccessToken from "./generate/copilot/get-access-token";
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
} from "./models/const";
import listORF, { type ORFModel } from "./models/list-orf.remote";
import listGHM, { type GHMModel } from "./models/list-ghm.remote";
import listGHC, { type GHCModel } from "./models/list-ghc.remote";
import listCrof, { type CrofModel } from "./models/list-crof.remote";
import type { Stack, StackItem, Options } from "./types";
import type { Provider } from "./generate/providers";

type Pricing = "free" | "paid";
type Specs = { speed: number; pricing: Pricing };
type Conn = StackItem & { name: string; specs: Specs };

export function useModelPicker(minContext: number = 0, useImageInput: boolean = false) {
  const cache = getStorage("cache");
  const config = getStorage("config");

  const COSINE_ORF_CACHE_KEY = "models/OpenRouter Free via Cosine";
  const COSINE_CROF_CACHE_KEY = "models/CrofAI via Cosine";
  const GHM_CACHE_KEY = "models/GitHub Models";
  const GHC_CACHE_KEY = "models/GitHub Copilot";

  let cosineORFModels: ORFModel[] = $state(cache[COSINE_ORF_CACHE_KEY] || []);
  let cosineCrofModels: CrofModel[] = $state(cache[COSINE_CROF_CACHE_KEY] || []);
  let ghmModels: GHMModel[] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: GHCModel[] = $state(cache[GHC_CACHE_KEY] || []);
  let model = $state("Kimi K2");
  let stack: Stack = $state([]);

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
    addCosineCerebras("Llama 3.1 8b", "llama3.1-8b", 2200, k(8));
    addCosineCerebras("Llama 3.3 70b", "llama-3.3-70b", 2100, 64000);
    addCosineCerebras("gpt oss 120b Thinking", "gpt-oss-120b", 1600, 64000);
    addCosineCerebras("Qwen3 32b Thinking", "qwen-3-32b", 1000, 64000);
    addCosineCerebras("Qwen3 32b", "qwen-3-32b", 1000, 64000, true);
    addCosineCerebras("Qwen3 235b 2507", "qwen-3-235b-a22b-instruct-2507", 600, 60000);
    addCosineCerebras("GLM 4.6 Thinking", "zai-glm-4.6", 800, k(128));
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
      id: modelId,
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
          orfTPS[name] || 40,
          "free",
          input_modalities.includes("image"),
        );
      if (reasoning) {
        let withThinking = processName(name) + " Thinking";
        withThinking = withThinking.replace("Thinking Thinking", "Thinking");
        add(withThinking, { model: modelId, reasoning: { enabled: true } });
        if (!mandatory_reasoning) {
          if (name.includes("3.1") || name.includes("GLM"))
            add(processName(name), { model: modelId, reasoning: { enabled: false } });
        }
      } else {
        add(processName(name), { model: modelId });
      }
    }
    for (const { name, id: modelId, context_length } of cosineCrofModels) {
      if (modelId == "kimi-k2-0905-turbo") continue;
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
        if (modelId.endsWith("-eco")) speedName += " Eco";
        if (modelId.endsWith("-turbo")) speedName += " Turbo";
        speedName = processName(speedName);

        let speed = crofTPS[speedName];
        if (!speed) speed = 50;

        addEntry("CrofAI via Cosine", name, options, context_length, speed, "free", false);
      };
      if (
        crofReasonPatches.includes(processName(fixedName)) ||
        alwaysReasoners.includes(processName(fixedName)) ||
        modelId.endsWith("-reasoner")
      ) {
        if (crofReasonPatches.includes(processName(fixedName))) {
          add(fixedName, processName(fixedName), { model: modelId, disableThinking: true });
        }
        fixedName += " Thinking";
      }
      add(fixedName, processName(fixedName), { model: modelId });
    }
    for (const { name, id: modelId, limits, capabilities, supported_input_modalities } of ghmModels) {
      let processedName = processName(name);
      if (
        (capabilities.includes("reasoning") && !modelId.endsWith("chat")) ||
        modelId == "xai/grok-3-mini"
      ) {
        processedName = processedName.replace(" reasoning", "");
        processedName += " Thinking";
      }
      let context = limits.max_input_tokens;
      if (context > 8000) context = 8000;
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
      if (!speed) speed = 50;
      addEntry(
        "GitHub Models",
        processedName,
        { model: modelId },
        context,
        speed,
        "free",
        supported_input_modalities.includes("image"),
      );
    }
    for (const { name, id: modelId, billing, capabilities, supported_endpoints } of ghcModels) {
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
        { model: modelId, useResponses },
        context,
        ghcTPS[processedName] || 100,
        pricing,
        capabilities.supports.vision,
      );
    }

    return output;
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
        const stackItems = conns.filter((c) => c.name == name);
        const stackPt1 = stackItems.filter((c) => c.specs.pricing == "free");
        const stackPt2 = stackItems.filter((c) => c.specs.pricing == "paid");
        stackPt1.sort((a, b) => b.specs.speed - a.specs.speed);
        stackPt2.sort((a, b) => b.specs.speed - a.specs.speed);
        return [name, [...stackPt1, ...stackPt2]];
      }),
    ),
  );

  $effect(() => {
    let computedStack = modelStacks[model];
    if (!computedStack) {
      if (modelNames.length) {
        model = modelNames[0];
        computedStack = modelStacks[model];
      }
    }
    if (!computedStack) {
      console.warn("Model", model, "not found");
      return;
    }
    stack = computedStack;
  });

  // Fetch model lists
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
    const models = await listGHM({ key: token });
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

  return {
    get model() {
      return model;
    },
    set model(value: string) {
      model = value;
    },
    get stack() {
      return stack;
    },
    get modelNames() {
      return modelNames;
    },
    get modelStacks() {
      return modelStacks;
    },
    get elos() {
      return elos;
    },
  };
}
