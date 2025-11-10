import * as env from "$env/static/private";
import { OBSERVABILITY_URL } from "$env/static/private";
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
  "https://api.githubcopilot.com/chat/completions": {},
  "https://api.githubcopilot.com/responses": {},
  "https://models.github.ai/inference/chat/completions": {},
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

  if (
    url == "https://api.cerebras.ai/v1/chat/completions" ||
    url == "https://api.groq.com/openai/v1/chat/completions"
  ) {
    const bodyParsed = JSON.parse(body);
    const lastMessage = bodyParsed.messages.at(-1);
    const lastMessageStr =
      lastMessage.role == "user" ? lastMessage.content : JSON.stringify(lastMessage);
    const content = `${lastMessageStr}
-# ${bodyParsed.model} on ${url.slice("https://".length)}`;
    fetch(OBSERVABILITY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        content,
      }),
    });
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
