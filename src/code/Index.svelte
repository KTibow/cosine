<script lang="ts">
  import iconDashboard from "@ktibow/iconset-material-symbols/dashboard-rounded";
  import iconCode from "@ktibow/iconset-material-symbols/code-rounded";
  import iconSend from "@ktibow/iconset-material-symbols/send-rounded";
  import iconStop from "@ktibow/iconset-material-symbols/stop-rounded";
  import iconArrowDropDown from "@ktibow/iconset-material-symbols/arrow-drop-down-rounded";
  import { Icon, Layer } from "m3-svelte";
  import ONavInner from "/lib/ONavInner.svelte";
  import ModelPickerLogic from "/lib/models/ModelPickerLogic.svelte";
  import ModelPickerMenu from "/lib/models/ModelPickerMenu.svelte";
  import generate from "/lib/generate";
  import type { AssistantPart, Message, Stack } from "/lib/types";
  import { omniContent } from "/lib/OInput.svelte";
  import { isHotkey } from "/lib/focus";

  let html = $state("");
  let thoughts = $state("");
  let tab = $state<"placeholder" | "output" | "input">("placeholder");
  let stack: Stack = $state([]);
  let model = $state("Kimi K2");
  let aborter: AbortController | undefined = $state();
  let choosingSince: number | undefined = $state();

  const abort = () => {
    aborter?.abort();
    aborter = undefined;
  };

  const wrap = async (code: () => Promise<void>) => {
    try {
      aborter = new AbortController();
      await code();
    } finally {
      aborter = undefined;
      thoughts = "";
    }
  };

  const submit = async (prompt: string, isClick: boolean) =>
    wrap(async () => {
      if (tab == "placeholder") {
        tab = "output";
      }

      const messages: Message[] = [];
      messages.push({
        role: "system",
        content: `## CRITICAL OUTPUT RULES (READ FIRST)
- ONLY output a complete HTML document, nothing else before or after
- Include ALL code inline - no placeholders, no "// rest of code here"
- Support dark mode with @media (prefers-color-scheme: dark)
- Links can use "sim://[url]" format when appropriate (wikis/reference, not games)

## Design Approach

**Match your effort to the request's scope:**
- Simple utility? → Clean, functional, well-styled
- Creative project? → Bold aesthetic choices
- Game/interactive? → Smooth feel, satisfying feedback
- Visualization? → Clear data hierarchy, smart defaults
- Simulation/replica? → Prioritize fidelity to original, realistic details, sim:// links

**Core Principles:**
1. **Avoid generic AI aesthetics** - No Arial/Roboto, no blue-purple gradients, no Bootstraplike layouts
2. **Choose a cohesive vibe** - Pick fonts (preferably webfonts, there are so many out there (even Google Sans Flex is on Google Fonts these days), otherwise system-ui), colors, spacing that work together as a system
3. **Make it feel designed** - Typography, color, motion, layout all support the purpose
4. **Functional first** - Pretty but broken is worse than plain but working

**For interfaces:** Focus on typography, color systems, purposeful animation, spatial composition

**For games:** Prioritize game feel (easing, feedback, particles), visual style commitment, sound when possible, 60fps smoothness

**For utilities:** Clarity, real-time feedback, visual data representation, smart input controls, readable outputs, helpful defaults

**Remember:** A simple request deserves a well-executed solution. A creative request deserves creative risks. Read the user's intent.`,
      });
      if (html) {
        messages.push({
          role: "user",
          content: "[Prompt omitted]",
        });
        messages.push({
          role: "assistant",
          content: [{ type: "text", text: html }],
        });
      }
      messages.push({
        role: "user" as const,
        content: isClick
          ? `Simulate the page "${prompt}".`
          : html
            ? `Follow up: ${prompt}`
            : `Generate this: ${prompt}`,
      });

      let fullContent = "";
      const computeContent = () => {
        return fullContent
          .trim()
          .replace(/^```(?:html)?/, "")
          .replace(/```$/, "")
          .trim()
          .replaceAll(/href="sim:\/\/(.*?)"/g, (_, url) => {
            return `href onclick='gosim(${JSON.stringify(url)})'`;
          })
          .replaceAll("via.placeholder.com", "dummyimage.com");
      };

      let lastUpdate = 0;
      const readContent = (content: AssistantPart[]) => {
        thoughts = "";
        for (const part of content) {
          if (part.type == "reasoning" && "text" in part) {
            thoughts += "\n\n";
            thoughts += part.text;
          }
          if (part.type == "text") {
            fullContent = part.text;
          }
        }
        thoughts = thoughts.trim();

        const now = Date.now();
        if (fullContent.length > 100 && now - lastUpdate > 1000) {
          html = computeContent();
          lastUpdate = now;
        }
      };

      const addMessage = <T extends Message>(base: T) =>
        new Proxy(base, {
          set(target, prop, value) {
            Reflect.set(target, prop, value);

            if (prop == "content") {
              readContent(value as AssistantPart[]);
            }

            return true;
          },
        });

      await generate(messages, stack, addMessage, aborter?.signal);
      html = computeContent();
    });

  const handleSubmit = () => {
    const contents = $omniContent.trim();
    if (contents && !aborter) {
      $omniContent = "";
      submit(contents, false);
    }
  };

  const resize = (node: HTMLElement) => {
    $effect(() => {
      $omniContent;

      node.style.height = "auto";
      node.style.paddingBlock = "8px";

      const height = node.scrollHeight;
      if (height >= 4 * 16) {
        node.style.height = height + "px";
        node.style.paddingBlock = "8px";
      } else {
        node.style.height = 4 * 16 + "px";
        node.style.paddingBlock = (4 * 16 - (height - 16)) / 2 + "px";
      }
    });
  };
