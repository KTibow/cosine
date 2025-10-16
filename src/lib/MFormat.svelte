<script lang="ts">
  let {
    input,
  }: {
    input: string;
  } = $props();

  const TABLE_SEPARATOR = /^\|(?: ?:?-{3,}:? ?\|)+$/m;

  const shouldJoin = (line: string, lastChunk?: { text: string; indentation: number }): boolean => {
    if (!lastChunk) return false;

    // ignore leading spaces
    const lastChunkCorrected = lastChunk.text.trimStart();
    const lineCorrected = line.trimStart();
    const lastChunkLeading = lastChunk.indentation;
    const lineLeading = line.length - lineCorrected.length;

    if (lineLeading < lastChunkLeading) return false; // indentation decreased

    const isUnclosedCode = (lastChunkCorrected.match(/```/g) || []).length == 1;
    if (isUnclosedCode) return true;

    const isUnclosedTeX = lastChunkCorrected.includes("\n")
      ? lastChunkCorrected.startsWith("$$\n") && !lastChunkCorrected.endsWith("$$")
      : lastChunkCorrected == "$$";
    if (isUnclosedTeX) return true;

    const isUnclosedTeX2 = lastChunkCorrected.includes("\n")
      ? lastChunkCorrected.startsWith("\\[\n") && !lastChunkCorrected.endsWith("\\]")
      : lastChunkCorrected == "\\[";
    if (isUnclosedTeX2) return true;

    const isTableSeparator = TABLE_SEPARATOR.test(lineCorrected);
    if (isTableSeparator) return true;

    const wasTable = TABLE_SEPARATOR.test(lastChunkCorrected);
    const isTableRow = lineCorrected.startsWith("| ") && lineCorrected.endsWith("|");
    if (wasTable && isTableRow) return true;

    return false;
  };
  const chunk = (text: string) => {
    const chunks: { text: string; indentation: number }[] = [];
    for (const line of text.split("\n")) {
      const lastChunk = chunks[chunks.length - 1];
      if (shouldJoin(line, lastChunk)) {
        chunks[chunks.length - 1].text += "\n" + line;
      } else if (line) {
        chunks.push({ text: line, indentation: line.length - line.trimStart().length });
      }
    }
    return chunks;
  };
</script>

{#each chunk(input) as { text }, i (i)}
  <p class="chunk">{text}</p>
{/each}

<style>
  .chunk {
    white-space: pre-wrap;
    border-right: solid 1px rgb(var(--m3-scheme-outline-variant));
    &:not(:first-child) {
      margin-top: 0.5em;
    }
  }
</style>
