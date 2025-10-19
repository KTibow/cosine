<script lang="ts">
  import iconCopy from "@ktibow/iconset-material-symbols/content-copy-rounded";
  import { Icon, Layer } from "m3-svelte";
  import { escape } from "./mformat-escape";

  let {
    input,
  }: {
    input: string;
  } = $props();

  const KIMI_BOX = /^[-─]{25,}\n.+\n[-─]{25,}$/;
  const KIMI_BOX_P1 = /^[-─]{25,}$/;
  const KIMI_BOX_P2 = /^[-─]{25,}\n.+$/;
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

    if (KIMI_BOX_P1.test(lastChunk.text)) return true;
    if (KIMI_BOX_P2.test(lastChunk.text) && KIMI_BOX_P1.test(lineCorrected)) return true;

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

  let hasStartedLoadingHighlight = false;
  let hasStartedLoadingMath = false;
  let highlight: (code: string, language: string) => string = $state((code) => {
    if (!hasStartedLoadingHighlight) {
      hasStartedLoadingHighlight = true;
      import("./mformat-highlight").then(({ default: hl }) => {
        highlight = hl;
      });
    }
    return escape(code);
  });
  let math: (input: string, display: boolean) => string | undefined = $state(() => {
    if (!hasStartedLoadingMath) {
      hasStartedLoadingMath = true;
      import("./mformat-math").then(({ default: mh }) => {
        math = mh;
      });
    }
    return undefined;
  });
</script>

{#each chunk(input) as { text, indentation }, i (i)}
  {@const marginLeft = indentation ? `${indentation}ch` : undefined}
  {#if text.startsWith("```")}
    {@const code = text
      .split("\n")
      .filter((line) => !line.startsWith("```"))
      .join("\n")}
    {@const language = text.split("\n")[0].slice(3).trim()}
    <div class="chunk code-block" style:margin-left={marginLeft}>
      <pre>{@html highlight(code, language)}</pre>
      <button class="copy" onclick={() => navigator.clipboard.writeText(code)}>
        <Layer />
        <Icon icon={iconCopy} />
      </button>
    </div>
  {:else if text.startsWith("\\[\n") || text.startsWith("$$\n")}
    {@const inner = text
      .slice(3)
      .replace(/\n\\]$|\n\$\$$/, "")
      .trim()}
    {@const rendered = math(inner, true)}
    {#if rendered}
      {@html rendered.replace(
        "<math",
        `<math class="chunk" style="margin-left: ${marginLeft || 0};"`,
      )}
    {:else}
      <p class="chunk pre-wrap" style:margin-left={marginLeft}>{text}</p>
    {/if}
  {:else if /^(#+) (.+)$/.test(text)}
    {@const [, hashes, content] = text.match(/^(#+) (.+)$/)!}
    <svelte:element this={`h${hashes.length}`} class="chunk" style:margin-left={marginLeft}>
      {content.replaceAll("**", "")}
    </svelte:element>
  {:else if KIMI_BOX.test(text)}
    {@const content = text.split("\n").slice(1, -1).join("\n")}
    <h2 class="chunk box">{content}</h2>
  {:else if TABLE_SEPARATOR.test(text)}
    {@const grid = text
      .split("\n")
      .filter((line) => !TABLE_SEPARATOR.test(line))
      .map((line) =>
        line
          .replace(/^\| /, "")
          .replace(/\|$/, "")
          .split("| ")
          .map((x) => x.trimEnd()),
      )}
    <table class="chunk" style:margin-left={marginLeft}>
      <tbody>
        {#each grid as row, rowIndex}
          <tr>
            {#each row as cell}
              <svelte:element this={rowIndex === 0 ? "th" : "td"} class="pre-wrap"
                >{cell}</svelte:element
              >
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="chunk pre-wrap" style:margin-left={marginLeft}>{text}</p>
  {/if}
{/each}

<style>
  :global(.chunk) {
    &:not(:first-child) {
      margin-top: 0.5em;
    }
  }

  .pre-wrap {
    white-space: pre-wrap;
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

  h1 {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.1;
  }
  h2:not(.box) {
    font-size: 2rem;
    line-height: 1.2;
  }
  h3 {
    font-size: 1.5rem;
    line-height: 1.3;
    opacity: 0.8;
  }
  h4 {
    font-size: 1.25rem;
    line-height: 1.4;
    opacity: 0.65;
  }
  h5 {
    opacity: 0.5;
  }
  h6 {
    opacity: 0.4;
  }

  .box {
    border: 0.15ch solid currentColor;
    border-radius: 0.6ch;
    padding: 0.6ch 0.8ch;

    max-width: max-content;
    margin-top: 1em;
  }

  table {
    border-spacing: 0;
    font-feature-settings: "tnum";
  }
  th,
  td {
    border-radius: 0.5rem;
    padding: 0.5rem;
    margin: 0;
    text-align: start;
    font-weight: 400;
  }
  th {
    background-color: rgb(var(--m3-scheme-surface-container-highest));
  }
  td {
    background-color: rgb(var(--m3-scheme-surface-container));
  }
</style>
