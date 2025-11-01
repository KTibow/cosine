import { fn } from "monoserve";
import { object, string } from "valibot";
// import { ghcHeaders } from "../generate/providers";
export const ghcHeaders = {
  "editor-version": "vscode/0-insider",
  "x-github-api-version": "2025-05-01",
  "copilot-vision-request": "true",
};

export type GHCModel = {
  name: string;
  id: string;
  capabilities: {
    type: string;
    limits: { max_context_window_tokens: number };
    supports: { tool_calls: boolean; vision: boolean };
  };
  billing: { multiplier: number };
  model_picker_enabled: boolean;
  supported_endpoints?: string[];
};
export default fn(object({ key: string() }), async ({ key }) => {
  const headers: Record<string, string> = { ...ghcHeaders };
  headers.authorization = `Bearer ${key}`;
  const r = await fetch(`https://api.githubcopilot.com/models`, { headers });

  if (!r.ok) throw new Error(`GHC is ${r.status}ing: ${await r.text()}`);
  const { data } = await r.json();
  return data as GHCModel[];
});
