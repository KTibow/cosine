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

  // Simple classifier to identify chunk/line type
  const classifyChunk = (s: string) => {
    if (!s.trim()) return "blank";
    if (s.startsWith("```")) return "code";
    if (s.startsWith("\\[\n") || s.startsWith("$$\n")) return "tex";
    if (s == "\\[" || s == "$$") return "tex-start";
    if (/^(#+) (.+)$/.test(s)) return "header";
    if (KIMI_BOX.test(s)) return "kbox";
    if (TABLE_SEPARATOR.test(s)) return "table";
    if (s.startsWith("| ") && s.trimEnd().endsWith("|")) return "table-row";
    return "text";
  };

  const shouldJoin = (
    lineCorrected: string,
    lineIndentation: number,
    lastChunk: { text: string; indentation: number },
  ): boolean => {
    const indentationDiff = lineIndentation - lastChunk.indentation;
    if (indentationDiff < 0) return false; // decrease

    const lastType = classifyChunk(lastChunk.text);
    const currType = classifyChunk(lineCorrected);

    // 1) Join with unclosed constructs first
    const isUnclosedCode =
      lastType == "code" && (lastChunk.text.match(/```/g) || []).length % 2 == 1;
    if (isUnclosedCode) return true;

    const isUnclosedTeX =
      (lastChunk.text.startsWith("$$\n") && !lastChunk.text.trim().endsWith("$$")) ||
      (lastChunk.text.startsWith("\\[\n") && !lastChunk.text.trim().endsWith("\\]")) ||
      lastType == "tex-start";
    if (isUnclosedTeX) return true;

    if (KIMI_BOX_P1.test(lastChunk.text)) return true;
    if (KIMI_BOX_P2.test(lastChunk.text) && KIMI_BOX_P1.test(lineCorrected)) return true;

    if (indentationDiff == 0 && currType == "table") return true;
    if (
      indentationDiff == 0 &&
      (lastType == "table" || lastType == "table-row") &&
      currType == "table-row"
    )
      return true;

    // 2) Join plain text
    return lastType == "text" && currType == "text";
  };

  type Chunk = { text: string; indentation: number };
  const chunk = (text: string) => {
    console.debug({ text });
    const chunks: (Chunk | undefined)[] = [];
    for (const line of text.split("\n")) {
      const lineCorrected = line.trimStart();
      const indentation = line.length - lineCorrected.length;

      const lastChunk = chunks[chunks.length - 1];
      if (lastChunk && shouldJoin(lineCorrected, indentation, lastChunk)) {
        const indentationToAdd = " ".repeat(indentation - lastChunk.indentation);
        lastChunk.text += "\n" + indentationToAdd + lineCorrected;
      } else {
        chunks.push(lineCorrected ? { text: lineCorrected, indentation } : undefined);
      }
    }
    return chunks.filter((c): c is Chunk => c != undefined);
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
  {@const type = classifyChunk(text)}
  {#if type == "code"}
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
  {:else if type == "tex"}
    {@const inner = text.trim().slice(3, -3)}
    {@const rendered = math(inner, true)}
    {#if rendered}
      {@html rendered.replace(
        "<math",
        `<math class="chunk" style="margin-left: ${marginLeft || 0};"`,
      )}
    {:else}
      <p class="chunk pre-wrap" style:margin-left={marginLeft}>{text}</p>
    {/if}
  {:else if type == "header"}
    {@const [, hashes, content] = text.match(/^(#+) (.+)$/)!}
    <svelte:element this={`h${hashes.length}`} class="chunk" style:margin-left={marginLeft}>
      {content.replaceAll("**", "")}
    </svelte:element>
  {:else if type == "kbox"}
    {@const content = text.split("\n").slice(1, -1).join("\n")}
    <h2 class="chunk box">{content}</h2>
  {:else if type == "table"}
    {@const grid = text
      .split("\n")
      .filter((line) => !TABLE_SEPARATOR.test(line))
      .map((line) =>
        line
          .replace(/^\| /, "")
          .replace(/\|$/, "")
          .split(/(?<!\\)\| /)
          .map((x) => x.trimEnd()),
      )}
    <table class="chunk" style:margin-left={marginLeft}>
      <tbody>
        {#each grid as row, rowIndex}
          <tr>
            {#each row as cell}
              <svelte:element this={rowIndex == 0 ? "th" : "td"} class="pre-wrap"
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
