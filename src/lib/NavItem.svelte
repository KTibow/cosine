<script lang="ts">
  let {
    href,
    active = false,
    title,
    children,
  }: {
    href: string;
    active?: boolean;
    title?: string;
    children: any;
  } = $props();
</script>

<a {href} class:active {title}>
  {@render children()}
</a>

<style>
  a {
    display: flex;
    align-items: center;
    padding-inline: 0.25rem;
    &:first-child {
      padding-inline-start: 0.75rem;
    }
    &:last-child {
      padding-inline-end: 0.75rem;
    }
    transition: color var(--m3-util-easing-fast);
  }
  a:hover,
  a.active {
    color: rgb(var(--m3-scheme-primary));
  }
  a.active {
    pointer-events: none;
  }
</style>
