<script lang="ts">
  import ONav from "/lib/ONav.svelte";
  import ModelPickerButton from "/lib/models/ModelPickerButton.svelte";
  import ModelPickerList from "/lib/models/ModelPickerList.svelte";
  import type { Stack, StackItem, Options } from "/lib/types";
  import type { Provider } from "/lib/generate/providers";
  import { Icon } from "m3-svelte";
  import iconCode from "@ktibow/iconset-material-symbols/code-rounded";
  import iconArrowDropDown from "@ktibow/iconset-material-symbols/arrow-drop-down-rounded";
  import { getStorage } from "monoidentity";
  import getAccessToken from "/lib/generate/copilot/get-access-token";
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
  } from "/lib/models/const";
  import listORF, { type ORFModel } from "/lib/models/list-orf.remote";
  import listGHM, { type GHMModel } from "/lib/models/list-ghm.remote";
  import listGHC, { type GHCModel } from "/lib/models/list-ghc.remote";
  import listCrof, { type CrofModel } from "/lib/models/list-crof.remote";

  const cache = getStorage("cache");
  const config = getStorage("config");

  let stack: Stack = $state([]);
  let prompt = $state("");
  let showIframe = $state(true);
  let iframeSrc = $state("");
  let textareaContent = $state("");
  let thinkingStream = $state("");
  let choosingSince: number | undefined = $state();
  let model = $state("Kimi K2");

  // Model data setup (extracted from ModelPicker logic)
  type Pricing = "free" | "paid";
  type Specs = { speed: number; pricing: Pricing };
  type Conn = StackItem & { name: string; specs: Specs };

  const COSINE_ORF_CACHE_KEY = "models/OpenRouter Free via Cosine";
  const COSINE_CROF_CACHE_KEY = "models/CrofAI via Cosine";
  const GHM_CACHE_KEY = "models/GitHub Models";
  const GHC_CACHE_KEY = "models/GitHub Copilot";

  let cosineORFModels: ORFModel[] = $state(cache[COSINE_ORF_CACHE_KEY] || []);
  let cosineCrofModels: CrofModel[] = $state(cache[COSINE_CROF_CACHE_KEY] || []);
  let ghmModels: GHMModel[] = $state(cache[GHM_CACHE_KEY] || []);
  let ghcModels: GHCModel[] = $state(cache[GHC_CACHE_KEY] || []);

  // Build connection list (same logic as ModelPicker)
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
    addCosineGroq("Kimi K2", "moonshotai/kimi-k2-instruct-0905", 300, 10000);
    addCosineCerebras("Llama 3.1 8b", "llama3.1-8b", 2200, k(8));
    addCosineCerebras("Llama 3.3 70b", "llama-3.3-70b", 2100, 64000);
    addCosineGemini("Gemini 2.5 Flash 2509", "models/gemini-2.5-flash-preview-09-2025", 100, k(1024), 0);

    // Add other models from remote sources (simplified for brevity)
    for (const { name, id: model, reasoning, mandatory_reasoning, input_modalities, providers } of cosineORFModels) {
      const context = providers.map((p) => p.context_length).reduce((a, b) => Math.max(a, b), 0);
      const add = (name: string, options: Options) =>
        addEntry("OpenRouter Free via Cosine", name, options, context, orfTPS[name] || 40, "free", input_modalities.includes("image"));
      if (reasoning) {
        let withThinking = processName(name) + " Thinking";
        withThinking = withThinking.replace("Thinking Thinking", "Thinking");
        add(withThinking, { model, reasoning: { enabled: true } });
        if (!mandatory_reasoning) {
          if (name.includes("3.1") || name.includes("GLM"))
            add(processName(name), { model, reasoning: { enabled: false } });
        }
      } else {
        add(processName(name), { model });
      }
    }

    return output;
  });

  let conns = $derived.by(() => {
    const output: Conn[] = [];
    for (const [provider, name, options, context, speed, pricing, vision] of connsRaw) {
      if (context < 0) continue;
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
    if (!computedStack && modelNames.length) {
      model = modelNames[0];
      computedStack = modelStacks[model];
    }
    if (computedStack) {
      stack = computedStack;
    }
  });

  // Fetch model lists
  const updateCosineORF = async () => {
    const models = await listORF();
    const modelsFormatted = models.map((m) => {
      let name = m.name.split(" (free)")[0];
      if (!identifiablePrefixes.some((prefix) => name.startsWith(prefix)) && m.author_name != "alibaba" && m.author_name != "openrouter") {
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

  updateCosineORF();
  updateCosineCrof();
  if (config.providers?.ghm) {
    listGHM({ key: config.providers.ghm.token }).then(models => {
      ghmModels = models.filter((m) => m.supported_output_modalities.includes("text"));
      cache[GHM_CACHE_KEY] = ghmModels;
    });
  }
  if (config.providers?.ghc) {
    getAccessToken(config.providers.ghc.token).then(token =>
      listGHC({ key: token }).then(models => {
        ghcModels = models.filter((m) => m.model_picker_enabled && m.capabilities.type == "chat");
        cache[GHC_CACHE_KEY] = ghcModels;
      })
    );
  }

  const open = () => {
    choosingSince = Date.now();
  };

  const handleModelSelect = (selectedModel: string) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    model = selectedModel;
    delayIfSmall(() => (choosingSince = undefined));
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    console.log("Submitting prompt:", prompt, "with stack:", stack);
    thinkingStream = "Thinking about your request...";
    setTimeout(() => {
      thinkingStream = "";
    }, 2000);
    prompt = "";
  };

  const toggleView = () => {
    showIframe = !showIframe;
  };
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

<ONav />

<div class="code-container">
  <div class="main-content">
    <div class="view-toggle">
      <button onclick={toggleView} class="toggle-button">
        <Icon icon={iconCode} size={20} />
        {showIframe ? "Switch to Editor" : "Switch to Preview"}
      </button>
    </div>

    {#if showIframe}
      <iframe
        src={iframeSrc || "about:blank"}
        title="Code Preview"
        class="code-iframe"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    {:else}
      <textarea
        bind:value={textareaContent}
        class="code-textarea"
        placeholder="Enter your code here..."
      ></textarea>
    {/if}

    {#if thinkingStream}
      <div class="thinking-stream">
        <div class="thinking-tape">{thinkingStream}</div>
      </div>
    {/if}
  </div>

  <div class="prompt-bar">
    <input
      type="text"
      bind:value={prompt}
      placeholder="Ask about code or request changes..."
      class="prompt-input"
      onkeydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
    />
    <div class="split-button-group">
      <button class="send-button" onclick={handleSubmit} disabled={!prompt.trim()}>
        Send
      </button>
      <button class="model-selector-button" onpointerdown={open}>
        <Icon icon={iconArrowDropDown} size={20} />
      </button>
    </div>
  </div>
</div>

{#if choosingSince}
  <ModelPickerList
    bottomRight={true}
    {modelNames}
    {modelStacks}
    {elos}
    onModelSelect={handleModelSelect}
  />
{/if}

<style>
  .split-button-group {
    display: flex;
    height: 3rem;
    border-radius: var(--m3-util-rounding-full);
    overflow: hidden;
    background-color: rgb(var(--m3-scheme-primary));
  }

  .send-button {
    height: 3rem;
    padding-inline: 1.5rem;
    background-color: rgb(var(--m3-scheme-primary));
    color: rgb(var(--m3-scheme-on-primary));
    font-weight: 500;
    transition: opacity var(--m3-util-easing-fast);
    flex-grow: 1;

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }

  .model-selector-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background-color: rgb(var(--m3-scheme-primary));
    color: rgb(var(--m3-scheme-on-primary));
    border-left: 1px solid rgb(var(--m3-scheme-on-primary) / 0.2);
    transition: opacity var(--m3-util-easing-fast);

    &:hover {
      opacity: 0.9;
    }
  }

  .code-container {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    width: 100%;
    padding-left: 4rem;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .view-toggle {
    display: flex;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--m3-util-rounding-full);
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
    font-size: 0.875rem;
    transition: background-color var(--m3-util-easing-fast);

    &:hover {
      background-color: rgb(var(--m3-scheme-surface-container-high));
    }
  }

  .code-iframe {
    flex: 1;
    width: 100%;
    border: none;
    background-color: rgb(var(--m3-scheme-surface));
  }

  .code-textarea {
    flex: 1;
    width: 100%;
    border: none;
    padding: 1rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    background-color: rgb(var(--m3-scheme-surface));
    color: rgb(var(--m3-scheme-on-surface));
    resize: none;
    outline: none;

    &::placeholder {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
  }

  .thinking-stream {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 1rem;
    background-color: rgb(var(--m3-scheme-surface-container-high) / 0.95);
    border-top: 1px solid rgb(var(--m3-scheme-outline-variant));
  }

  .thinking-tape {
    color: rgb(var(--m3-scheme-on-surface-variant));
    font-size: 0.875rem;
    font-style: italic;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .prompt-bar {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    border-top: 1px solid rgb(var(--m3-scheme-outline-variant));
  }

  .prompt-input {
    flex: 1;
    height: 3rem;
    padding: 0 1rem;
    border: none;
    border-radius: var(--m3-util-rounding-full);
    background-color: rgb(var(--m3-scheme-surface-container-highest));
    color: rgb(var(--m3-scheme-on-surface));
    font-size: 1rem;
    outline: none;
    transition: background-color var(--m3-util-easing-fast);

    &:focus {
      background-color: rgb(var(--m3-scheme-surface-container));
    }

    &::placeholder {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
  }
</style>
