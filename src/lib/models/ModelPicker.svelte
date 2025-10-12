<script lang="ts">
  import { getStorage } from "monoidentity";
  import type { Stack } from "../types";
  import type { Provider } from "../generate/directory";
  import useDirectoryListRemote from "../generate/use-directory-list.remote";
  import getAccessToken from "../generate/copilot/get-access-token";

  let { stack = $bindable(), fixed }: { stack: Stack; fixed: boolean } = $props();

  const cache = getStorage("cache");
  const config = getStorage("config");

  const groqModels = {
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "Kimi K2": "moonshotai/kimi-k2-instruct-0905",
  };
  const cerebrasModels = { "gpt-oss-120b": "gpt-oss-120b" };
  const geminiModels = { "Gemini 2.5 Pro": "models/gemini-2.5-pro" };
  let copilotModels: Record<string, string> = $state(cache["Copilot models"] || {});

  const cleanName = (name: string) => name.replace(" (Preview)", "");
  const updateCopilot = async ({ token }: { token: string }) => {
    const models = (await useDirectoryListRemote({
      provider: "Copilot",
      key: await getAccessToken(token),
    })) as any[];
    const modelsFormatted = Object.fromEntries(
      models
        .filter((m) => m.model_picker_enabled && !m.supported_endpoints)
        .map((m) => [cleanName(m.name), m.id]),
    );
    copilotModels = modelsFormatted;
    cache["Copilot models"] = modelsFormatted;
  };
  if (config.providers?.ghc) updateCopilot(config.providers.ghc);

  let models = $derived.by(() => {
    const output: Record<string, Stack> = {};

    const addModels = (provider: Provider, modelList: Record<string, string>) => {
      for (const [name, model] of Object.entries(modelList)) {
        output[name] ||= [];
        output[name].push({ provider, model });
      }
    };
    addModels("Cerebras via Cosine", cerebrasModels);
    addModels("Groq via Cosine", groqModels);
    addModels("Gemini via Cosine", geminiModels);
    addModels("Copilot", copilotModels);

    return output;
  });

  let model = $state("Kimi K2");
  $effect(() => {
    stack = models[model];
  });
</script>

<select class:fixed bind:value={model}>
  {#each Object.keys(models) as modelName}
    <option>{modelName}</option>
  {/each}
</select>

<style>
  select {
    height: 3rem;
    padding-inline: 1rem;
    border-radius: 1.5rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    cursor: pointer;
    &.fixed {
      position: fixed;
      right: 0.5rem;
      bottom: 0.5rem;
    }
  }
</style>
