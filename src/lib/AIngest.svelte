<script lang="ts">
  import { snackbar } from 'm3-svelte';
  import { plainMimes, otherKnownMimes, ingest } from './AIngest/index';
  import type { Message } from './types';

  let {
    addMessage,
    removeMessage,
  }: { addMessage: (message: Message) => void; removeMessage: (message: Message) => void } =
    $props();

  let shiftPressed = $state(false);

  const processItems = async (
    transfer: DataTransfer,
    preventDefault: () => void,
    defaultSource: string,
  ) => {
    let name = 'Text';
    let content: string | Blob | undefined;
    const knownMimes = [...plainMimes, ...otherKnownMimes];
    // first try (string based)
    for (const type of knownMimes) {
      if (content) break;

      content = transfer.getData(type);
    }
    // fallback (file based)
    for (const item of transfer.items) {
      if (content) break;

      if (!knownMimes.includes(item.type)) continue;
      const file = item.getAsFile();
      if (!file) continue;
      name = file.name;
      content = file;
    }
    if (typeof content == 'string' && content.startsWith('<img')) return;
    if (
      typeof content == 'string' &&
      !content.startsWith('https:') &&
      document.activeElement != document.body
    )
      return;
    if (!content) return;

    preventDefault();
    let message = $state({
      role: 'user' as const,
      content: '[loading]',
      attachmentData: { text: '[loading]', source: '[loading]' },
    });
    addMessage(message);
    try {
      const ingested = await ingest(content, name, defaultSource);
      message.content = `<attachment name="${ingested.name}" source="${ingested.source}">
${ingested.text}
</attachment>`;
      message.attachmentData = {
        text: ingested.text,
        source: ingested.source,
      };
    } catch (e) {
      console.error(e);
      snackbar(`Failed to ingest: ${e instanceof Error ? e.message : String(e)}`);
      removeMessage(message);
    }
  };
  const paste = async (e: ClipboardEvent) => {
    if (shiftPressed) return;
    if (!e.clipboardData) return;
    processItems(e.clipboardData, () => e.preventDefault(), 'Paste');
  };
  const drop = async (e: DragEvent) => {
    if (!e.dataTransfer || e.dataTransfer.effectAllowed == 'copy') return;
    processItems(e.dataTransfer, () => e.preventDefault(), 'Drop');
  };
</script>

<svelte:window
  onpaste={paste}
  ondrop={drop}
  onkeydown={(e) => e.key == 'Shift' && (shiftPressed = true)}
  onkeyup={(e) => e.key == 'Shift' && (shiftPressed = false)}
  onblur={() => (shiftPressed = false)}
/>
