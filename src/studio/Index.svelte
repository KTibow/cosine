<script lang="ts">
  import { Icon, Layer } from "m3-svelte";
  import iconSend from "@ktibow/iconset-material-symbols/send-rounded";
  import iconCopy from "@ktibow/iconset-material-symbols/content-copy-rounded";
  import iconDownload from "@ktibow/iconset-material-symbols/download-rounded";
  import { star } from "kreations";
  import { omniContent } from "/lib/OInput.svelte";
  import ONav from "/lib/ONav.svelte";
  import fetchRemote from "/lib/generate/fetch.remote";
  import { isHotkey } from "/lib/focus";

  type Gen = {
    prompt: string;
    url: string | undefined;
  };

  type Model = {
    id: string;
    label: string;
  };

  const models: Model[] = [
    { id: "google/gemini-2.5-flash-image", label: "Flash" },
    { id: "google/gemini-3-pro-image-preview", label: "Pro" },
  ];

  const aspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

  let gens: Gen[] = $state([]);
  let isGenerating = $state(false);
  let selectedModel = $state(models[0].id);
  let selectedAspectRatio = $state("4:3");

  const copyToClipboard = async (dataUrl: string) => {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  };

  const generate = async (prompt: string) => {
    if (!prompt.trim()) return;

    isGenerating = true;
    gens.push({
      prompt,
      url: undefined,
    });
    const gen = gens.at(-1)!;

    try {
      const response = await fetchRemote({
        url: "https://ai.hackclub.com/proxy/v1/chat/completions",
        headers: {
          authorization: "Bearer SERVER_KEY",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: `Generate an image of: ${prompt}` }],
          modalities: ["image", "text"],
          image_config: { aspect_ratio: selectedAspectRatio },
        }),
      });

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error("No image URL returned");
      }

      gen.url = imageUrl;
    } catch (e) {
      console.error("Generation failed:", e);
      gens = gens.filter((g) => g != gen);
    } finally {
      isGenerating = false;
    }
  };

  const handleSubmit = () => {
    const prompt = $omniContent.trim();
    if (!prompt) return;

    $omniContent = "";
    generate(prompt);
  };

  let field: HTMLTextAreaElement;
</script>

<svelte:window
  onkeydown={(e) => {
    if (!isHotkey(e)) return;
    field?.focus();
  }}
/>

<ONav />

{#each gens.toReversed() as gen}
  <div class="gen-item">
    {#if gen.url}
      <img src={gen.url} alt={gen.prompt} />
    {:else}
      <Icon icon={star} class="loading" />
    {/if}
    <div class="caption">
      <span class="prompt">{gen.prompt}</span>
      {#if gen.url}
        <button onclick={() => copyToClipboard(gen.url!)}>
          <Layer />
          <Icon icon={iconCopy} />
        </button>
        <a href={gen.url} download={`${gen.prompt.slice(0, 50).replace(/[^a-z0-9]/gi, "-")}.png`}>
          <Layer />
          <Icon icon={iconDownload} />
        </a>
      {/if}
    </div>
  </div>
{/each}

<div class="input-bar">
  <textarea
    class="focus-none"
    placeholder="Describe an image"
    rows="2"
    bind:this={field}
    bind:value={$omniContent}
    onkeypress={(e) => {
      if (e.key == "Enter" && !e.shiftKey && $omniContent.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }}
  ></textarea>
  <button class="focus-none" disabled={!$omniContent.trim() || isGenerating} onclick={handleSubmit}>
    <Layer />
    <Icon icon={iconSend} />
  </button>
  <div class="controls">
    <select bind:value={selectedModel}>
      {#each models as model}
        <option value={model.id}>{model.label}</option>
      {/each}
    </select>
    <select bind:value={selectedAspectRatio}>
      {#each aspectRatios as ratio}
        <option value={ratio}>{ratio}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  :global(body) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1.5rem;
    padding: 2rem;
  }

  .gen-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  img,
  :global(.loading) {
    width: 100%;
    height: auto;
    border-radius: 1rem;
  }

  .caption {
    display: flex;
    align-items: center;
  }

  .prompt {
    @apply --m3-body-small;
    flex: 1;
    color: var(--m3c-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .caption button,
  .caption a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--m3-shape-small);
    position: relative;
  }

  .input-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    max-width: 25rem;
    width: 100%;
    background: var(--m3c-surface-container-low);
    border-radius: 1.5rem 1.5rem 0 0;
    display: flex;
  }

  .input-bar textarea {
    padding: 0.5rem 3rem 1.5rem 1rem;
    resize: none;
    flex: 1;
    min-width: 0;
  }

  .input-bar button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    border-radius: 1.5rem;
    color: var(--m3c-primary);
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    transition: var(--m3-easing);
  }

  .input-bar button:disabled {
    opacity: 0;
    visibility: hidden;
  }

  .controls {
    position: absolute;
    bottom: 0;
    left: 0.5rem;
    display: flex;
  }

  select {
    @apply --m3-body-small;
    height: 1.5rem;
    padding-inline: 0.5rem;
    color: var(--m3c-on-surface-variant);
    cursor: pointer;
    backdrop-filter: blur(0.5rem);
  }
</style>
