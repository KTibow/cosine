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

  const classifyChunk = (s: string) => {
    if (!s.trim()) return "blank";
    if (s.startsWith("```")) return "code";
    if (s.startsWith("\\[") || s.startsWith("$$")) return "tex";
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
      lastType == "tex" &&
      (lastChunk.text.match(/\$\$/g) || []).length < 2 &&
      !lastChunk.text.trim().endsWith("\\]");
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

  const parseInline = (chunk: string): string[] => {
    type Bit = { text: string; bold: boolean; italic: boolean; code: boolean };
    let bits: Bit[] = [];

    const prepare = (regex: RegExp) => {
      const isText = (char: string) =>
        /\p{Emoji}/u.test(char) || /\p{L}/u.test(char) || '0123456789.:!?$§`"'.includes(char);
      const isStartText = (char: string) => "“[(".includes(char);
      const isEndText = (char: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹°%,])”".includes(char);
      const output: {
        lastDisabled: boolean;
        lastEmpty: boolean;
        lastText: boolean;
        nextText: boolean;
        bit: string;
      }[] = [];
      const estBits = chunk.split(regex).filter(Boolean);
      for (let i = 0; i < estBits.length; i++) {
        const lastChar = i == 0 ? "" : estBits[i - 1].at(-1);
        const nextChar = i == estBits.length - 1 ? "" : estBits[i + 1][0];
        output.push({
          lastDisabled: lastChar == "\\",
          lastEmpty: !lastChar || !isText(lastChar),
          lastText: isText(lastChar!) || isEndText(lastChar!),
          nextText: isText(nextChar!) || isStartText(nextChar!),
          bit: estBits[i],
        });
      }
      return output;
    };

    let boldOn = false;
    let italicOn = false;
    let codeOn = false;
    for (const { lastDisabled, lastEmpty, lastText, nextText, bit } of prepare(/(\*+|_|`)/g)) {
      const _baseline = () => {
        if (lastDisabled) {
          bits[bits.length - 1].text = bits[bits.length - 1].text.replace(/\\$/, "");
          return false;
        }
        return true;
      };
      const baseline = () => {
        if (codeOn) return false;
        return _baseline();
      };
      const baselineAlt = () => {
        if (!codeOn) return false;
        return _baseline();
      };
      if (bit == "`" && baselineAlt()) {
        codeOn = false;
        continue;
      }
      if (bit == "`" && baseline()) {
        codeOn = true;
        continue;
      }
      if (bit == "***" && baseline() && italicOn && boldOn && lastText) {
        italicOn = false;
        boldOn = false;
        continue;
      }
      if (bit == "***" && baseline() && !italicOn && !boldOn && nextText) {
        italicOn = true;
        boldOn = true;
        continue;
      }
      if (bit == "**" && baseline() && boldOn && lastText) {
        boldOn = false;
        continue;
      }
      if (bit == "**" && baseline() && !boldOn && nextText) {
        boldOn = true;
        continue;
      }
      if (bit == "*" && baseline() && italicOn && lastText) {
        italicOn = false;
        continue;
      }
      if (bit == "_" && baseline() && italicOn && lastText) {
        italicOn = false;
        continue;
      }
      if (bit == "*" && baseline() && !italicOn && nextText) {
        italicOn = true;
        continue;
      }
      if (bit == "_" && baseline() && !italicOn && lastEmpty && nextText) {
        italicOn = true;
        continue;
      }
      bits.push({ text: bit, bold: boldOn, italic: italicOn, code: codeOn });
    }

    bits = bits.reduce((mergedBits, bit) => {
      const prevBit = mergedBits[mergedBits.length - 1];
      if (
        prevBit &&
        prevBit.bold === bit.bold &&
        prevBit.italic === bit.italic &&
        prevBit.code === bit.code
      ) {
        prevBit.text += bit.text;
        return mergedBits;
      } else {
        return [...mergedBits, { ...bit }];
      }
    }, [] as Bit[]);

    const unescape = (s: string) =>
      s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    const wrap = (content: string, bold: boolean, italic: boolean, code: boolean) => {
      if (code) content = `<code>${content}</code>`;
      if (bold) content = `<b>${content}</b>`;
      if (italic) content = `<i>${content}</i>`;
      return content;
    };

    const segments: string[] = [];

    for (const bit of bits) {
      const { bold, italic, code } = bit;

      if (code) {
        segments.push(wrap(escape(bit.text), bold, italic, code));
        continue;
      }

      // Tokenize using named-group regex to keep single-pass, deterministic parsing.
      const parts = [
        String.raw`\[(?<linkLabel>[^\]]+?)\]\((?<linkHref>[^)]+?)\)`,
        String.raw`(?<url>\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]\s])`,
        String.raw`(?<br><br\s*\/?>)`,
        String.raw`(?<!\$)\$(?!\s)(?<texInline>[^$]+?)(?<!\s)\$(?!\$)(?![0-9])`,
        String.raw`\\\((?<texParens>[\s\S]+?)\\\)`,
      ];
      const rx = new RegExp(parts.join("|"), "gu");

      const text = bit.text;
      let lastIndex = 0;

      for (const m of text.matchAll(rx)) {
        const idx = m.index ?? 0;

        if (idx > lastIndex) {
          segments.push(wrap(escape(text.slice(lastIndex, idx)), bold, italic, false));
        }

        const g = m.groups || ({} as Record<string, string | undefined>);

        if (g.linkLabel) {
          segments.push(
            wrap(
              `<a href="${escape(g.linkHref!)}" target="_blank">${escape(g.linkLabel!)}</a>`,
              bold,
              italic,
              false,
            ),
          );
        } else if (g.url) {
          segments.push(
            wrap(
              `<a href="${escape(g.url)}" target="_blank">${escape(g.url)}</a>`,
              bold,
              italic,
              false,
            ),
          );
        } else if (g.br) {
          // keep raw <br>
          segments.push("<br>");
        } else if (g.texInline || g.texParens) {
          const expr = unescape(g.texInline ?? g.texParens ?? "");
          const html = math(expr, false);
          if (html) {
            segments.push(wrap(html, bold, italic, false));
          } else {
            segments.push(wrap(escape(m[0]), bold, italic, false));
          }
        }

        lastIndex = idx + (m[0]?.length ?? 0);
      }

      if (lastIndex < text.length) {
        segments.push(wrap(escape(text.slice(lastIndex)), bold, italic, false));
      }
    }

    return segments;
  };
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
    {@const inner = text.trimEnd().slice(2, -2).trim()}
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
    <svelte:element this={`h${hashes.length}`} class="chunk pre-wrap" style:margin-left={marginLeft}
      >{#each parseInline(content) as html}{@html html}{/each}</svelte:element
    >
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
            {#each row as cell, cellIndex (cellIndex)}
              <svelte:element this={rowIndex == 0 ? "th" : "td"} class="pre-wrap"
                >{#each parseInline(cell) as html}{@html html}{/each}</svelte:element
              >
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <!-- prettier-ignore -->
    <p class="chunk pre-wrap" style:margin-left={marginLeft}>{#each parseInline(text) as html}{@html html}{/each}</p>
  {/if}
{/each}

<style>
  :global(.chunk) {
    &:not(:first-child) {
      margin-top: 0.5em;
    }

    :global(a) {
      color: var(--m3c-primary);
    }
  }

  .pre-wrap {
    white-space: pre-wrap;
  }

  .code-block {
    display: flex;
    flex-direction: column;
    background: var(--m3c-surface-container-low);
    border-radius: 0.5rem;
    position: relative;

    pre {
      margin: 0;
      padding: 1rem;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
    }

    .copy {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      position: absolute;
      inset: 0 0 0 auto;
      background: var(--m3c-surface-container-highest);
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
    background-color: var(--m3c-surface-container-highest);
  }
  td {
    background-color: var(--m3c-surface-container);
  }
</style>
