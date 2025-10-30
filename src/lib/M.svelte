<script lang="ts">
  import iconExpand from "@ktibow/iconset-material-symbols/expand-all-rounded";
  import { easeEmphasizedDecel, Icon, Layer } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Message } from "./types";
  import MFormat from "./MFormat.svelte";
  import TextLoader from "./TextLoader.svelte";

  let {
    message,
    autoScroll,
    isGenerating,
  }: { message: Message; autoScroll: boolean; isGenerating: boolean } = $props();

  let expanded = $state(false);

  const scrollIn = (node: HTMLElement) => {
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };
</script>

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
        {#if message.content.includes("[truncated]")}
          <span>6k/{Math.ceil(text.length / 4000)}k tokens</span>
        {:else if text.length >= 4000}
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
    </div>
  {/if}
{:else if message.role == "user"}
  <div class="user" in:slide|global={{ duration: 200, easing: easeEmphasizedDecel }}>
    {message.content}
  </div>
{:else if message.role == "assistant"}
  {#snippet content()}
    {#if message.reasoning}
      <details>
        <summary>
          {#if isGenerating}
            <TextLoader text="Thinking" />
          {:else}
            Thinking
          {/if}
        </summary>{message.reasoning.trim()}
      </details>
    {/if}
    {#if message.content}
      <div class="assistant">
        <MFormat input={message.content} />
      </div>
    {/if}
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
  }
  details {
    padding: 0.4rem;
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
    color: rgb(var(--m3-scheme-on-surface-variant));
    interpolate-size: allow-keywords;
    overflow: hidden;
    white-space: pre-wrap;
    transition:
      padding var(--m3-util-easing-fast),
      height var(--m3-util-easing-fast),
      content-visibility var(--m3-util-easing-fast) allow-discrete;
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
  }
  .assistant-container {
    scroll-margin-top: 10rem;
    min-height: calc(100dvh - 4rem - 1.5rem - 10rem);
  }
</style>
