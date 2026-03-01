import { CROFAI_KEY } from '$env/static/private';
import { fn } from 'monoserve';
import { identifiablePrefixes } from './const';

export type CrofModel = {
  id: string;
  name: string;
  context_length: number;
};
export default fn(async () => {
  const r = await fetch(`https://ai.nahcrof.com/v2/models`, {
    headers: { authorization: `Bearer ${CROFAI_KEY}` },
  });

  if (!r.ok) throw new Error(`CrofAI is ${r.status}ing: ${await r.text()}`);
  const { data }: { data: CrofModel[] } = await r.json();
  return data.map((m) => {
    let [authorName, name] = m.name.split(': ');
    if (!identifiablePrefixes.some((prefix) => name.toLowerCase().startsWith(prefix))) {
      name = `${authorName} ${name}`;
    }
    // remove duplicate " Free" suffixes that Crof sometimes provides
    name = name.replace(' Free', '');
    // map ambiguous Kimi K2 entries to the 0711 variant unless explicitly 0905 or Thinking
    name = name.replace(/Kimi K2(?![^\s])(?! 0905)(?! Thinking)/, 'Kimi K2 0711');
    name = name.replace('Kimi K2 0905', 'Kimi K2');
    // temporary Crof workaround for Qwen3 Coder naming
    name = name.replace(/Qwen3 Coder$/, 'Qwen3 Coder 480b A35b');
    return { ...m, name };
  });
});
