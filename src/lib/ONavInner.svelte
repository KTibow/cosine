<script lang="ts">
  import { Icon } from "m3-svelte";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";

  const pathname = window.location.pathname;
</script>

<a href="/" class:active={pathname == "/"} title="Cosine">
  <svg width="1rem" height="1rem" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%" color-interpolation="linearRGB">
        <stop offset="0%" stop-color="transparent" />
        <stop offset="100%" stop-color="currentColor" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#grad)" />
  </svg>
</a>
<a href="/code" class:active={pathname == "/code"} title="Code">
  <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M3.2 20c-.6 0-1.1-.6-1.2-1.1 0-.6.3-1 .4-1.6.7-2.9 1.1-5.9 2-8.8.2-.5.3-1.2.8-1.5.5-.2 1-.2 1.4 0 .5.4.4 1 .2 1.6-.5 1.7-1 3.5-1.3 5.2l-1 4c2.6 0 5.2.3 7.8.4l2.5-.1c.5 0 1 .1 1.1.7 0 .6-.4 1.1-1 1.3-1 .5-2.3.4-3.5.4L4 20zM20.8 4c.6 0 1.1.5 1.2 1.1 0 .5-.3 1-.4 1.6-.6 2.6-1 5.2-1.7 7.8-.2.7-.4 1.5-.8 2.2-.3.5-.9.5-1.3.4-.6-.1-.8-.7-.7-1.2.1-.9.4-1.7.6-2.5l1.8-7.1c-2.8 0-5.6-.4-8.4-.5-.8 0-1.6.2-2.4 0-.6 0-.8-.7-.5-1.2.3-.6 1-.9 1.7-1 1.2-.2 2.4 0 3.6 0 2 0 4 .3 6 .4z"
    />
  </svg>
</a>
<a href="/settings" class:active={pathname == "/settings"}>
  <Icon icon={iconSettings} size={16} />
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
    transition: color var(--m3-easing-fast);
  }
  a:hover,
  a.active {
    color: var(--m3c-primary);
  }
</style>
