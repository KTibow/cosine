import * as env from "$env/static/private";
import { fn } from "monoserve";
import { object, optional, picklist, string } from "valibot";
import directory from "./directory";

const provider = picklist(Object.keys(directory) as (keyof typeof directory)[]);
const bodySchema = object({
  provider,
  key: optional(string()),
});

export default fn(bodySchema, async ({ provider, key }) => {
  const providerInfo = directory[provider];
  if (providerInfo.key != "user") {
    key = (env as Record<string, string>)[providerInfo.key];
  }
  if (!key) throw new Response(`No key for provider ${provider}`, { status: 400 });

  const headers: Record<string, string> = {};
  if ("headers" in providerInfo) {
    Object.assign(headers, providerInfo.headers);
  }
  headers.authorization = `Bearer ${key}`;
  const r = await fetch(`${providerInfo.base}/models`, { headers });

  if (!r.ok)
    throw new Response(`${provider} is ${r.status}ing: ${await r.text()}`, { status: 500 });
  const { data } = await r.json();
  return data as { name: string; id: string }[];
});
