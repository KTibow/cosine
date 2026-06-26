import { constructChatCompletions } from './_chatcompletions';

const sendEffort = (body: any, effort?: string | null) => {
  if (effort) body.reasoning_effort = effort;
};

const orRestrict = ({ options }: { options: any }, { body }: { body: any }) => {
  sendEffort(body, options.reasoningEffort);
  if (options.providerRestriction) {
    body.provider = { order: [options.providerRestriction], allow_fallbacks: false };
  }
};

export const providers = {
  'Groq via Cosine': constructChatCompletions(
    'https://api.groq.com/openai/v1',
    ({ options }, { body }) => {
      sendEffort(body, options.reasoningEffort);
    },
  ),
  'Gemini via Cosine': constructChatCompletions(
    'https://generativelanguage.googleapis.com/v1beta/openai',
    ({ options }, { body }) => {
      const effort = options.reasoningEffort;
      if (!effort) return;
      const model = body.model as string;
      const is25 = model.includes('2.5');
      const config: Record<string, any> = { include_thoughts: true };
      if (is25) {
        const budgetMap: Record<string, number> = {
          minimal: 0,
          low: model.includes('lite') ? 512 : 128,
          high: model.includes('pro') ? 32768 : 24576,
        };
        config.thinking_budget = budgetMap[effort] ?? -1; // medium
      } else {
        config.thinking_level = effort;
      }
      body.extra_body = { google: { thinking_config: config } };
    },
    true,
  ),
  'OpenRouter Free via Cosine': constructChatCompletions(
    'https://openrouter.ai/api/v1',
    orRestrict,
  ),
  'Hack Club via Cosine': constructChatCompletions(
    'https://ai.hackclub.com/proxy/v1',
    ({ options }, { body }) => {
      orRestrict({ options }, { body });
      body.max_tokens = 8000;

      const lastUserMsg = (body.messages as any[]).filter((m) => m.role == 'user').at(-1);
      if (lastUserMsg) {
        let content = '';
        if (typeof lastUserMsg.content == 'string') {
          content = lastUserMsg.content;
        } else if (Array.isArray(lastUserMsg.content)) {
          content = lastUserMsg.content
            .filter((p: any) => p.type == 'text')
            .map((p: any) => p.text)
            .join('\n');
        }

        const ratioMatch = content.match(
          /\b(1:1|1:4|1:8|2:3|3:2|3:4|4:1|4:3|4:5|5:4|8:1|9:16|16:9|21:9)\b/,
        );
        if (ratioMatch) {
          body.image_config = { aspect_ratio: ratioMatch[1] };
        } else {
          if (/\bportrait\b/i.test(content)) {
            body.image_config = { aspect_ratio: '9:16' };
          } else if (/\blandscape\b/i.test(content)) {
            body.image_config = { aspect_ratio: '16:9' };
          } else if (/\bsquare\b/i.test(content)) {
            body.image_config = { aspect_ratio: '1:1' };
          }
        }
      }
    },
  ),
  'CrofAI via Cosine': constructChatCompletions('https://crof.ai/v2', ({ options }, { body }) => {
    sendEffort(body, options.reasoningEffort);
  }),
  'GitHub Models': constructChatCompletions(
    'https://models.github.ai/inference',
    ({ options }, { body }) => {
      sendEffort(body, options.reasoningEffort);
      if (body.model.startsWith('meta')) {
        body.max_tokens = 4000;
      }
    },
  ),
};

export type Provider = keyof typeof providers;
