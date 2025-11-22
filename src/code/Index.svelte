<script lang="ts">
  import ONav from "/lib/ONav.svelte";
  import ModelPickerList from "/lib/models/ModelPickerList.svelte";
  import { useModelPicker } from "/lib/useModelPicker.svelte";
  import generate from "/lib/generate";
  import type { Message, AssistantMessage } from "/lib/types";
  import { Icon } from "m3-svelte";
  import iconCode from "@ktibow/iconset-material-symbols/code-rounded";
  import iconArrowDropDown from "@ktibow/iconset-material-symbols/arrow-drop-down-rounded";

  const modelPicker = useModelPicker(0, false);

  let prompt = $state("");
  let showIframe = $state(true);
  let iframeSrc = $state("");
  let textareaContent = $state("");
  let messages: Message[] = $state([]);
  let choosingSince: number | undefined = $state();
  let aborter: AbortController | undefined = $state();
  let hasConnected = $state(false);

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

  const abortable = async (code: () => Promise<void>) => {
    try {
      aborter = new AbortController();
      await code();
    } finally {
      aborter = undefined;
      hasConnected = false;
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    const question = prompt;
    prompt = "";

    messages.push({ role: "user", content: question });

    const response: AssistantMessage = $state({ role: "assistant", content: [] });

    abortable(async () => {
      let isFirst = true;
      for await (const message of generate(messages, modelPicker.stack, aborter?.signal)) {
        hasConnected = true;
        if (JSON.stringify(message) == `{"role":"assistant","content":[]}`) continue;
        if (isFirst) {
          isFirst = false;
          messages.push(response);
        }
        Object.assign(response, message);
      }
    });
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

    {#if aborter}
      <div class="thinking-stream">
        <div class="thinking-tape">
          {hasConnected ? "Generating..." : "Connecting..."}
        </div>
      </div>
    {/if}

    {#if messages.length > 0}
      <div class="messages-overlay">
        {#each messages as message}
          <div class="message" class:user={message.role === "user"} class:assistant={message.role === "assistant"}>
            {#if message.role === "user"}
              <strong>You:</strong> {message.content}
            {:else if message.role === "assistant"}
              <strong>Assistant:</strong>
              {#each message.content as part}
                {#if part.type === "text"}
                  {part.text}
                {/if}
              {/each}
            {/if}
          </div>
        {/each}
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

  .messages-overlay {
    position: absolute;
    top: 3rem;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1rem;
    overflow-y: auto;
    background-color: rgb(var(--m3-scheme-surface) / 0.95);
    backdrop-filter: blur(8px);
  }

  .message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;

    &.user {
      background-color: rgb(var(--m3-scheme-primary-container));
      color: rgb(var(--m3-scheme-on-primary-container));
    }

    &.assistant {
      background-color: rgb(var(--m3-scheme-secondary-container));
      color: rgb(var(--m3-scheme-on-secondary-container));
    }

    strong {
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 600;
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
