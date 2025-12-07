<script lang="ts">
  import { slide } from "svelte/transition";
  import { onMount } from "svelte";
  import { easeEmphasizedDecel } from "m3-svelte";
  import { getStorage } from "monoidentity";
  import MFormatWikilinks from "/lib/MFormatWikilinks.svelte";
  import generate from "/lib/generate";
  import type { Message, Stack } from "/lib/types";

  let {
    topic,
    ancestry,
    stack,
    onLink,
  }: {
    topic: string;
    ancestry: string[];
    stack: Stack;
    onLink: (target: string) => void;
  } = $props();

  const cache = getStorage("cache");
  let response = $state("");

  const quickHash = (string: string) => {
    let hash = 0;
    Array.from(
      { length: string.length },
      (_, i) => (hash = (Math.imul(31, hash) + string.charCodeAt(i)) | 0),
    );
    return hash;
  };

  onMount(() => {
    const key = `learn-${quickHash(JSON.stringify({ ancestry, topic }))}`;

    if (cache[key]) {
      response = cache[key];
      return;
    }

    // Build messages with ancestry
    const messages: Message[] = [];
    for (const item of ancestry) {
      messages.push({ role: "user", content: item });
      messages.push({ role: "assistant", content: [{ type: "text", text: "[snip]" }] });
    }

    const systemPrompt = `The user is trying to learn about a subject, and you're helping them. Some guidelines:
- Don't include phrases like "Here's an overview:", "check out the page on", or unnecessary conclusions; you're not completing a task or writing articles, you're just explaining things
- Don't use lists most of the time
- Don't overuse Wikilinks
- Don't link to the current page
- Do use Wikilinks, the [[text]] or [[page|visible text]] syntax, for things that are logical to explore next
- Do use Wikilinks tastefully
- Do use Wikilinks consistently
- ALWAYS, throughout, use Wikilinks`;

    messages.push({ role: "user", content: topic });
    const allMessages: Message[] = [{ role: "system", content: systemPrompt }, ...messages];

    const readContent = (content: any[]) => {
      for (const part of content) {
        if (part.type == "text") {
          response = part.text;
        }
      }
    };

    const addMessage = <T extends Message>(base: T) =>
      new Proxy(base, {
        set(target, prop, value) {
          Reflect.set(target, prop, value);
          if (prop == "content") readContent(value);
          return true;
        },
      });

    generate(allMessages, stack, addMessage, undefined, [])
      .then(() => {
        cache[key] = response;
      })
      .catch((e) => {
        console.error("Failed to generate:", e);
      });
  });
</script>

<div class="pane" in:slide|global={{ axis: "x", duration: 500, easing: easeEmphasizedDecel }}>
  <h2>{topic}</h2>
  {#if response}
    <MFormatWikilinks text={response} {onLink} />
  {/if}
</div>

<style>
  .pane {
    display: flex;
    flex-direction: column;
    flex: none;
    width: 25rem;

    padding: 1rem;
    padding-bottom: 3rem;
    border-radius: 1rem;
    background-color: var(--m3c-surface-container-low);
    border: 1px solid var(--m3c-surface-container);
    overflow: auto;
  }
  h2 {
    @apply --m3-headline-small;
  }
</style>
