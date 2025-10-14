import * as env from "$env/static/private";
import { fn } from "monoserve";
import { array, object, optional, picklist, string } from "valibot";
import { openAIMessage } from "/lib/types";
import directory from "./directory";

const provider = picklist(Object.keys(directory) as (keyof typeof directory)[]);
const bodySchema = object({
  provider,
  key: optional(string()),
  messages: array(openAIMessage),
  model: string(),
});

export default fn(bodySchema, async ({ provider, key, messages, model }) => {
  const providerInfo = directory[provider];
  if (providerInfo.key != "user") {
    key = (env as Record<string, string>)[providerInfo.key];
  }
  if (!key) throw new Error("No key provided");

  const headers: Record<string, string> = {};
  if ("headers" in providerInfo) {
    Object.assign(headers, providerInfo.headers);
  }
  headers.authorization = `Bearer ${key}`;
  headers["content-type"] = "application/json";
  const body: Record<string, any> = {
    messages,
    model,
    stream: true,
  };
  if (model.startsWith("meta/meta-llama")) {
    body.max_tokens = 8192;
  }
  const r = await fetch(`${providerInfo.base}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(`${provider} is ${r.status}ing: ${await r.text()}`);
  return new Response(r.body, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
});
