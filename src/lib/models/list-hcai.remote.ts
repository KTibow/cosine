import { fn } from "monoserve";
import { object, string } from "valibot";

export type HCAIModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};
export default fn(object({ key: string() }), async ({ key }) => {
  const headers: Record<string, string> = {};
  headers.authorization = `Bearer ${key}`;
  const r = await fetch(`https://api.hackclub.com/v1/models`, { headers });

  if (!r.ok) throw new Error(`HCAI is ${r.status}ing: ${await r.text()}`);
  const { data } = await r.json();
  return data as HCAIModel[];
});
