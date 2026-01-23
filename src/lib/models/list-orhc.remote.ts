import { fn } from "monoserve";
import { identifiablePrefixes } from "./const";

export type ORHCModel = {
  id: string;
  name: string;
  context_length: number;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
  };
  supported_parameters: string[];
};

export default fn(async () => {
  const [rUp, rModels] = await Promise.all([
    fetch("https://ai.hackclub.com/up"),
    fetch("https://ai.hackclub.com/proxy/v1/models"),
  ]);
  if (!rUp.ok) throw new Error(`ORHC is ${rUp.status}ing: ${await rUp.text()}`);
  if (!rModels.ok) throw new Error(`ORHC is ${rModels.status}ing: ${await rModels.text()}`);

  const { status }: { status: "up" | "down" } = await rUp.json();
  if (status != "up") {
    return [];
  }

  const { data }: { data: ORHCModel[] } = await rModels.json();
  return data.map((m) => {
    let name = m.name;
    const modelName = name.split(": ").at(-1)!;
    if (identifiablePrefixes.some((prefix) => modelName.toLowerCase().startsWith(prefix))) {
      name = modelName;
    } else {
      name = name.replace(":", "");
    }
    name = name.replace("Kimi K2 0905", "Kimi K2");
    return {
      ...m,
      name,
    };
  });
});
