<script lang="ts">
  import { Snackbar } from 'm3-svelte';
  import type { Snippet } from 'svelte';
  import './lib/tob64-polyfill'; // todo remove when chrome is updated
  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
<Snackbar />
