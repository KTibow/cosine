<script lang="ts">
  import type { Message } from "./types";

  let { addMessage }: { addMessage: (message: Message) => void } = $props();

  const addViaUrl = (url: string, file: File) => {
    addMessage({
      role: "user",
      imageURI: url,
      asBuffer: () => file.arrayBuffer(),
    });
  };

  const images = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
  const processItems = async (items: DataTransferItem[], preventDefault: () => void) => {
    const fileItem = items.find((i) => i.kind == "file" && images.includes(i.type));
    if (!fileItem) return;

    preventDefault();

    const file = fileItem.getAsFile()!;
    const htmlItem = items.find((i) => i.type == "text/html");

    let url;
    if (htmlItem) {
      const html = await new Promise<string>((resolve) => htmlItem.getAsString(resolve));
      const urlMatch = html.match(/<img src="(https[^"]+)"/);
      if (urlMatch) url = urlMatch[1];
    }
    url ||= URL.createObjectURL(file);

    addViaUrl(url, file);
  };
  const paste = async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    processItems([...e.clipboardData.items], () => e.preventDefault());
  };
  const drop = async (e: DragEvent) => {
    if (!e.dataTransfer || e.dataTransfer.effectAllowed == "copy") return;
    processItems([...e.dataTransfer.items], () => e.preventDefault());
  };
</script>

<svelte:window onpaste={paste} ondrop={drop} />
