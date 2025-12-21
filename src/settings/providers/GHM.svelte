<script lang="ts">
  import { Button } from "m3-svelte";
  import GitHubWarning from "./_GitHubWarning.svelte";
  import { getStorage } from "monoidentity";
  import { tick } from "svelte";

  const config = getStorage("config");
  const useToken = async (token: string) => {
    if (!token) return;

    config.providers = { ...config.providers, ghm: { token } };
    await config.sync("providers");

    location.href = "/";
  };
</script>

<div class="instructions">
  <GitHubWarning />
  <Button
    href="https://github.com/settings/personal-access-tokens/new?description=This+connects+GHM+to+Cosine.&name=Cosine+token&user_models=read"
    target="_blank">Click this, choose "no expiration", and copy the PAT</Button
  >
  <input
    placeholder="then paste the PAT here"
    onpaste={(e) => {
      const input = e.currentTarget;
      tick().then(() => useToken(input.value));
    }}
  />
</div>

<style>
  .instructions {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 25rem;
    gap: 1rem;
    margin: auto;
  }
  input {
    display: flex;
    height: 3rem;
    padding-inline: 0.75rem;
    border-radius: var(--m3-shape-small);
    background-color: var(--m3c-surface-container);
    align-self: stretch;
  }
</style>
