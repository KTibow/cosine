import { fn } from "monoserve";

export type ORFModel = {
  author_name: string;
  name: string;
  id: string;
  input_modalities: string[];
  reasoning: boolean;
  providers: {
    provider_id: string;
    context_length: number;
  }[];
};
export default fn(async () => {
  const r = await fetch(`https://orca.orb.town/api/preview/v2/models`);

  if (!r.ok) throw new Error(`OR is ${r.status}ing: ${await r.text()}`);
  const { models }: { models: ORFModel[] } = await r.json();
  return models.filter((m) => {
    if (m.id.endsWith(":free")) return true;
    if (m.providers.length == 1 && m.providers[0].provider_id == "stealth") return true;
    return false;
  });
});
