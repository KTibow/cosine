<script lang="ts">
  import iconCopy from "@ktibow/iconset-material-symbols/content-copy-rounded";
  import { Icon, Layer } from "m3-svelte";
  import { escape } from "./mformat-escape";

  let {
    input,
  }: {
    input: string;
  } = $props();

  const TABLE_SEPARATOR = /^\|(?: ?:?-{3,}:? ?\|)+$/m;

  const shouldJoin = (
    lineCorrected: string,
    lineIndentation: number,
    lastChunk: { text: string; indentation: number },
  ): boolean => {
    const indentationDiff = lineIndentation - lastChunk.indentation;
    if (indentationDiff < 0) return false; // decrease

    const isUnclosedCode = (lastChunk.text.match(/```/g) || []).length == 1;
    if (isUnclosedCode) return true;

    const isUnclosedTeX = lastChunk.text.includes("\n")
      ? lastChunk.text.startsWith("$$\n") && !lastChunk.text.endsWith("$$")
      : lastChunk.text == "$$";
    if (isUnclosedTeX) return true;

    const isUnclosedTeX2 = lastChunk.text.includes("\n")
      ? lastChunk.text.startsWith("\\[\n") && !lastChunk.text.endsWith("\\]")
      : lastChunk.text == "\\[";
    if (isUnclosedTeX2) return true;

    const isTableSeparator = TABLE_SEPARATOR.test(lineCorrected);
    if (indentationDiff == 0 && isTableSeparator) return true;

    const wasTable = TABLE_SEPARATOR.test(lastChunk.text);
    const isTableRow = lineCorrected.startsWith("| ") && lineCorrected.endsWith("|");
    if (indentationDiff == 0 && wasTable && isTableRow) return true;

    return false;
  };
  const chunk = (text: string) => {
    const chunks: { text: string; indentation: number }[] = [];
    for (const line of text.split("\n")) {
      const lineCorrected = line.trimStart();
      const indentation = line.length - lineCorrected.length;

      const lastChunk = chunks[chunks.length - 1];
      if (lastChunk && shouldJoin(lineCorrected, indentation, lastChunk)) {
        const indentationToAdd = " ".repeat(indentation - lastChunk.indentation);
        chunks[chunks.length - 1].text += "\n" + indentationToAdd + line;
      } else if (lineCorrected) {
        chunks.push({ text: lineCorrected, indentation });
      }
    }
    return chunks;
  };

  let loadHighlightRunning = false;
  const loadHighlight = async () => {
    if (loadHighlightRunning) return;
    try {
      loadHighlightRunning = true;
      ({ default: highlight } = await import("./mformat-highlight"));
    } finally {
      loadHighlightRunning = false;
    }
  };
  let highlight: (code: string, language: string) => string = $state(
    (code: string, language: string) => {
      loadHighlight();
      return escape(code);
    },
  );
</script>

{#each chunk(input) as { text, indentation }, i (i)}
  {#if text.startsWith("```")}
    {@const code = text
      .split("\n")
      .filter((line) => !line.startsWith("```"))
      .join("\n")}
    {@const language = text.split("\n")[0].slice(3).trim()}
    <div class="chunk code-block" style:margin-left="{indentation}ch">
      <pre>{@html highlight(code, language)}</pre>
      <button class="copy" onclick={() => navigator.clipboard.writeText(code)}>
        <Layer />
        <Icon icon={iconCopy} />
      </button>
    </div>
  {:else}
    <p class="chunk" style:margin-left="{indentation}ch">{text}</p>
  {/if}
{/each}

<style>
  .chunk {
    white-space: pre-wrap;
    border-right: solid 1px rgb(var(--m3-scheme-outline-variant));
    &:not(:first-child) {
      margin-top: 0.5em;
    }
  }

  .code-block {
    display: flex;
    flex-direction: column;

    background: rgb(var(--m3-scheme-surface-container-low));
    border-radius: 0.5rem;
    position: relative;

    pre {
      margin: 0;
      padding: 1rem;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .copy {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;

      position: absolute;
      inset: 0 0 0 auto;
      background: rgb(var(--m3-scheme-surface-container-highest));
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .copy {
      opacity: 1;
    }
  }
</style>
