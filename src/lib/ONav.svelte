<script lang="ts">
  import { Icon } from "m3-svelte";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";
  import iconCode from "@ktibow/iconset-material-symbols/code-rounded";
  import NavHolder from "./NavHolder.svelte";
  import NavItem from "./NavItem.svelte";

  const pathname = window.location.pathname;
</script>

<NavHolder position="bottom-left">
  <NavItem href="/" active={pathname == "/"} title="Cosine">
    <svg width="1rem" height="1rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%" color-interpolation="linearRGB">
          <stop offset="0%" stop-color="transparent" />
          <stop offset="100%" stop-color="currentColor" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#grad)" />
    </svg>
  </NavItem>
  <NavItem href="/settings" active={pathname == "/settings"}>
    <Icon icon={iconSettings} size={16} />
  </NavItem>
  <NavItem href="/code" active={pathname == "/code"} title="Code">
    <Icon icon={iconCode} size={16} />
  </NavItem>
</NavHolder>
