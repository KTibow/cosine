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

    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    &:not(:hover) {
      color: rgb(var(--m3-scheme-on-surface-variant));
    }
    border-radius: var(--m3-util-rounding-full);

    position: fixed;
    bottom: 0.5rem;
    left: 0.5rem;
    transition: color var(--m3-util-easing-fast);
  }
</style>
