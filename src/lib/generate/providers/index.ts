import { constructAnthropic } from './_anthropic';
import type { ProviderFunction } from './_base';
import { constructChatCompletions } from './_chatcompletions';
import { constructResponses } from './_responses';

export const ghcHeaders = {
  'editor-version': 'vscode/0-insider',
  'x-github-api-version': '2025-05-01',
  'copilot-vision-request': 'true',
};

const chineseNoThink = (body: { messages: any[] }) => {
  let systemMessage = body.messages.find((m) => m.role == 'system');
  if (!systemMessage) {
    systemMessage = { role: 'system', content: '' };
    body.messages.unshift(systemMessage);
  }
  systemMessage.content += `\n/no_think`;
  systemMessage.content = systemMessage.content.trimStart();
};
const ghcChatCompletions = constructChatCompletions(
  'https://api.githubcopilot.com',
  ({ options }, { headers }) => {
    Object.assign(headers, ghcHeaders);
    headers['x-initiator'] = options.initiator;
  },
  true,
);
const ghcResponses = constructResponses(
  'https://api.githubcopilot.com',
  ({ options }, { headers }) => {
    Object.assign(headers, ghcHeaders);
    headers['x-initiator'] = options.initiator;
  },
  true,
);
export const providers = {
  'Anthropic via Cosine': constructAnthropic(),
  'Groq via Cosine': constructChatCompletions(
    'https://api.groq.com/openai/v1',
    ({ options }, { body }) => {
      if (options.disableThinking) {
        chineseNoThink(body as any);
      }
    },
  ),
  'Cerebras via Cosine': constructChatCompletions(
    'https://api.cerebras.ai/v1',
    ({ options }, { body }) => {
      if (options.disableThinking) {
        chineseNoThink(body as any);
      }
    },
  ),
  'Gemini via Cosine': constructChatCompletions(
    'https://generativelanguage.googleapis.com/v1beta/openai',
    ({ options }, { body }) => {
      if (body.model.endsWith('lite')) {
        body.max_tokens = 65536;
      }
      body.extra_body = {
        google: {
          thinking_config: {
            include_thoughts: true,
            thinking_budget: options.thinkingBudget,
          },
        },
      };
    },
    true,
  ),
  'OpenRouter Free via Cosine': constructChatCompletions(
    'https://openrouter.ai/api/v1',
    ({ options }, { body }) => {
      if (options.reasoning) {
        body.reasoning = options.reasoning;
      }
    },
  ),
  'Hack Club via Cosine': constructChatCompletions(
    'https://ai.hackclub.com/proxy/v1',
    ({ options }, { body }) => {
      if (options.reasoning) {
        body.reasoning = options.reasoning;
      }

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

        const ratioMatch = content.match(/\b(\d+:\d+)\b/);
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
  'CrofAI via Cosine': constructChatCompletions(
    'https://ai.nahcrof.com/v2',
    ({ options }, { body }) => {
      if (options.disableThinking) {
        chineseNoThink(body as any);
      }
    },
  ),
  'GitHub Copilot': ((messages, options, auth, fetcher) => {
    if (options.useResponses) return ghcResponses(messages, options, auth, fetcher);
    return ghcChatCompletions(messages, options, auth, fetcher);
  }) satisfies ProviderFunction,
  'GitHub Models': constructChatCompletions('https://models.github.ai/inference', (_, { body }) => {
    if (body.model.startsWith('meta')) {
      body.max_tokens = 4000;
    }
  }),
};

export type Provider = keyof typeof providers;
