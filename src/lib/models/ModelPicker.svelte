<script lang="ts">
  import type { Stack } from "../types";
  import ModelPickerButton from "./ModelPickerButton.svelte";
  import ModelPickerList from "./ModelPickerList.svelte";
  import { useModelPicker } from "../useModelPicker.svelte";

  let {
    stack = $bindable(),
    bottomRight = false,
    minContext,
    useImageInput,
  }: {
    stack: Stack;
    bottomRight?: boolean;
    minContext: number;
    useImageInput: boolean | undefined;
  } = $props();

  const modelPicker = useModelPicker(minContext, useImageInput);

  $effect(() => {
    stack = modelPicker.stack;
  });

  let choosingSince: number | undefined = $state();
  let thinking: "only" | "exclude" | undefined = $state();

  const open = () => {
    choosingSince = Date.now();
    thinking = undefined;
  };

  const handleModelSelect = (selectedModel: string) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    modelPicker.model = selectedModel;
    delayIfSmall(() => (choosingSince = undefined));
  };
</script>

<svelte:window
  onpointerup={(e) => {
    const delayIfSmall = (action: () => void) => {
      if (innerWidth < 40 * 16) {
        setTimeout(action, 10);
      } else {
        action();
      }
    };
    const target = e.target as HTMLElement;
    if (choosingSince && Date.now() - choosingSince > 333) {
      const label = target.closest("label");
      if (label?.classList.contains("m3-container")) return;
      const button = target.closest("button");
      const newModel = button?.dataset.model;
      if (newModel) {
        modelPicker.model = newModel;
      }

      delayIfSmall(() => (choosingSince = undefined));
    }
  }}
/>
<ModelPickerButton model={modelPicker.model} {bottomRight} isOpen={Boolean(choosingSince)} onOpen={open} />
{#if choosingSince}
  <ModelPickerList
    {bottomRight}
    modelNames={modelPicker.modelNames}
    modelStacks={modelPicker.modelStacks}
    elos={modelPicker.elos}
    onModelSelect={handleModelSelect}
    initialThinking={thinking}
  />
{/if}
