<script lang="ts">
  let { text }: { text: string } = $props();

  const frequencyX = (Math.PI * 2) / 4;
  const frequencyT = (Math.PI * 2) / 1000;
  const round2 = (x: number) => Math.round(x * 1000) / 1000;
  const round1 = (x: number) => Math.round(x * 100) / 100;
  const renderWave = (time: number) => {
    time = time * frequencyT;
    time %= Math.PI * 2;

    const from = 0.25 / 2;
    const to = 8 - 0.25 / 2;

    let path = "";
    for (let x = from; x <= to; x += 0.1) {
      const sinV = Math.cos(x * frequencyX + time);
      const y = sinV * (1 / 2 - 0.25 / 2) + 1 / 2;

      if (x == from) {
        path = `M ${round1(x)} ${round2(y)}`;
      } else {
        path += ` ${round1(x)} ${round2(y)}`;
      }
    }

    return path;
  };
  const renderAnimation = () => {
    let values: string[] = [];
    for (let t = 0; t <= 1000; t += 1000 / 30) {
      values.push(renderWave(t));
    }
    return values.join(";");
  };
</script>

<div class="loader">
  {text}
  <svg viewBox="0 0 8 1" width="8em" height="1em">
    <path fill="none" stroke="currentColor" stroke-width="0.25" stroke-linecap="round">
      <animate attributeName="d" dur="1s" repeatCount="indefinite" values={renderAnimation()} />
    </path>
  </svg>
</div>

<style>
  .loader {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
