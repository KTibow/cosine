<script lang="ts">
  let {
    position = "bottom-left",
    children,
  }: {
    position?: "bottom-left" | "left" | "top-left";
    children: any;
  } = $props();
</script>

<div class="nav" class:bottom-left={position === "bottom-left"} class:left={position === "left"} class:top-left={position === "top-left"}>
  {@render children()}
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
    transition: color var(--m3-util-easing-fast);

    &.bottom-left {
      bottom: 0.5rem;
      left: 0.5rem;
    }

    &.left {
      left: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      flex-direction: column;
      height: auto;
      width: 3rem;
    }

    &.top-left {
      top: 0.5rem;
      left: 0.5rem;
    }
  }
</style>
