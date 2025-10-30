<script module>
  import { writable } from "svelte/store";

  const persistentState = writable({
    selectionStart: 0,
    selectionEnd: 0,
    hasFocus: false,
  });

  export const omniContent = writable("");
</script>

<script lang="ts">
  import iconSend from "@ktibow/iconset-material-symbols/send-rounded";
  import iconStop from "@ktibow/iconset-material-symbols/stop-rounded";
  import { onMount, tick } from "svelte";
  import { Icon, Layer } from "m3-svelte";
  import { isHotkey } from "./focus";

  let {
    abort,
    submit = (_) => {},
  }: { abort?: () => void; animate: boolean; submit?: (text: string) => void } = $props();
  let field: HTMLTextAreaElement;
  let usedContents = $derived(abort ? "" : $omniContent.trim());

  let innerWidth: number | undefined = $state();
  let isSmall = $derived(innerWidth && innerWidth < 60 * 16);

  const resize = (node: HTMLElement) => {
    $effect(() => {
      $omniContent;
      node.style.height = "auto";
      node.style.height = node.scrollHeight + "px";
    });
  };

  onMount(() => {
    tick().then(() => {
      const url = new URL(window.location.href);
      const query = url.searchParams.get("q");

      if (query) {
        // Submit and clean q
        submit(query);
        url.searchParams.delete("q");
        window.history.replaceState({}, "", url.toString());
      }
    });

    // Restore state after mount
    const state = $persistentState;
    if (field && state) {
      field.selectionStart = state.selectionStart;
      field.selectionEnd = state.selectionEnd;
      if (state.hasFocus) {
        field.focus();
      }
    }
  });

  // Handle focus changes
  function handleFocus() {
    $persistentState = { ...$persistentState, hasFocus: true };
  }

  function handleBlur() {
    $persistentState = { ...$persistentState, hasFocus: false };
  }

  // Handle selection changes
  function handleSelect() {
    $persistentState = {
      ...$persistentState,
      selectionStart: field.selectionStart,
      selectionEnd: field.selectionEnd,
    };
  }
</script>

<svelte:window
  bind:innerWidth
  onkeydown={(e) => {
    if (!isHotkey(e)) return;
    field.focus();
  }}
/>

<textarea
  class="focus-none"
  placeholder={isSmall ? "Type something" : "Type something, anything"}
  rows="2"
  use:resize
  bind:this={field}
  bind:value={$omniContent}
  onfocus={handleFocus}
  onblur={handleBlur}
  onselect={handleSelect}
  oninput={handleSelect}
  onkeypress={(e) => {
    const contents = usedContents;
    if (e.key == "Enter" && !e.shiftKey && contents) {
      e.preventDefault();
      $omniContent = "";
      submit(contents);
    }
  }}
></textarea>
{#if abort}
  <button class="focus-none" onclick={abort}>
    <Layer />
    <Icon icon={iconStop} />
  </button>
{/if}
<button
  class="focus-none"
  disabled={!usedContents}
  onclick={() => {
    const contents = usedContents;
    $omniContent = "";
    submit(contents);
  }}
>
  <Layer />
  <Icon icon={iconSend} />
</button>

<style>
  textarea {
    padding: 0.5rem 3rem 0.5rem 1rem;
    resize: none;
    flex: 1;
    min-width: 0;
  }
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    border-radius: 1.5rem;
    color: rgb(var(--m3-scheme-primary));

    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;

    transition: var(--m3-util-easing);

    &:disabled {
      opacity: 0;
      visibility: hidden;
    }
  }
</style>
