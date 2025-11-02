import type { ProviderFunction } from "./_base";
import { constructChatCompletions } from "./_chatcompletions";
import { constructResponses } from "./_responses";

export const ghcHeaders = {
  "editor-version": "vscode/0-insider",
  "x-github-api-version": "2025-05-01",
  "copilot-vision-request": "true",
};
const ghcChatCompletions = constructChatCompletions("https://api.githubcopilot.com", (req) => {
  Object.assign(req.headers, ghcHeaders);
});
const ghcResponses = constructResponses("https://api.githubcopilot.com", (req) => {
  Object.assign(req.headers, ghcHeaders);
});
export const providers = {
  "Cerebras via Cosine": constructChatCompletions("https://api.cerebras.ai/v1"),
  "Groq via Cosine": constructChatCompletions("https://api.groq.com/openai/v1"),
  "Gemini via Cosine": constructChatCompletions(
    "https://generativelanguage.googleapis.com/v1beta/openai",
  ),
  "OpenRouter Free via Cosine": constructChatCompletions("https://openrouter.ai/api/v1"),
  "GitHub Copilot": ((messages, model, auth, fetcher) => {
    if (model.startsWith("gpt-5")) return ghcResponses(messages, model, auth, fetcher);
    return ghcChatCompletions(messages, model, auth, fetcher);
  }) satisfies ProviderFunction,
  "GitHub Models": constructChatCompletions("https://models.github.ai/inference", (req) => {
    const body = JSON.parse(req.body);

    if (body.model.startsWith("meta")) {
      body.max_tokens = 4000;
    }

    req.body = JSON.stringify(body);
  }),
};

export type Provider = keyof typeof providers;
