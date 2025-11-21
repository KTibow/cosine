<script lang="ts">
  import ONav from "/lib/ONav.svelte";
  import ModelPickerList from "/lib/models/ModelPickerList.svelte";
  import { useModelPicker } from "/lib/useModelPicker.svelte";
  import { Icon } from "m3-svelte";
  import iconCode from "@ktibow/iconset-material-symbols/code-rounded";
  import iconArrowDropDown from "@ktibow/iconset-material-symbols/arrow-drop-down-rounded";

  const modelPicker = useModelPicker(0, false);

  let prompt = $state("");
  let showIframe = $state(true);
  let iframeSrc = $state("");
  let textareaContent = $state("");
  let thinkingStream = $state("");
  let choosingSince: number | undefined = $state();

  const open = () => {
    choosingSince = Date.now();
  };

  const handleModelSelect = (selectedModel: string) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    modelPicker.model = selectedModel;
    delayIfSmall(() => (choosingSince = undefined));
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    console.log("Submitting prompt:", prompt, "with stack:", modelPicker.stack);
    thinkingStream = "Thinking about your request...";
    setTimeout(() => {
      thinkingStream = "";
    }, 2000);
    prompt = "";
  };

  const toggleView = () => {
    showIframe = !showIframe;
  };
</script>

<svelte:window
  onpointerup={(e) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    const target = e.target as HTMLElement;
    if (choosingSince && Date.now() - choosingSince > 333) {
      const label = target.closest("label");
      if (label?.classList.contains("m3-container")) return;
      const button = target.closest("button");
      const newModel = button?.dataset.model;
      if (newModel) {
        modelPicker.model = newModel;
      }
      delayIfSmall(() => (choosingSince = undefined));
    }
  }}
/>

<ONav />

<div class="code-container">
  <div class="main-content">
    <div class="view-toggle">
      <button onclick={toggleView} class="toggle-button">
        <Icon icon={iconCode} size={20} />
        {showIframe ? "Switch to Editor" : "Switch to Preview"}
      </button>
    </div>

    {#if showIframe}
      <iframe
        src={iframeSrc || "about:blank"}
        title="Code Preview"
        class="code-iframe"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    {:else}
      <textarea
        bind:value={textareaContent}
        class="code-textarea"
        placeholder="Enter your code here..."
      ></textarea>
    {/if}

    {#if thinkingStream}
      <div class="thinking-stream">
        <div class="thinking-tape">{thinkingStream}</div>
      </div>
    {/if}
  </div>

  <div class="prompt-bar">
    <input
      type="text"
      bind:value={prompt}
      placeholder="Ask about code or request changes..."
      class="prompt-input"
      onkeydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
    />
    <div class="split-button-group">
      <button class="send-button" onclick={handleSubmit} disabled={!prompt.trim()}>
        Send
      </button>
      <button class="model-selector-button" onpointerdown={open}>
        <Icon icon={iconArrowDropDown} size={20} />
      </button>
    </div>
  </div>
</div>

{#if choosingSince}
  <ModelPickerList
    bottomRight={true}
    modelNames={modelPicker.modelNames}
    modelStacks={modelPicker.modelStacks}
    elos={modelPicker.elos}
    onModelSelect={handleModelSelect}
  />
{/if}

<style>
  .split-button-group {
    display: flex;
    height: 3rem;
    border-radius: var(--m3-util-rounding-full);
    overflow: hidden;
    background-color: rgb(var(--m3-scheme-primary));
  }

  .send-button {
    height: 3rem;
    padding-inline: 1.5rem;
    background-color: rgb(var(--m3-scheme-primary));
    color: rgb(var(--m3-scheme-on-primary));
    font-weight: 500;
    transition: opacity var(--m3-util-easing-fast);
    flex-grow: 1;

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }

  .model-selector-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background-color: rgb(var(--m3-scheme-primary));
    color: rgb(var(--m3-scheme-on-primary));
    border-left: 1px solid rgb(var(--m3-scheme-on-primary) / 0.2);
    transition: opacity var(--m3-util-easing-fast);

    &:hover {
      opacity: 0.9;
    }
  }

  .code-container {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    width: 100%;
    padding-left: 4rem;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .view-toggle {
    display: flex;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--m3-util-rounding-full);
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
    font-size: 0.875rem;
    transition: background-color var(--m3-util-easing-fast);

    &:hover {
      background-color: rgb(var(--m3-scheme-surface-container-high));
    }
  }

  .code-iframe {
    flex: 1;
    width: 100%;
    border: none;
    background-color: rgb(var(--m3-scheme-surface));
  }

  .code-textarea {
    flex: 1;
    width: 100%;
    border: none;
    padding: 1rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    background-color: rgb(var(--m3-scheme-surface));
    color: rgb(var(--m3-scheme-on-surface));
    resize: none;
    outline: none;

    &::placeholder {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
  }

  .thinking-stream {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 1rem;
    background-color: rgb(var(--m3-scheme-surface-container-high) / 0.95);
    border-top: 1px solid rgb(var(--m3-scheme-outline-variant));
  }

  .thinking-tape {
    color: rgb(var(--m3-scheme-on-surface-variant));
    font-size: 0.875rem;
    font-style: italic;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .prompt-bar {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    border-top: 1px solid rgb(var(--m3-scheme-outline-variant));
  }

  .prompt-input {
    flex: 1;
    height: 3rem;
    padding: 0 1rem;
    border: none;
    border-radius: var(--m3-util-rounding-full);
    background-color: rgb(var(--m3-scheme-surface-container-highest));
    color: rgb(var(--m3-scheme-on-surface));
    font-size: 1rem;
    outline: none;
    transition: background-color var(--m3-util-easing-fast);

    &:focus {
      background-color: rgb(var(--m3-scheme-surface-container));
    }

    &::placeholder {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
  }
</style>
