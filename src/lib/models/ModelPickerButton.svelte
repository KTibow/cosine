<script lang="ts">
  import { Layer } from "m3-svelte";

  let {
    model,
    bottomRight = false,
    isOpen = false,
    onOpen,
  }: {
    model: string;
    bottomRight?: boolean;
    isOpen?: boolean;
    onOpen: () => void;
  } = $props();
</script>

<button
  class="chooser"
  class:bottomRight
  onpointerdown={onOpen}
  style:opacity={isOpen ? 0 : undefined}
>
  <Layer />
  {model}
</button>

<style>
  .chooser {
    display: flex;
    height: 3rem;
    padding-inline: 1rem;
    border-radius: var(--m3-util-rounding-full);
    align-items: center;

    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    color: rgb(var(--m3-scheme-on-surface-variant));

    position: relative;

    &.bottomRight {
      position: fixed;
      bottom: 0.5rem;
      right: 0.5rem;
    }
  }
</style>
