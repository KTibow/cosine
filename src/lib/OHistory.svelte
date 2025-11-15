<script lang="ts">
  import { getStorage } from "monoidentity";
  import type { Message } from "./types";
  import { preSerialize, postDeserialize, type SerializedMessage } from "./serialize";
  import { Layer } from "m3-svelte";
  import { untrack } from "svelte";

  type Conversation = {
    title: string;
    messages: SerializedMessage[];
  };

  let { messages = $bindable(), isGenerating }: { messages: Message[]; isGenerating: boolean } =
    $props();

  const randomId = () => Math.floor(Date.now()).toString(36);
  let chatId = $state(randomId());
  let chatPath = $derived(`chats/${chatId}`);
  const userdata = getStorage("userdata");

  $effect(() => {
    const m = $state.snapshot(messages);
    untrack(() => saveConversation(m));
  });

  $effect(() => {
    if (!isGenerating)
      untrack(() => {
        const flush = userdata.flush;
        flush(chatPath);
      });
  });

  const saveConversation = async (m: any[]) => {
    if (m.length == 0) return;
    const serialized = await Promise.all(m.map(preSerialize));

    let title = "Conversation";
    const firstMsg = m[0];
    if (firstMsg?.role == "user") {
      if ("content" in firstMsg && firstMsg.content) {
        title = firstMsg.content.slice(0, 50);
      } else if ("imageURI" in firstMsg) {
        title = "Image conversation";
      }
    }

    const conversation: Conversation = {
      title,
      messages: serialized,
    };
    userdata[chatPath] = conversation;
  };

  const loadConversation = (k: string, conv: Conversation) => {
    chatId = k;
    messages = conv.messages.map(postDeserialize);
  };
</script>

<div class="chats">
  Chats
  <div class="menu">
    <button
      onclick={() => {
        chatId = randomId();
        messages = [];
      }}
    >
      <Layer />
      New chat
    </button>
    {#each Object.entries(userdata)
      .filter(([k]) => k.startsWith("chats/"))
      .map(([k, v]) => [k.slice("chats/".length), v] as const)
      .sort((a, b) => {
        // Sort by id descending (newest first)
        return b[0].localeCompare(a[0]);
      }) as [k, conv]}
      <button onclick={() => loadConversation(k, conv)}>
        <Layer />
        {conv.title}
      </button>
    {/each}
  </div>
</div>

<style>
  .chats {
    display: flex;
    height: 3rem;
    padding-inline: 1rem;
    border-radius: var(--m3-util-rounding-full);
    align-items: center;

    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    color: rgb(var(--m3-scheme-on-surface-variant));
    user-select: none;

    position: fixed;
    top: 0.5rem;
    left: 0.5rem;
  }

  .menu {
    display: flex;
    flex-direction: column;

    position: absolute;
    top: 0;
    left: 0;
    max-height: calc(100vh - 0.5rem - 4rem);
    overflow: auto;

    gap: 0.25rem;
    white-space: nowrap;

    transition: opacity 200ms;
  }

  .chats:not(:hover) > .menu {
    opacity: 0;
    visibility: hidden;
  }

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 3rem;
    min-height: 2rem;
    padding-inline: 0.5rem;
    border-radius: 0.5rem;

    background-color: rgb(var(--m3-scheme-surface-container-lowest));

    position: relative;
  }
</style>
