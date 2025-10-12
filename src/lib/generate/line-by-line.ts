export default async function* (r: Response) {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const bytes of r.body!) {
    buffer += decoder.decode(bytes);

    let lines: string[];
    [lines, buffer] = [buffer.split("\n").slice(0, -1), buffer.split("\n").at(-1)!];

    let datas: string[] = [];
    for (const line of lines) {
      const data = line.startsWith("data: ") && line.slice(6).trim();
      if (!data) continue;
      if (data == "[DONE]") break;
      datas.push(data);
    }

    if (datas.length) {
      for (const line of datas) {
        yield line;
      }
    }
  }
}
