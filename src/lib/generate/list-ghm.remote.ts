import { fn } from "monoserve";
import { object, string } from "valibot";

export default fn(object({ key: string() }), async ({ key }) => {
  const headers: Record<string, string> = {};
  headers.authorization = `Bearer ${key}`;
  const r = await fetch(`https://models.github.ai/catalog/models`, { headers });

  if (!r.ok) throw new Error(`GHM is ${r.status}ing: ${await r.text()}`);
  const data = await r.json();
  return data as {
    name: string;
    id: string;
    limits: { max_input_tokens: number };
    supported_output_modalities: string[];
  }[];
});
