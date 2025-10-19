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
  const paste = async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;

    const html = e.clipboardData.getData("text/html");
    const urlMatch = html.match(/<img src="(?!file)([^"]+)"/);
    const file = [...e.clipboardData.files].find((i) => images.includes(i.type));
    if (!file) return;

    e.preventDefault();
    let url = urlMatch ? urlMatch[1] : URL.createObjectURL(file);
    addViaUrl(url, file);
  };
  const drop = async (e: DragEvent) => {
    if (!e.dataTransfer?.files) return;
    const file = [...e.dataTransfer.files].find((i) => images.includes(i.type));
    if (!file) return;

    e.preventDefault();
    const url = URL.createObjectURL(file);
    addViaUrl(url, file);
  };
</script>

<svelte:window onpaste={paste} ondragover={(e) => e.preventDefault()} ondrop={drop} />
