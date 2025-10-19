<script lang="ts">
  import { easeEmphasizedDecel } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Message } from "./types";
  import MFormat from "./MFormat.svelte";

  let { message, autoScroll }: { message: Message; autoScroll: boolean } = $props();

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
{:else if message.role == "user"}
  <div class="user" in:slide|global={{ duration: 200, easing: easeEmphasizedDecel }}>
    {message.content}
  </div>
{:else if message.role == "assistant"}
  {#snippet content()}
    {#if message.reasoning}
      <details><summary>Thinking</summary>{message.reasoning.trim()}</details>
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
    display: flex;
    align-items: center;
    color: rgb(var(--m3-scheme-secondary));
    cursor: pointer;
    user-select: none;

    margin-inline: -0.4rem;
    padding-inline: 0.4rem;
    margin-block: -0.4rem;
    padding-block: 0.4rem;
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
