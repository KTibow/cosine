<script lang="ts">
  let {
    input,
  }: {
    input: string;
  } = $props();
</script>

{#each input.split("\n") as text}
  <p>
    {#each text.split(/(\*\*.+?\*\*)/g).filter(Boolean) as part}
      {#if part.startsWith("**") && part.endsWith("**")}
        {@const content = part.slice(2, -2)}
        <strong>{content}</strong>
      {:else}
        {part}
      {/if}
    {/each}
  </p>
{/each}
