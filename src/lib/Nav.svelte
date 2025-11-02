<script lang="ts">
  import { Icon } from "m3-svelte";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";

  const pathname = window.location.pathname;
</script>

<div class="nav">
  <a href="/" class:active={pathname == "/"} title="Cosine">
    <svg width="1rem" height="1rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%" color-interpolation="linearRGB">
          <stop offset="0%" stop-color="transparent" />
          <stop offset="100%" stop-color="currentColor" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#grad)" />
    </svg>
  </a>
  <a href="/settings" class:active={pathname == "/settings"}>
    <Icon icon={iconSettings} size={16} />
  </a>
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

    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    transition: color var(--m3-util-easing-fast);
  }
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
