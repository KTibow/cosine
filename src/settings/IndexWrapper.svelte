<script lang="ts">
  import { Monoidentity } from "monoidentity";
  import Index from "./Index.svelte";
</script>

<Monoidentity app="cosine">
  <a href="/">Cosine</a>
  <div class="content">
    <Index />
  </div>
</Monoidentity>

<style>
  a {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
  }
  .content {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    flex-grow: 1;
    border-radius: 1.5rem 1.5rem 0 0;
    background-color: rgb(var(--m3-scheme-surface-container-low));
  }
</style>
