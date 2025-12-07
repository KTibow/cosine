<script lang="ts">
  let { text, onLink }: { text: string; onLink: (target: string) => void } = $props();
</script>

{#each text.split("\n").filter(Boolean) as line}
  <p>
    {#each line
      .split(/(\[\[[^,[\]]+?\]\])|(\*\*.+?\*\*)|((?<!\*)\*(?! ).+?\*(?!\*))/g)
      .filter(Boolean) as part}
      {#if part.startsWith("[[") && part.endsWith("]]")}
        {@const target = part.slice(2, -2).split("|").at(0)?.trim() ?? ""}
        {@const content = part.slice(2, -2).split("|").at(-1)?.trim() ?? ""}
        <button onclick={() => onLink(target)}>{content}</button>
      {:else if part.startsWith("**") && part.endsWith("**")}
        {@const content = part.slice(2, -2)}
        <strong>{content}</strong>
      {:else if part.startsWith("*") && part.endsWith("*")}
        {@const content = part.slice(1, -1)}
        <em>{content}</em>
      {:else}
        {part}
      {/if}
    {/each}
  </p>
{/each}

<style>
  p {
    margin-top: 1em;
  }
  button {
    color: var(--m3c-primary);
    text-align: left;
    user-select: auto;
    cursor: pointer;
  }
</style>
