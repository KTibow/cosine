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
        const sync = userdata.sync;
        sync(chatPath);
      });
  });

  const enforceStorageLimit = () => {
    const MAX_SIZE = 1024 * 1024;
    const LARGE_CHAT_THRESHOLD = 100 * 1024;

    // Get all chat entries with their sizes
    const chatEntries = Object.entries(userdata)
      .filter(([k]) => k.startsWith("chats/"))
      .map(([k, v]) => ({
        key: k,
        size: JSON.stringify([k, v]).length,
      }));

    // Calculate total size
    let size = chatEntries.reduce((sum, e) => sum + e.size, 0);

    if (size <= MAX_SIZE) return;

    // Pass 1: Remove large chats (>100kb) first, oldest first
    const largeChats = chatEntries
      .filter((e) => e.size > LARGE_CHAT_THRESHOLD)
      .sort((a, b) => a.key.localeCompare(b.key));
    for (const entry of largeChats) {
      if (size <= MAX_SIZE) return;
      delete userdata[entry.key];
      size -= entry.size;
    }

    // Pass 2: Remove remaining chats by age (oldest first)
    const remaining = chatEntries
      .filter((e) => e.size <= LARGE_CHAT_THRESHOLD)
      .sort((a, b) => a.key.localeCompare(b.key));
    for (const entry of remaining) {
      if (size <= MAX_SIZE) return;
      delete userdata[entry.key];
      size -= entry.size;
    }
  };

  const saveConversation = async (conv: any[]) => {
    if (conv.length == 0) return;
    const serialized = (await Promise.all(conv.map(preSerialize))).filter(
      (m): m is SerializedMessage => Boolean(m),
    );

    let title = "Conversation";
    for (const message of conv) {
      if (message.role != "user") continue;
      if (!("content" in message)) continue;
      if ("attachmentData" in message) continue;
      title = message.content.slice(0, 50);
      break;
    }

    const conversation: Conversation = {
      title,
      messages: serialized,
    };
    userdata[chatPath] = conversation;
    enforceStorageLimit();
  };

  const loadConversation = (k: string, conv: Conversation) => {
    chatId = k;
    messages = conv.messages.map(postDeserialize).filter((m): m is Message => Boolean(m));
  };
</script>

<div class="chats">
  <span>Chats</span>
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
    position: fixed;
    top: 0;
    left: 0;
    padding: 0.5rem;
  }

  .chats > span {
    display: flex;
    align-items: center;
    user-select: none;
    height: 3rem;
    padding-inline: 1rem;
    border-radius: var(--m3-shape-full);
    background-color: --translucent(var(--m3c-surface-container-lowest), 0.5);
    color: var(--m3c-on-surface-variant);
    transition: var(--m3-easing-fast);
  }

  .chats:hover > span {
    background-color: transparent;
    color: transparent;
  }

  .menu {
    display: flex;
    flex-direction: column;

    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
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

    background-color: var(--m3c-surface-container-lowest);

    position: relative;
  }
</style>
