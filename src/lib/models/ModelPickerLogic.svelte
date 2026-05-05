<script lang="ts">
  import { getStorage } from 'monoidentity';
  import type { Options, OptionsBase, Stack, StackItem } from '../types';
  import type { Provider } from '../generate/providers';
  import type { BrokieModels, BrokieProvider } from './types';
  import { type Snippet } from 'svelte';

  type Specs = { speed: number; cost: number; groupName: string; effort?: string };
  type Conn = StackItem & {
    name: string;
    context: number;
    vision: boolean;
    stackScore: number;
    specs: Specs;
  };

  const REASONING_EFFORT_ORDER = ['minimal', 'low', 'medium', 'high', 'xhigh'];
  const compareReasoningEfforts = (a: string, b: string) => {
    const ia = REASONING_EFFORT_ORDER.indexOf(a);
    const ib = REASONING_EFFORT_ORDER.indexOf(b);
    if (ia != -1 && ib != -1) return ia - ib;
    if (ia != -1) return -1;
    if (ib != -1) return 1;
    return a.localeCompare(b);
  };

  type ChildrenProps = {
    model: string;
    modelsDisplayed: Array<{ name: string; pareto: boolean; cost: number; elo: number }>;
    thinking: 'only' | 'exclude' | undefined;
    setThinking: (t: 'only' | 'exclude' | undefined) => void;
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
    children,
  }: {
    stack: Stack;
    model: string;
    minContext: number;
    useImageInput: boolean | undefined;
    children: Snippet<[ChildrenProps]>;
  } = $props();

  const cache = getStorage('cache');
  const config = getStorage('config');

  let thinking: 'only' | 'exclude' | undefined = $state();

  const BROKIE_URL =
    'https://raw.githubusercontent.com/trigonometry-app/brokierouter/refs/heads/main/models.json';
  const CACHE_KEY = 'models/brokierouter';
  const DEFAULT_ELO = 1200;
  const DEFAULT_TPS = 40;
  const DEFAULT_TTFB = 1000;
  const MAX_COMPLETION_COST_PER_MILLION = 20;
  const MAX_COMPLETION_COST_PER_TOKEN = MAX_COMPLETION_COST_PER_MILLION / 1_000_000;
  const DEBUG_SCORING = false;

  const exceedsCostLimit = (pricing?: BrokieProvider['pricing']) => {
    return (
      Number.isFinite(Number(pricing?.completion)) &&
      Number(pricing?.completion) > MAX_COMPLETION_COST_PER_TOKEN
    );
  };

  const resolveProvider = (
    brokieProvider: BrokieProvider,
  ): { provider: Provider; options: OptionsBase; cost: number } | null => {
    const { provider: providerId, model_id, cost_multiplier, extra } = brokieProvider;
    const useResponses = extra?.supported_endpoints?.includes('/responses');
    const [actualModelId, endpointTag] = model_id.split(';');

    if (providerId === 'openrouter-free') {
      return {
        provider: 'OpenRouter Free via Cosine',
        options: { model: actualModelId, providerRestriction: endpointTag },
        cost: 0,
      };
    }
    if (providerId === 'hack-club') {
      return {
        provider: 'Hack Club via Cosine',
        options: { model: actualModelId, providerRestriction: endpointTag },
        cost: 0,
      };
    }
    if (providerId === 'groq-free')
      return { provider: 'Groq via Cosine', options: { model: actualModelId }, cost: 0 };
    if (providerId === 'cerebras-free')
      return { provider: 'Cerebras via Cosine', options: { model: actualModelId }, cost: 0 };
    if (providerId === 'google-free')
      return { provider: 'Gemini via Cosine', options: { model: actualModelId }, cost: 0 };
    if (providerId === 'github-copilot') {
      if (!extra?.model_picker_enabled) return null;
      return {
        provider: 'GitHub Copilot',
        options: { model: actualModelId, useResponses },
        cost: cost_multiplier ?? 0,
      };
    }
    if (providerId === 'github-models')
      return { provider: 'GitHub Models', options: { model: actualModelId }, cost: 0 };
    if (providerId === 'crofai') {
      return { provider: 'CrofAI via Cosine', options: { model: actualModelId }, cost: 0 };
    }
    return null;
  };

  let brokieModels: BrokieModels = $state(cache[CACHE_KEY] || []);
  const updateModels = async () => {
    try {
      const r = await fetch(BROKIE_URL);
      if (!r.ok) throw new Error(`${r.status}`);
      const data: BrokieModels = await r.json();
      brokieModels = data;
      cache[CACHE_KEY] = data;
    } catch (e) {
      console.error('Failed to fetch models:', e);
    }
  };
  updateModels();

  // Round minContext to nearest 1k to avoid recalculating on small changes
  let minContextBucketed = $derived(Math.ceil(minContext / 1024) * 1024);

  // Single derived: one pass over brokieModels to build all indexes
  let index = $derived.by(() => {
    const connByName: Record<string, Conn> = {};
    const modelGroups: Record<string, Conn[]> = {};
    const modelStacks: Record<string, Conn[]> = {};
    const reasoningEffortsByGroup: Record<string, string[]> = {};
    const resolvedElo: Record<string, number> = {};
    const showExpensiveModels = config.showExpensiveModels ?? false;

    // Elo lookup from raw data
    const eloRaw: Record<string, { d?: number; t?: number }> = {};
    for (const m of brokieModels) eloRaw[m.name] = { d: m.elo_direct, t: m.elo_thinking };

    // Process all providers, filter inline
    const seenGroups = new Set<string>();
    for (const { name: modelName, providers } of brokieModels) {
      for (const bp of providers) {
        const resolved = resolveProvider(bp);
        if (!resolved) continue;

        const { provider, options, cost } = resolved;
        const context = bp.context_length;
        const tps = bp.tps ?? DEFAULT_TPS;
        const ttfb = bp.ttfb ?? DEFAULT_TTFB;
        const vision = bp.input_modalities.includes('image');

        if (provider === 'GitHub Copilot' && !config.providers?.ghc) continue;
        if (!bp.output_modalities.includes('text')) continue;
        if (!showExpensiveModels && exceedsCostLimit(bp.pricing)) continue;

        const efforts = bp.reasoning_efforts;
        const nonThinking = efforts.filter((e) => e == null || e === 'none' || e === 'minimal');
        const thinkingEfforts = efforts.filter((e) => e != null && e !== 'none' && e !== 'minimal');

        const make = (name: string, opts: Options, effort?: string): Conn => {
          const groupName = name.split('::')[0];
          const isThinking = groupName.endsWith(' Thinking');
          const timeFor100Tokens = ttfb / 1000 + (100 + (isThinking ? 50 : 0)) / tps;
          return {
            provider,
            name,
            options: opts,
            context,
            vision,
            stackScore: -Math.log10(timeFor100Tokens) - cost,
            specs: { speed: timeFor100Tokens, cost, groupName, effort },
          };
        };

        const addConn = (conn: Conn) => {
          if (conn.context < minContextBucketed) return;
          if (useImageInput == true && !conn.vision) return;
          if (useImageInput == false && conn.vision && conn.name.startsWith('Llama 3.2')) return;
          (modelStacks[conn.name] ||= []).push(conn);
        };

        if (nonThinking.length > 0) {
          addConn(make(modelName, { ...options, reasoningEffort: nonThinking[0] }, nonThinking[0]));
        }
        for (const effort of thinkingEfforts) {
          const variantName =
            thinkingEfforts.length === 1
              ? `${modelName} Thinking`
              : `${modelName} Thinking::${effort}`;
          addConn(make(variantName, { ...options, reasoningEffort: effort }, effort));
        }
      }
    }

    // Sort stacks, build secondary indexes, resolve elo — all in one loop
    for (const [name, conns] of Object.entries(modelStacks)) {
      conns.sort((a, b) => b.stackScore - a.stackScore);
      const top = conns[0];
      connByName[name] = top;
      (modelGroups[top.specs.groupName] ||= []).push(top);
      if (top.specs.effort) {
        (reasoningEffortsByGroup[top.specs.groupName] ||= []).push(top.specs.effort);
      }
      seenGroups.add(top.specs.groupName);
    }

    for (const g of Object.keys(reasoningEffortsByGroup)) {
      reasoningEffortsByGroup[g] = [...new Set(reasoningEffortsByGroup[g])].sort(
        compareReasoningEfforts,
      );
    }

    for (const groupName of seenGroups) {
      const isThinking = groupName.endsWith(' Thinking');
      const base = isThinking ? groupName.slice(0, -' Thinking'.length) : groupName;
      const { d, t } = eloRaw[base] ?? {};
      resolvedElo[groupName] = isThinking
        ? (t ?? d ?? DEFAULT_ELO)
        : (d ?? (t != null ? t - 20 : DEFAULT_ELO));
    }

    return { connByName, modelGroups, modelStacks, reasoningEffortsByGroup, resolvedElo };
  });

  let connByName = $derived(index.connByName);
  let modelGroups = $derived(index.modelGroups);
  let modelStacks = $derived(index.modelStacks);
  let reasoningEffortsByGroup = $derived(index.reasoningEffortsByGroup);

  const selectModel = (name: string) => {
    if (modelStacks[name]) {
      model = name;
      return;
    }
    const variants = modelGroups[name];
    if (variants?.length) {
      model = variants.find((v) => v.specs.effort == 'medium')?.name ?? variants[0].name;
      return;
    }
    model = name;
  };

  const setReasoningEffort = (effort: string) => {
    const currentConn = connByName[model];
    if (!currentConn) return;
    const candidate = modelGroups[currentConn.specs.groupName]?.find(
      (c) => c.specs.effort == effort,
    );
    if (candidate) selectModel(candidate.name);
  };

  const setThinking = (newThinking: 'only' | 'exclude' | undefined) => {
    thinking = newThinking;
  };

  let modelsDisplayed = $derived.by(() => {
    const { modelGroups, modelStacks, resolvedElo } = index;

    const entries = Object.keys(modelGroups)
      .filter((name) => {
        if (thinking == 'only') return name.includes(' Thinking');
        if (thinking == 'exclude') return !name.includes(' Thinking');
        return true;
      })
      .map((groupName) => {
        const variant = (modelGroups[groupName] || [])[0];
        const stack = modelStacks[variant?.name];
        if (!stack?.length) return null;
        return {
          name: groupName,
          elo: resolvedElo[groupName] ?? DEFAULT_ELO,
          speed: stack[0].specs.speed,
          cost: stack[0].specs.cost,
        };
      })
      .filter(Boolean) as { name: string; elo: number; speed: number; cost: number }[];

    // O(n log n) Pareto: sort by elo desc, sweep for min speed (lower = faster)
    entries.sort((a, b) => b.elo - a.elo || a.speed - b.speed);
    const paretoSet = new Set<string>();
    let minSpeedAbove = Infinity;
    for (let i = 0; i < entries.length; ) {
      const groupElo = entries[i].elo;
      const groupMinSpeed = entries[i].speed;
      if (groupMinSpeed < minSpeedAbove) {
        let j = i;
        while (
          j < entries.length &&
          entries[j].elo === groupElo &&
          entries[j].speed === groupMinSpeed
        ) {
          paretoSet.add(entries[j].name);
          j++;
        }
      }
      // Advance past entire elo group
      let j = i;
      while (j < entries.length && entries[j].elo === groupElo) j++;
      minSpeedAbove = Math.min(minSpeedAbove, groupMinSpeed);
      i = j;
    }

    if (DEBUG_SCORING) {
      console.table(
        entries
          .filter((e) => paretoSet.has(e.name))
          .map((e) => ({ name: e.name, elo: e.elo, speed: +e.speed.toFixed(3), cost: e.cost })),
      );
    }

    return entries.map((e) => ({
      name: e.name,
      pareto: paretoSet.has(e.name),
      cost: e.cost,
      elo: e.elo,
    }));
  });

  $effect(() => {
    let computedStack = modelStacks[model];
    if (!computedStack) {
      if (modelsDisplayed.length) {
        selectModel(modelsDisplayed[0].name);
        computedStack = modelStacks[model];
      }
    }
    if (!computedStack) {
      console.warn('Model', model, 'not found');
      return;
    }
    stack = computedStack;
  });

  let conn = $derived(connByName[model]);
  let selectedModelGroupName = $derived(conn?.specs.groupName || model);
  let currentReasoningEffort = $derived(conn?.specs.effort);
  let availableReasoningEfforts = $derived(
    conn ? reasoningEffortsByGroup[conn.specs.groupName] : undefined,
  );
</script>

{@render children({
  model,
  modelsDisplayed,
  thinking,
  setThinking,
  selectModel,
  currentReasoningEffort,
  availableReasoningEfforts,
  setReasoningEffort,
  selectedModelGroupName,
})}
