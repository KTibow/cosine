<script lang="ts">
  import OInput, { omniContent } from "/lib/OInput.svelte";
  import M from "/lib/M.svelte";
  import type { Message, Stack, AssistantMessage } from "/lib/types";
  import ModelPicker from "/lib/models/ModelPicker.svelte";
  import ToolPicker from "/lib/tools/ToolPicker.svelte";
  import PromptPicker, { allPrompts } from "/lib/prompts/PromptPicker.svelte";
  import generate from "/lib/generate";
  import ABase from "/lib/ABase.svelte";
  import AImages from "/lib/AImages.svelte";
  import AIngest from "/lib/AIngest.svelte";
  import TextLoader from "/lib/TextLoader.svelte";
  import ONav from "/lib/ONav.svelte";
  import OHistory from "/lib/OHistory.svelte";

  let stack: Stack = $state([]);
  let messages: Message[] = $state([]);
  let enabledTools: string[] = $state([]);
  let selectedPrompt: string = $state("None");

  let context = $derived(
    ((messages.reduce((acc, msg) => {
      if (msg.role == "assistant") {
        for (const part of msg.content) {
          if (part.type == "text") {
            acc += part.text.length;
          }
        }
      } else if ("content" in msg && typeof msg.content == "string") {
        acc += msg.content.length;
      }
      return acc;
    }, 0) +
      $omniContent.length) /
      4) *
      1.1,
  );
  let useImageInput = $derived(messages.some((m) => "imageURI" in m));

  let aborter: AbortController | undefined = $state();
  let hasConnected = $state(false);
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
      hasConnected = false;
    }
  };

  const submit = async (question: string) => {
    messages.push({ role: "user", content: question });

    const addMessage = <T extends Message>(base: T): T => {
      hasConnected = true;
      const temp = $state(base);
      messages.push(temp);
      return temp;
    };

    abortable(async () => {
      const systemPrompt = allPrompts[selectedPrompt];
      await generate(
        systemPrompt ? [{ role: "system" as const, content: systemPrompt }, ...messages] : messages,
        stack,
        addMessage,
        aborter?.signal,
        enabledTools,
      );
    });
  };
</script>

<OHistory bind:messages isGenerating={Boolean(aborter)} />
<ONav />

{#if messages.length > 0}
  <div class="chat">
    {#each messages.filter((m) => m.role != "tool") as message, i (message)}
      <M
        {message}
        {messages}
        autoScroll={i == messages.length - 1 && message.role == "assistant"}
        isGenerating={Boolean(aborter)}
      />
    {/each}
    {#if !messages.some((m, i) => i == messages.length - 1 && (m.role == "assistant" || "attachmentData" in m))}
      <div class="assistant-spacer">
        {#if hasConnected}
          <TextLoader text="Generating" />
        {:else if aborter}
          <TextLoader text="Connecting" />
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <p style:margin-block="auto" style:text-align="center">Cosine is about 67% done.</p>
{/if}
<div class="input">
  <OInput {abort} animate={hasConnected} {submit} />
</div>
<div class="bottom-right-controls">
  <PromptPicker bind:selectedPrompt toolsEnabled={enabledTools.length > 0} />
  <ToolPicker bind:enabledTools />
  <ModelPicker bind:stack minContext={context} {useImageInput} />
</div>
<ABase />
<AImages addMessage={(message) => messages.push(message)} />
<AIngest
  addMessage={(message) => messages.push(message)}
  removeMessage={(message) => (messages = messages.filter((m) => m != message))}
/>

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
    background-color: var(--m3c-surface-container-low);
    border-start-start-radius: 1.5rem;
    border-start-end-radius: 1.5rem;
  }
  .assistant-spacer {
    padding: 0.4rem;
    height: calc(100dvh - 4rem - 1.5rem - 10rem);
    color: var(--m3c-on-surface-variant);
  }
  .bottom-right-controls {
    display: flex;
    gap: 0.25rem;
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
  }
</style>
