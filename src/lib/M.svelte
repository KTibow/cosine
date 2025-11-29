<script lang="ts">
  import iconExpand from "@ktibow/iconset-material-symbols/expand-all-rounded";
  import iconCopy from "@ktibow/iconset-material-symbols/content-copy-outline-rounded";
  import { easeEmphasizedDecel, Icon, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { AssistantPart, AssistantReasoningPart, Message } from "./types";
  import MFormat from "./MFormat.svelte";
  import TextLoader from "./TextLoader.svelte";
  import MFormatLightweight from "./MFormatLightweight.svelte";

  let {
    message,
    autoScroll,
    isGenerating,
    messages = [],
  }: {
    message: Message;
    autoScroll: boolean;
    isGenerating: boolean;
    messages?: Message[];
  } = $props();

  let expanded = $state(false);

  const copyAssistantToClipboard = async (text: string, e: MouseEvent) => {
    const button = e.currentTarget as HTMLElement;
    const wrapper = button.closest(".message-wrapper") as HTMLElement;
    const assistantDiv = wrapper?.querySelector(".assistant") as HTMLElement;
    const html = assistantDiv?.innerHTML || "";
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    } catch (err) {
      // Fallback to plain text only
      await navigator.clipboard.writeText(text);
    }
  };

  const scrollIn = (node: HTMLElement) => {
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getReasoningStatus = (parts: AssistantReasoningPart[]) => {
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.category == "summary") {
        const title = part.text.match(/^\*\*(.+?)\*\*/);
        if (title) {
          return title[1];
        }
      } else if (part.category == "text") {
        const boldChunks = [...part.text.matchAll(/\*\*(.+?)\*\*/g)];
        const bold = boldChunks.at(-1);
        if (bold) {
          return bold[1];
        }
      }
    }
  };
</script>

