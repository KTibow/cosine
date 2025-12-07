<script lang="ts">
  import ONavInner from "./ONavInner.svelte";
</script>

<div class="nav">
  <ONavInner />
</div>

<style>
  .nav {
    display: flex;
    height: 3rem;

    background-color: var(--m3c-surface-container-lowest);
    &:not(:hover) {
      color: var(--m3c-on-surface-variant);
    }
    border-radius: var(--m3-shape-full);

    position: fixed;
    bottom: 0.5rem;
    left: 0.5rem;
    transition: color var(--m3-easing-fast);
  }
</style>
