import type { Provider } from '/lib/generate/providers';

export type ToolName = 'web_search' | 'code_interpreter';

export const toolLabels: Record<ToolName, string> = {
  web_search: 'Search',
  code_interpreter: 'Calculator',
};

// Every tool here is run by the provider itself: we name it in the request, the
// provider searches or executes inline, and the finished answer streams back.
// Nothing is ever dispatched from our side, so there's no agentic loop to drive.
//
// Providers mapping to nothing have no built-in tools to reach from here.
const nativeTools: Record<Provider, (model: string) => Partial<Record<ToolName, object>>> = {
  // Only the gpt-oss models are trained on Groq's built-ins; the rest 400.
  'Groq via Cosine': (model) =>
    model.includes('gpt-oss')
      ? { web_search: { type: 'browser_search' }, code_interpreter: { type: 'code_interpreter' } }
      : {},
  // Gemini does have search grounding, but not through this endpoint: its
  // OpenAI-compat layer 400s every built-in tool type, and `extra_body.google`
  // takes `thinking_config` and little else — no grounding field of any spelling.
  // Reaching it would mean a second provider speaking native generateContent.
  'Gemini via Cosine': () => ({}),
  'OpenRouter Free via Cosine': () => ({ web_search: { type: 'openrouter:web_search' } }),
  'Hack Club via Cosine': () => ({ web_search: { type: 'openrouter:web_search' } }),
  // Accepts `web_search` and answers it when unstreamed, but with stream: true
  // it returns a single empty chunk, so it's not usable here.
  'CrofAI via Cosine': () => ({}),
};

export const toolsFor = (provider: Provider, model: string) =>
  Object.keys(nativeTools[provider]?.(model) || {}) as ToolName[];

export const toolSpecsFor = (provider: Provider, model: string, enabled: ToolName[]) => {
  const available = nativeTools[provider]?.(model) || {};
  return enabled.map((name) => available[name]).filter((spec) => spec != undefined);
};
