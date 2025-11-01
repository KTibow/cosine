import * as env from "$env/static/private";
import { fn } from "monoserve";
import { object, string, record } from "valibot";

const bodySchema = object({
  url: string(),
  headers: record(string(), string()),
  body: string(),
});

const allowlist: Record<string, { systemKey?: string }> = {
  "https://api.cerebras.ai/v1/chat/completions": { systemKey: "CEREBRAS_KEY" },
  "https://api.groq.com/openai/v1/chat/completions": { systemKey: "GROQ_KEY" },
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions": {
    systemKey: "GEMINI_KEY",
  },
  "https://openrouter.ai/api/v1/chat/completions": { systemKey: "OPENROUTER_FREE_KEY" },
  "https://api.githubcopilot.com/chat/completions": {}, // User-provided key
  "https://models.github.ai/inference/chat/completions": {}, // User-provided key
};

export default fn(bodySchema, async ({ url, headers = {}, body }) => {
  const config = allowlist[url];
  if (!config) {
    throw new Response(`${url} isn't allowed`, { status: 403 });
  }

  const authHeader = headers["authorization"];
  if (authHeader == "Bearer SERVER_KEY") {
    if (!config.systemKey) {
      throw new Response(`No system key configured for ${url}`, { status: 500 });
    }

    const envKey = (env as Record<string, string>)[config.systemKey];
    if (!envKey) {
      throw new Response(`Environment variable ${config.systemKey} not set`, { status: 500 });
    }

    headers["authorization"] = `Bearer ${envKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  const contentType = response.headers.get("content-type");

  return new Response(response.body, {
    status: response.status,
    headers: contentType ? { "content-type": contentType } : {},
  });
});
