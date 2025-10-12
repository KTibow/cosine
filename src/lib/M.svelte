<script lang="ts">
  import { easeEmphasizedDecel } from "m3-svelte";
  import { slide } from "svelte/transition";
  import type { OpenAIMessage } from "./types";

  let message: OpenAIMessage = $props();
</script>

{#if message.role == "user"}
  <div class="message user" in:slide|global={{ duration: 200, easing: easeEmphasizedDecel }}>
    {message.content}
  </div>
{:else if message.role == "assistant"}
  <div class="message assistant">{message.content}</div>
{/if}

<style>
  .message.user {
    background-color: rgb(var(--m3-scheme-primary-container-subtle));
    padding-block: 0.625rem;
    padding-inline: 0.5rem;
    border-radius: 1.25rem;
    white-space: pre-wrap;
  }
  .message.assistant {
    padding-inline: 0.4rem;
    white-space: pre-wrap;
  }
</style>
