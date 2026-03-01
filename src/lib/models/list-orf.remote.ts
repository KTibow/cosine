import { fn } from 'monoserve';
import { identifiablePrefixes } from './const';

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
  return models
    .filter((m) => {
      if (m.id.endsWith(':free')) return true;
      if (m.providers.length == 1 && m.providers[0].provider_id == 'stealth') return true;
      return false;
    })
    .map((m) => {
      let name = m.name;
      name = name.split(' (free)')[0];
      if (
        !identifiablePrefixes.some((prefix) => name.toLowerCase().startsWith(prefix)) &&
        m.author_name != 'alibaba' &&
        m.author_name != 'openrouter'
      ) {
        name = `${m.author_name} ${name}`;
      }

      return { ...m, name };
    });
});