{#snippet copyButton(onclick?: (e: MouseEvent) => void)}
  <button class="copy-button" {onclick}>
    <Layer />
    <Icon icon={iconCopy} />
  </button>
{/snippet}

{#if "imageURI" in message}
  <img
    class="user-image"
    src={message.imageURI}
    alt="From user"
    in:slide|global={{ duration: 500, easing: easeEmphasizedDecel }}
  />
{:else if "attachmentData" in message}
  {@const { text, source } = message.attachmentData}
  {#if expanded}
    <div class="attachment-expanded">
      <p class="content">{text}</p>
      <button onclick={() => (expanded = false)}>
        <Layer />
        Collapse
      </button>
    </div>
  {:else}
    <div
      class="attachment"
      class:loading={text == "[loading]"}
      in:slide|global={{ duration: 500, easing: easeEmphasizedDecel }}
    >
      <p class="title">
        {source.replace(/^www./, "").slice(0, 20)}
        {#if text.length >= 4000}
          <span>{Math.ceil(text.length / 4000)}k tokens</span>
        {:else}
          <span>~{Math.ceil(text.length / 4)} tokens</span>
        {/if}
        {#if text.length >= 200}
          <button onclick={() => (expanded = true)}>
            <Icon icon={iconExpand} />
          </button>
        {/if}
      </p>
      <p class="content m3-font-body-medium">
        {text.replace(/\n+/g, "¶").slice(0, 400)}
      </p>
      {#if text != "[loading]"}
        {@render copyButton(() => navigator.clipboard.writeText(text))}
      {/if}
    </div>
  {/if}
{:else if message.role == "user"}
  <div class="user" in:slide|global={{ duration: 200, easing: easeEmphasizedDecel }}>
    {message.content}
    {@render copyButton(() => navigator.clipboard.writeText(message.content))}
  </div>
{:else if message.role == "assistant"}
  {#snippet contentPart(part: AssistantPart)}
    {#if part.type == "reasoning"}
      {#if part.category == "text"}
        <p class="pre-wrap">{part.text?.trimEnd()}</p>
      {:else if part.category == "summary"}
        <div><MFormatLightweight input={part.text} /></div>
      {:else if part.category == "encrypted"}
        <p><strong>Hidden thinking</strong></p>
      {/if}
    {:else if part.type == "text"}
      <div class="assistant">
        <MFormat input={part.text} />
        {@render copyButton((e) => copyAssistantToClipboard(part.text, e))}
      </div>
    {:else if part.type == "tool_call"}
      {@const toolResult = messages.find((m) => m.role == "tool" && m.tool_call_id == part.call.id)}
      <details class="tool-call">
        <summary class="m3-font-label-large">
          {part.call.function.name || part.call.id}
          {#if part.status}
            <span class="status m3-font-label-medium">{part.status.replaceAll("_", " ")}</span>
          {/if}
        </summary>
        <pre>{part.call.function.arguments}</pre>
        {#if toolResult}
          <pre>{toolResult.content}</pre>
        {/if}
      </details>
    {/if}
  {/snippet}
  {#snippet content()}
    {@const reasoningParts = message.content.filter((p) => p.type == "reasoning")}
    {@const nonreasoningParts = message.content.filter((p) => p.type != "reasoning")}
    {#if reasoningParts.length > 0}
      {@const status = getReasoningStatus(reasoningParts)}
      {@const thinkingExtended = status ? `Thinking - ${status}` : "Thinking"}
      <details>
        <summary>
          {#if isGenerating && nonreasoningParts.length == 0}
            <TextLoader text={thinkingExtended} />
          {:else}
            Thinking
          {/if}
        </summary>
        {#each reasoningParts as part}
          {@render contentPart(part)}
        {/each}
      </details>
    {/if}
    {#each nonreasoningParts as part}
      {@render contentPart(part)}
    {/each}
  {/snippet}

  {#if autoScroll}
    <div class="assistant-container" use:scrollIn>
      {@render content()}
    </div>
  {:else}
    {@render content()}
  {/if}
{/if}

<style>
  pre,
  .pre-wrap {
    white-space: pre-wrap;
  }

  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    position: absolute;
    inset-block: 0;
    inset-inline: 100% -1.5rem;
    &:is(.assistant > .copy-button) {
      align-items: start;
      padding-block-start: 0.5rem;
    }
    &:not(:hover > .copy-button) {
      opacity: 0;
    }
    transition: opacity var(--m3-util-easing-fast);
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  .user-image {
    height: 8rem;
    border-radius: var(--m3-util-rounding-large);
    align-self: end;
  }

  .attachment-expanded {
    display: flex;
    flex-direction: column;

    background-color: rgb(var(--m3-scheme-secondary-container));
    color: rgb(var(--m3-scheme-on-secondary-container));

    border-radius: 1.25rem;
    flex-shrink: 0;

    > .content {
      white-space: pre-wrap;
      margin-inline: 0.5rem;
      margin-block: 1.5rem;
    }
    > button {
      display: flex;
      align-items: center;
      justify-content: center;

      height: 2.5rem;
      border-radius: 1.25rem;
      background-color: rgb(var(--m3-scheme-secondary));
      color: rgb(var(--m3-scheme-on-secondary));
      position: relative;
    }
  }

  .attachment {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 0.5rem;

    background-color: rgb(var(--m3-scheme-secondary-container-subtle));
    color: rgb(var(--m3-scheme-on-secondary-container-subtle));

    width: 20rem;
    height: 10.25rem;
    padding: 1rem;
    border-radius: var(--m3-util-rounding-extra-large);
    align-self: end;
    position: relative;

    &.loading {
      --bg: rgb(var(--m3-scheme-secondary-container-subtle));
      --fg: rgb(var(--m3-scheme-primary-container-subtle));
      background-image: linear-gradient(
        in oklab to right,
        var(--bg) 0%,
        var(--bg) 2.5%,
        var(--bg) 5%,
        var(--bg) 7.5%,
        var(--bg) 10%,
        var(--bg) 12.5%,
        var(--bg) 15%,
        var(--bg) 17.5%,
        color-mix(in oklab, var(--fg) 1%, var(--bg)) 20%,
        color-mix(in oklab, var(--fg) 3%, var(--bg)) 22.5%,
        color-mix(in oklab, var(--fg) 7%, var(--bg)) 25%,
        color-mix(in oklab, var(--fg) 13%, var(--bg)) 27.5%,
        color-mix(in oklab, var(--fg) 21%, var(--bg)) 30%,
        color-mix(in oklab, var(--fg) 31%, var(--bg)) 32.5%,
        color-mix(in oklab, var(--fg) 43%, var(--bg)) 35%,
        color-mix(in oklab, var(--fg) 56%, var(--bg)) 37.5%,
        color-mix(in oklab, var(--fg) 69%, var(--bg)) 40%,
        color-mix(in oklab, var(--fg) 81%, var(--bg)) 42.5%,
        color-mix(in oklab, var(--fg) 91%, var(--bg)) 45%,
        color-mix(in oklab, var(--fg) 97%, var(--bg)) 47.5%,
        color-mix(in oklab, var(--fg) 100%, var(--bg)) 50%,
        color-mix(in oklab, var(--fg) 97%, var(--bg)) 52.5%,
        color-mix(in oklab, var(--fg) 91%, var(--bg)) 55%,
        color-mix(in oklab, var(--fg) 81%, var(--bg)) 57.5%,
        color-mix(in oklab, var(--fg) 69%, var(--bg)) 60%,
        color-mix(in oklab, var(--fg) 56%, var(--bg)) 62.5%,
        color-mix(in oklab, var(--fg) 43%, var(--bg)) 65%,
        color-mix(in oklab, var(--fg) 31%, var(--bg)) 67.5%,
        color-mix(in oklab, var(--fg) 21%, var(--bg)) 70%,
        color-mix(in oklab, var(--fg) 13%, var(--bg)) 72.5%,
        color-mix(in oklab, var(--fg) 7%, var(--bg)) 75%,
        color-mix(in oklab, var(--fg) 3%, var(--bg)) 77.5%,
        color-mix(in oklab, var(--fg) 1%, var(--bg)) 80%,
        var(--bg) 82.5%,
        var(--bg) 85%,
        var(--bg) 87.5%,
        var(--bg) 90%,
        var(--bg) 92.5%,
        var(--bg) 95%,
        var(--bg) 97.5%,
        var(--bg) 100%
      );
      background-size: 200% 100%;
      color: transparent;
      pointer-events: none;
      animation: pulse 2s infinite linear;
    }
    > .title {
      display: grid;
      grid-template-columns: 1fr auto auto;
      white-space: nowrap;
      > button {
        display: flex;
        align-items: center;
        margin-left: 0.5rem;
      }
    }
    > .content {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 5;
      line-clamp: 5;
      overflow: hidden;

      opacity: 0.8;
      text-overflow: ellipsis;
    }
  }
  @keyframes pulse {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 200% 0%;
    }
  }

  .user {
    background-color: rgb(var(--m3-scheme-primary-container-subtle));
    padding-block: 0.625rem;
    padding-inline: 0.5rem;
    border-radius: 1.25rem;
    white-space: pre-wrap;
    position: relative;
  }
  details {
    padding: 0.4rem;
    border-radius: 0.4rem;
    transition: background-color var(--m3-util-easing-fast);
  }
  details[open] {
    background-color: rgb(var(--m3-scheme-secondary-container-subtle) / 0.5);
  }
  summary {
    display: grid;
    color: rgb(var(--m3-scheme-secondary));
    cursor: pointer;
    user-select: none;

    margin: -0.4rem;
    padding: 0.4rem;
  }
  ::details-content {
    display: flex;
    flex-direction: column;

    interpolate-size: allow-keywords;
    overflow: hidden;
    transition:
      padding var(--m3-util-easing-fast),
      height var(--m3-util-easing-fast),
      content-visibility var(--m3-util-easing-fast) allow-discrete;

    color: rgb(var(--m3-scheme-on-secondary-container-subtle) / 0.8);
  }
  details :global(strong) {
    background-color: rgb(var(--m3-scheme-secondary));
    color: rgb(var(--m3-scheme-on-secondary));
    padding-inline: calc(0.5lh - 0.5em);
    border-radius: 0.1rem;
    font-weight: 400;
  }
  details:not(:open)::details-content {
    height: 0;
  }
  details[open]::details-content {
    padding-top: 0.4rem;
    height: auto;
  }
  .assistant {
    padding-inline: 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
  }
  .tool-call > summary {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
  }
  .tool-call > summary .status {
    padding: 0.15rem 0.4rem;
    border-radius: var(--m3-util-rounding-full);
    background-color: rgb(var(--m3-scheme-secondary-container));
    color: rgb(var(--m3-scheme-on-secondary-container));
    text-transform: capitalize;
  }
  .tool-call::details-content {
    margin-inline: -0.4rem;
  }
  .tool-call[open]::details-content {
    margin-bottom: -0.4rem;
  }
  .tool-call > pre {
    padding: 0.4rem;
    overflow-x: auto;
  }
  .tool-call > pre:first-of-type {
    border-radius: 0.5rem;
    background-color: rgb(var(--m3-scheme-secondary-container-subtle));
    color: rgb(var(--m3-scheme-on-secondary-container-subtle));
  }
  .assistant-container {
    scroll-margin-top: 10rem;
    min-height: calc(100dvh - 4rem - 1.5rem - 10rem);
  }
</style>
