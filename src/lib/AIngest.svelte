<script lang="ts">
  import { snackbar } from "m3-svelte";
  import { ingest } from "./AIngest";
  import type { Message } from "./types";

  let { addMessage }: { addMessage: (message: Message) => void } = $props();

  const texts = ["text/plain", "text/markdown", "application/json"];
  const processItems = async (
    transfer: DataTransfer,
    preventDefault: () => void,
    source: string,
  ) => {
    let name = "Text";
    let content: string | Blob | undefined;
    for (const type of texts) {
      if (content) break;

      content = transfer.getData(type);
    }
    for (const item of transfer.items) {
      if (content) break;

      if (!texts.includes(item.type)) continue;
      const file = item.getAsFile();
      if (!file) continue;
      name = file.name;
      content = file;
    }
    if (typeof content == "string" && content.startsWith("<img")) return;
    if (
      typeof content == "string" &&
      !content.startsWith("https:") &&
      document.activeElement != document.body
    )
      return;
    if (!content) return;

    preventDefault();
    let message = $state({
      role: "user" as const,
      content: "[loading]",
      attachmentData: { text: "[loading]", source: "[loading]" },
    });
    addMessage(message);
    try {
      const ingested = await ingest(content, name, source);
      message.content = `<attachment name="${ingested.name}" source="${ingested.source}">
${ingested.text.length > 6000 * 4 ? ingested.text.slice(0, 6000 * 4) + "\n[truncated]" : ingested.text}
</attachment>`;
      message.attachmentData = {
        text: ingested.text,
        source,
      };
    } catch (e) {
      console.error(e);
      snackbar(`Failed to ingest: ${e instanceof Error ? e.message : String(e)}`);
      message.content = "[failed]";
      message.attachmentData = {
        text: "[failed]",
        source: "[failed]",
      };
    }
  };
  const paste = async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    processItems(e.clipboardData, () => e.preventDefault(), "Paste");
  };
  const drop = async (e: DragEvent) => {
    if (!e.dataTransfer) return;
    processItems(e.dataTransfer, () => e.preventDefault(), "Drop");
  };
</script>

<svelte:window onpaste={paste} ondragover={(e) => e.preventDefault()} ondrop={drop} />
