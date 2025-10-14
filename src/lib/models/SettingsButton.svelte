<script>
  import { Icon, Layer } from "m3-svelte";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";
</script>

<a href="/settings">
  <Layer />
  <Icon icon={iconSettings} size={20} />
</a>

<style>
  a {
    display: flex;
    width: 3rem;
    height: 3rem;
    border-radius: var(--m3-util-rounding-full);
    align-items: center;
    justify-content: center;

    color: rgb(var(--m3-scheme-outline));
    outline: solid 1px currentColor;
    outline-offset: -1px;

    position: relative;
  }
</style>
