<script lang="ts">
  import OInput, { omniContent } from "/lib/OInput.svelte";
  import M from "/lib/M.svelte";
  import type { Message, Stack } from "/lib/types";
  import ModelPicker from "/lib/models/ModelPicker.svelte";
  import generate from "/lib/generate";
  import SettingsButton from "/lib/models/SettingsButton.svelte";

  let stack: Stack = $state([]);
  let messages: Message[] = $state([]);
  let messagePairs = $derived.by(() => {
    const pairs: Message[][] = [];
    for (const message of messages) {
      if (message.role == "user") {
        pairs.push([message]);
      } else if (pairs.length > 0) {
        pairs[pairs.length - 1].push(message);
      }
    }
    return pairs;
  });
  const scrollIn = (node: HTMLElement) => {
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let context = $derived(
    messages.reduce((acc, msg) => acc + (msg.content ? msg.content.length : 0), 0) +
      $omniContent.length,
  );

  let aborter: AbortController | undefined = $state();
  const abort = $derived(
    aborter
      ? () => {
          aborter!.abort();
          aborter = undefined;
        }
      : undefined,
  );
  const abortable = async (code: () => Promise<void>) => {
    try {
      aborter = new AbortController();
      await code();
    } finally {
      aborter = undefined;
    }
  };

  const submit = async (question: string) => {
    messages.push({ role: "user", content: question });

    const response = $state({ role: "assistant" as const, content: "" });

    abortable(async () => {
      let isFirst = true;
      for await (const message of generate(messages, stack)) {
        if (isFirst) {
          isFirst = false;
          messages.push(response);
        }
        Object.assign(response, message);
      }
    });
  };
</script>

{#if messagePairs.length > 0}
  <div class="chat">
    {#each messagePairs as pair, i}
      <div class="pair" class:expanded={i == messagePairs.length - 1} use:scrollIn>
        {#each pair as message (message)}
          <M {...message} />
        {/each}
      </div>
    {/each}
  </div>
{:else}
  <p style:margin="auto">
    This is an <strong>interim</strong> version of Cosine, only about 20% done.
  </p>
{/if}
<div class="input">
  <OInput {abort} {submit} />
</div>
<div class="controls">
  <ModelPicker bind:stack inverted minContext={context} />
  <SettingsButton />
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 50rem;
    @media (width > 50rem) {
      max-width: min(calc(100dvw - 20rem), 50rem);
    }
    gap: 0.5rem;
    padding-block: 1.5rem;
    align-self: center;
    flex-grow: 1;
  }
  .pair {
    display: inherit;
    flex-direction: inherit;
    gap: inherit;
    &.expanded {
      min-height: 80dvh;
    }
  }
  .input {
    display: flex;
    position: sticky;
    width: 100%;
    max-width: 50rem;
    @media (width > 50rem) {
      max-width: min(calc(100dvw - 20rem), 50rem);
    }
    align-self: center;
    bottom: 0;
    background-color: rgb(var(--m3-scheme-surface-container-low));
    border-start-start-radius: 1.5rem;
    border-start-end-radius: 1.5rem;
  }

  .controls {
    display: flex;
    position: fixed;
    gap: 0.5rem;

    bottom: 0.5rem;
    right: 0.5rem;
  }
</style>
