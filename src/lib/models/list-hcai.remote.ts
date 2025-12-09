import { HACKCLUB_KEY } from "$env/static/private";
import { fn } from "monoserve";

export type HCAIModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};
export default fn(async () => {
  const r = await fetch(`https://hackclub.app/api/openai/v1/models`, {
    headers: { authorization: `Bearer ${HACKCLUB_KEY}` },
  });

  if (!r.ok) throw new Error(`HCAI is ${r.status}ing: ${await r.text()}`);
  const { data } = await r.json();
  return data as HCAIModel[];
});
