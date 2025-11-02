// credit to lm arena
export const elos: Record<string, number> = Object.fromEntries(
  (
    [
      [1462, "Gemini 2.5 Pro Thinking"],
      [1461, "Claude Sonnet 4.5"],
      [1449, "GPT 5 Thinking"],
      [1445, "Qwen3 235b 2507"],
      [1445, "GPT 5 chat"],
      [1443, "GLM 4.6 Thinking"],
      [1440, "GPT 5 Codex Thinking"], // est
      [1440, "MiniMax M2 Thinking"], // est
      [1434, "Kimi K2"],
      [1430, "DeepSeek R1 0528 Thinking"],
      [1427, "Kimi K2 0711"],
      [1427, "GLM 4.5 Thinking"],
      [1429, "DeepSeek v3.1 Thinking"],
      [1426, "GPT 4.1"],
      [1423, "LongCat Flash Chat"],
      [1421, "Grok 3"],
      [1419, "Claude Haiku 4.5"],
      [1416, "Qwen3 235b 2507 Thinking"],
      [1415, "Gemini 2.5 Flash Thinking"],
      [1415, "Gemini 2.5 Flash"], // est
      [1415, "Qwen3 235b A22b Thinking"],
      [1413, "MAI DS R1 Thinking"], // est
      [1413, "DeepSeek R1 Thinking"],
      [1408, "Qwen3 Coder 480b A35b"],
      [1406, "GPT 5 mini Thinking"],
      [1401, "DeepSeek v3 0324"],
      [1400, "Copilot SWE"], // est
      [1396, "GPT 4.1 mini"],
      [1394, "Mistral Medium 3 (25.05)"],
      [1386, "Gemini 2.5 Flash Lite"],
      [1385, "GLM 4.5 Air Thinking"],
      [1380, "Gemini 2.5 Flash Lite Thinking"],
      [1374, "Grok 3 Mini Thinking"],
      [1369, "Mistral Small 3.2"],
      [1361, "Qwen3 32b"], // est
      [1361, "Qwen3 32b Thinking"],
      [1361, "Cohere Command A"],
      [1359, "Gemma 3 27b"],
      [1358, "Gemini 2.0 Flash"],
      [1358, "Gemini 2.0 Flash Experimental"],
      [1352, "GPT 5 nano Thinking"],
      [1351, "gpt oss 120b Thinking"],
      [1350, "Grok Code Fast 1 Thinking"], // est
      [1340, "Qwen3 30b A3b Thinking"],
      [1337, "Llama 3.1 405b"],
      [1336, "Llama 4 Maverick"],
      [1332, "GPT 4o"],
      [1329, "Gemma 3 12b"],
      [1327, "GPT 4.1 nano"],
      [1325, "Llama 4 Scout"],
      [1319, "gpt oss 20b Thinking"],
      [1317, "Llama 3.3 70b"],
      [1315, "Mistral Small 3.1"],
      [1312, "Qwen2.5 72b"],
      [1312, "Gemma 3n E4b"],
      [1308, "Mistral Large 24.11"],
      [1306, "GPT 4o mini"],
      [1298, "Qwen2.5 Coder 32b"],
      [1281, "Gemma 3 4b"],
      [1278, "AI21 Jamba 1.5 Large"],
      [1279, "Mistral Small 3"],
      [1272, "Phi 4"],
      [1256, "Cohere Command R+ 08 2024"],
      [1251, "Cohere Command R 08 2024"],
      [1231, "AI21 Jamba 1.5 Mini"],
      [1218, "Llama 3.1 8b"],
      [1164, "Llama 3.2 3b"],
      [1152, "Mistral 7b"],
      [1110, "Llama 3.2 1b"],
    ] as const
  ).map(([elo, key]) => [key, elo]),
);
export const processName = (name: string) =>
  (name = name
    .replaceAll("-", " ")
    .replace(/^OpenAI (?=o|gpt)/i, "")
    .replace(/^Meta Llama/, "Llama")
    .replace(/^Llama /, "Llama ")
    .replace(/^DeepSeek /, "DeepSeek ")
    .replace("gpt", "GPT")
    .replace("GPT oss", "gpt oss")
    .replace(/\bV(?=[0-9])/, "v")
    .replace(/(?<= (?:1|3|4|7|8|11|12|14|17|22|27|30|32|70|72|90|235|405|480))B/, "b")
    .replace(/(?<=A(?:3|22|35))B/, "b")
    .replace(/3n ([0-9]+)b/i, "3n E$1b")
    .replace(/(?<=Mistral Small.+) 24b/i, "")
    .replace(/ instruct$/i, "")
    .replace(/ 17b 128e instruct fp8$/i, "")
    .replace(/ 17b 128e$/i, "")
    .replace(/ 17b 16e instruct$/i, "")
    .replace(/ 17b 16e$/i, "")
    .replace(/ \(preview\)$/i, "")
    .replace(/(?<=3\.2.+) Vision$/, ""));
