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
  import { onMount } from "svelte";
  import { Icon, Layer } from "m3-svelte";
  import { isHotkey } from "./focus";

  const iconStopAnimated = {
    width: 24,
    height: 24,
    body: `<rect x="6" width="12" rx="2" ry="2" fill="currentColor">
<animate attributeName="y" values="18; 6; 6" calcMode="spline" dur="2s" keySplines="0.1 0.8 0.2 1; 0.1 0.8 0.2 1" keyTimes="0; 0.8; 1" repeatCount="indefinite" begin="-0.4s"></animate>
<animate attributeName="height" values="0; 12; 0" calcMode="spline" dur="2s" keySplines="0.1 0.8 0.2 1; 0.1 0.8 0.2 1" keyTimes="0; 0.8; 1" repeatCount="indefinite" begin="-0.4s"></animate>
</rect>`,
  };
  let {
    abort,
    animate,
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

  // Restore state after mount
  onMount(() => {
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
    <Icon icon={animate ? iconStopAnimated : iconStop} />
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
