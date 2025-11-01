import { OPENROUTER_FREE_KEY } from "$env/static/private";
import { fn } from "monoserve";

export type ORFModel = {
  name: string;
  id: string;
  context_length: number;
  architecture: { input_modalities: string[] };
};
export default fn(async () => {
  const headers: Record<string, string> = {};
  headers.authorization = `Bearer ${OPENROUTER_FREE_KEY}`;
  const r = await fetch(`https://openrouter.ai/api/v1/models`, { headers });

  if (!r.ok) throw new Error(`OR is ${r.status}ing: ${await r.text()}`);
  const { data } = await r.json();
  return data as ORFModel[];
});