export const k = (n: number) => n * 1024;
export const alwaysReasoners = [
  "GPT 5",
  "GPT 5 mini",
  "GPT 5 Codex",
  "Grok Code Fast 1",
  "Gemini 2.5 Pro",
];
export const orfTPS: Record<string, number> = {
  "DeepSeek v3.1": 20,
  "Gemma 3 12b": 40,
  "Gemma 3 27b": 40,
  "GLM 4.5 Air": 100,
  "gpt oss 20b Thinking": 40,
  "Kimi K2 0711": 40,
  "Llama 3.3 70b": 120,
  "Llama 4 Maverick": 60,
  "Llama 4 Scout": 60,
  "LongCat Flash Chat": 40,
  "MAI DS R1 Thinking": 60,
  "MiniMax M2": 60,
  "Mistral Small 3.1": 40,
  "Mistral Small 3.2": 120,
  "Qwen3 30b A3b": 100,
};
export const ghmTPS: Record<string, number> = {
  "AI21 Jamba 1.5 Large": 20,
  "Cohere Command A": 20,
  "Cohere Command R 08 2024": 20,
  "Cohere Command R+ 08 2024": 20,
  "DeepSeek R1 0528 Thinking": 30,
  "DeepSeek R1 Thinking": 60,
  "DeepSeek v3 0324": 100,
  "GPT 4.1 mini": 100,
  "GPT 4.1 nano": 120,
  "GPT 4.1": 80,
  "GPT 4o mini": 80,
  "GPT 4o": 100,
  "GPT 5 chat": 100,
  "GPT 5 mini Thinking": 80,
  "GPT 5 nano Thinking": 120,
  "GPT 5 Thinking": 140,
  "Grok 3 Mini Thinking": 80,
  "Grok 3": 40,
  "Llama 3.1 405b": 20,
  "Llama 3.1 8b": 160,
  "Llama 3.3 70b": 80,
  "Llama 4 Scout": 60,
  "Llama 4 Maverick": 60,
  "MAI DS R1 Thinking": 60,
  "Mistral Medium 3 (25.05)": 30,
  "Mistral Small 3.1": 80,
};
export const ghcTPS: Record<string, number> = {
  "Claude Sonnet 4.5": 80,
  "GPT 4.1": 140,
  "GPT 4o": 80,
  "GPT 5 mini Thinking": 40,
  "GPT 5 Codex Thinking": 140,
  "GPT 5 Thinking": 140,
  "Gemini 2.5 Pro Thinking": 80,
  "Grok Code Fast 1 Thinking": 200,
  "Copilot SWE": 160,
};

for (const obj of [elos, orfTPS, ghmTPS, ghcTPS]) {
  for (const key of Object.keys(obj)) {
    const processed = processName(key);
    if (processed != key) {
      console.warn(key, "is unprocessed!");
    }
  }
}
