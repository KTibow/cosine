<svelte:window
  ondragstart={(e) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'copy';
  }}
  ondragover={(e) => {
    if (!e.dataTransfer || e.dataTransfer.effectAllowed == 'copy') return;
    e.preventDefault();
  }}
/>
