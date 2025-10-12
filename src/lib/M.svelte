<script lang="ts">
  import { easeEmphasizedDecel } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { Message } from "./types";

  let message: Message = $props();
</script>

{#if message.role == "user"}
  <div class="user" in:slide|global={{ duration: 200, easing: easeEmphasizedDecel }}>
    {message.content}
  </div>
{:else if message.role == "assistant"}
  {#if message.reasoning}
    <details><summary>Thinking</summary>{message.reasoning}</details>
  {/if}
  <div class="assistant">{message.content}</div>
{/if}

<style>
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
    white-space: pre-wrap;
  }
</style>
