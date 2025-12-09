<script lang="ts">
  import { Button } from "m3-svelte";
  import { completeSync, getStorage } from "monoidentity";
  import { tick } from "svelte";

  const config = getStorage("config");
  const useToken = async (token: string) => {
    if (!token) return;

    config.providers = { ...config.providers, hcai: { token } };
    await completeSync();

    location.href = "/";
  };
</script>

<div class="instructions">
  <p>
    Get your API key from Hack Club AI. You'll need a Hack Club Slack account to access the
    service.
  </p>
  <Button href="https://hackclub.com/ai" target="_blank"
    >Click this to learn more about Hack Club AI</Button
  >
  <input
    placeholder="Paste your API key here"
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
