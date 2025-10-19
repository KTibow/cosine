<script lang="ts">
  import type { Message } from "./types";

  let { addMessage }: { addMessage: (message: Message) => void } = $props();

  const texts = ["text/plain", "text/markdown", "application/json"];
  const processItems = async (
    source: string,
    items: DataTransferItem[],
    preventDefault: () => void,
  ) => {
    if (document.activeElement != document.body) return;

    const item = items.find((i) => texts.includes(i.type));
    if (!item) return;

    preventDefault();
    let text: string;
    if (item.kind == "string") {
      text = await new Promise<string>((resolve) => item.getAsString(resolve));
    } else if (item.kind == "file") {
      const file = item.getAsFile();
      text = await file!.text();
    } else {
      throw new Error("Unknown kind");
    }
    text = text.trim();
    if (text.startsWith("https:")) return;
    if (text.startsWith("<img")) return;

    addMessage({
      role: "user",
      content: `<attachment name="Text" source="${source}">
${text.length > 6000 * 4 ? text.slice(0, 6000 * 4) + "\n[truncated]" : text}
</attachment>`,
      attachmentData: {
        text,
        source,
      },
    } as const);
  };
  const paste = async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    processItems("Paste", [...e.clipboardData.items], () => e.preventDefault());
  };
  const drop = async (e: DragEvent) => {
    if (!e.dataTransfer) return;
    processItems(
      "Drop",
      [...e.dataTransfer.items].filter((item) => item.kind == "file"),
      () => e.preventDefault(),
    );
  };
</script>

<svelte:window onpaste={paste} ondragover={(e) => e.preventDefault()} ondrop={drop} />
