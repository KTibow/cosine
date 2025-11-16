import { CROFAI_KEY } from "$env/static/private";
import { fn } from "monoserve";

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
  const { data } = await r.json();
  return data as CrofModel[];
});
