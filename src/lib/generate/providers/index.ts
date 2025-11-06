import type { ProviderFunction } from "./_base";
import { constructChatCompletions } from "./_chatcompletions";
import { constructResponses } from "./_responses";

export const ghcHeaders = {
  "editor-version": "vscode/0-insider",
  "x-github-api-version": "2025-05-01",
  "copilot-vision-request": "true",
};

const qwenNoThink = (body: { messages: any[] }) => {
  let systemMessage = body.messages.find((m) => m.role == "system");
  if (!systemMessage) {
    systemMessage = { role: "system", content: "" };
    body.messages.unshift(systemMessage);
  }
  systemMessage.content += `\n/no_think`;
  systemMessage.content = systemMessage.content.trimStart();
};
const ghcChatCompletions = constructChatCompletions(
  "https://api.githubcopilot.com",
  (_, headers) => {
    Object.assign(headers, ghcHeaders);
  },
);
const ghcResponses = constructResponses("https://api.githubcopilot.com", (_, headers) => {
  Object.assign(headers, ghcHeaders);
});
export const providers = {
  "Groq via Cosine": constructChatCompletions(
    "https://api.groq.com/openai/v1",
    (body, _, options) => {
      if (options.disableThinking) {
        qwenNoThink(body as any);
      }
    },
  ),
  "Cerebras via Cosine": constructChatCompletions(
    "https://api.cerebras.ai/v1",
    (body, _, options) => {
      if (options.disableThinking) {
        qwenNoThink(body as any);
      }
    },
  ),
  "Gemini via Cosine": constructChatCompletions(
    "https://generativelanguage.googleapis.com/v1beta/openai",
    (body, _, options) => {
      if (body.model.endsWith("lite")) {
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
  ),
  "OpenRouter Free via Cosine": constructChatCompletions(
    "https://openrouter.ai/api/v1",
    (body, _, options) => {
      if (options.reasoning) {
        body.reasoning = options.reasoning;
      }
    },
  ),
  "GitHub Copilot": ((messages, options, auth, fetcher) => {
    if (options.model.startsWith("gpt-5")) return ghcResponses(messages, options, auth, fetcher);
    return ghcChatCompletions(messages, options, auth, fetcher);
  }) satisfies ProviderFunction,
  "GitHub Models": constructChatCompletions("https://models.github.ai/inference", (body) => {
    if (body.model.startsWith("meta")) {
      body.max_tokens = 4000;
    }
  }),
};

export type Provider = keyof typeof providers;
