<script lang="ts">
  import { Button, Icon } from "m3-svelte";
  import { onward } from "kreations";
  import GitHubWarning from "./_GitHubWarning.svelte";
  import authRemote from "./ghc-auth.remote";
  import pollRemote from "./ghc-poll.remote";
  import { getStorage } from "monoidentity";

  const config = getStorage("config");

  const poll = async (device_code: string, expires_in: number, interval: number) => {
    for (let elapsed = 0; elapsed < expires_in; elapsed += interval) {
      await new Promise((r) => setTimeout(r, interval));
      const result = await pollRemote(device_code);
      if ("access_token" in result) {
        config.providers = { ...config.providers, ghc: { token: result.access_token } };
        await config.sync("providers");

        location.href = "/";
        break;
      }
    }
  };
</script>

{#await authRemote()}
  <Icon icon={onward} size={48} style="margin:auto" />
{:then auth}
  <div class="instructions">
    <GitHubWarning />
    <Button
      href={auth.verification_uri}
      target="_blank"
      onclick={() => {
        navigator.clipboard.writeText(auth.user_code);
        poll(auth.device_code, auth.expires_in * 1000, auth.interval * 1000);
      }}>Click this, then paste and allow</Button
    >
  </div>
{/await}

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
</style>