</script>

{#if tab == "placeholder"}
  <p class="placeholder">
    Use AI to generate a website, or <button onclick={() => (tab = "input")}
      >write your own HTML</button
    >
  </p>
{:else if tab == "output"}
  {#if html}
    <!-- svelte-ignore a11y_missing_attribute -->
    <iframe
      {@attach (iframe) => {
        $effect(() => {
          const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
          iframe.src = blobUrl;

          const timeoutId = setTimeout(() => {
            if (iframe.contentWindow) {
              (iframe.contentWindow as any).gosim = (url: string) => {
                $omniContent = url;
                submit(url, true);
              };
            }
          }, 100);

          return () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(blobUrl);
          };
        });
      }}
      allow="autoplay; camera; clipboard-read; clipboard-write; fullscreen; geolocation; microphone"
    ></iframe>
  {:else}
    <div class="empty"></div>
  {/if}
{:else if tab == "input"}
  <textarea class="focus-none" placeholder={thoughts || "HTML"} bind:value={html}></textarea>
{/if}

<div class="bottom-bar">
  <ONavInner />
  <textarea
    class="focus-none input"
    placeholder="Type something, anything"
    rows="1"
    use:resize
    bind:value={$omniContent}
    onkeypress={(e) => {
      if (e.key == "Enter" && !e.shiftKey && $omniContent.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }}
    {@attach (node) => {
      const keydown = (e: KeyboardEvent) => {
        if (!isHotkey(e)) return;
        node.focus();
      };

      window.addEventListener("keydown", keydown);
      return () => {
        window.removeEventListener("keydown", keydown);
      };
    }}
  ></textarea>
  {#if tab != "placeholder"}
    <div class="segments">
      <button disabled={tab == "output"} onclick={() => (tab = "output")}>
        <Layer />
        <Icon icon={iconDashboard} />
      </button>
      <button disabled={tab == "input"} onclick={() => (tab = "input")}>
        <Layer />
        <Icon icon={iconCode} />
      </button>
    </div>
  {/if}
  <ModelPickerLogic bind:stack bind:model minContext={0} useImageInput={false} eloWeight={0.8}>
    {#snippet children({
      model,
      modelsDisplayed,
      sort,
      thinking,
      setSort,
      setThinking,
      selectModel,
    })}
      <button
        class="focus-none split-left"
        onpointerdown={() => {
          choosingSince = Date.now();
        }}
      >
        <Layer />
        <span class="model-name m3-font-body-medium">{model}</span>
        <Icon icon={iconArrowDropDown} />
      </button>
      {#if choosingSince}
        <ModelPickerMenu
          {modelsDisplayed}
          {selectModel}
          bind:sort={() => sort, setSort}
          bind:thinking={() => thinking, setThinking}
          bind:choosingSince
        />
      {/if}
    {/snippet}
  </ModelPickerLogic>
  {#if aborter}
    <button class="focus-none split-right" onclick={abort}>
      <Layer />
      <Icon icon={iconStop} />
    </button>
  {:else}
    <button class="focus-none split-right" disabled={!$omniContent.trim()} onclick={handleSubmit}>
      <Layer />
      <Icon icon={iconSend} />
    </button>
  {/if}
</div>

<style>
  .placeholder {
    margin: auto;
    > button {
      color: rgb(var(--m3-scheme-primary));
    }
  }

  iframe {
    flex: 1;
  }

  .empty {
    background-color: rgb(var(--m3-scheme-surface-container-lowest));
    flex-grow: 1;
  }

  textarea:not(.input) {
    padding: 1.5rem;
    resize: none;
    font-family: ui-monospace, monospace;
    flex-grow: 1;
  }

  .bottom-bar {
    display: flex;
  }

  textarea.input {
    padding-inline: 1rem;
    resize: none;
    flex: 1;
  }

  .segments {
    display: flex;
    border: solid 1px rgb(var(--m3-scheme-outline));
    border-radius: 1rem;
    margin-block: 0.5rem;
    margin-right: 0.5rem;

    > button {
      display: flex;
      align-items: center;
      padding: 0 0.5rem;
      border-radius: 1rem;
      transition: var(--transition);
      position: relative;
      &:disabled {
        background-color: rgb(var(--m3-scheme-secondary-container));
        color: rgb(var(--m3-scheme-on-secondary-container));
      }
    }
  }

  .split-left {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding-inline: 1rem 0.5rem;
    border-start-start-radius: 1.5rem;
    border-end-start-radius: 1.5rem;
    color: rgb(var(--m3-scheme-primary));
    position: relative;

    .model-name {
      max-width: 10rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .split-right {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    border-start-end-radius: 1.5rem;
    border-end-end-radius: 1.5rem;
    color: rgb(var(--m3-scheme-primary));
    transition: var(--m3-util-easing);
    position: relative;

    &:disabled {
      opacity: 0.38;
      color: rgb(var(--m3-scheme-on-surface));
    }
  }
</style>
