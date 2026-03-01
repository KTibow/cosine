<script lang="ts">
  let { token }: { token: string } = $props();

  const getLimits = async () => {
    const r = await fetch('https://api.github.com/copilot_internal/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data: {
      quota_snapshots: Record<
        string,
        { percent_remaining: number; unlimited: boolean; quota_id: string }
      >;
      quota_reset_date_utc: string;
    } = await r.json();
    return data;
  };
</script>

{#await getLimits()}
  <p>Loading</p>
{:then { quota_snapshots, quota_reset_date_utc }}
  {@const resetDate = new Date(quota_reset_date_utc)}
  {@const timeToReset = resetDate.getTime() - Date.now()}
  {#each Object.values(quota_snapshots).filter((limit) => !limit.unlimited) as limit}
    {@const name = limit.quota_id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    <p>{name}: {limit.percent_remaining.toFixed(1)}% remaining</p>
  {/each}
  <p>
    Resets in
    {#if timeToReset <= 24 * 60 * 60 * 1000}
      {Math.ceil(timeToReset / (1000 * 60 * 60))} hours
    {:else}
      {Math.ceil(timeToReset / (24 * 60 * 60 * 1000))} days
    {/if}
  </p>
{:catch error}
  {@const message = error instanceof Error ? error.message : String(error)}
  <p>Error loading limits</p>
  <pre>{message}</pre>
{/await}
