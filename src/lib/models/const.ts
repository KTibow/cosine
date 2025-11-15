// credit to lm arena
export const elos: Record<string, number> = Object.fromEntries(
  (
    [
      [1463, "Gemini 2.5 Pro Thinking"],
      [1449, "GLM 4.6 Thinking"],
      [1448, "GPT 5 Thinking"],
      [1448, "Claude Sonnet 4.5"],
      [1445, "Polaris Alpha"], // est
      [1445, "Qwen3 235b 2507"],
      [1445, "GPT 5 chat"],
      [1440, "MiniMax M2 Thinking"], // est
      [1440, "GPT 5 Codex Thinking"], // est
      [1435, "Kimi K2"],
      [1435, "DeepSeek v3.1 Thinking"],
      [1434, "Claude Haiku 4.5"],
      [1431, "DeepSeek R1 0528 Thinking"],
      [1430, "GLM 4.5 Thinking"],
      [1429, "DeepSeek v3.1"],
      [1428, "Kimi K2 0711"],
      [1427, "GPT 4.1"],
      [1423, "LongCat Flash Chat"],
      [1421, "Grok 3"],
      [1419, "Gemini 2.5 Flash 2509"], // est
      [1419, "Gemini 2.5 Flash 2509 Thinking"],
      [1416, "Qwen3 235b A22b Thinking"],
      [1416, "Qwen3 235b 2507 Thinking"],
      [1414, "DeepSeek R1 Thinking"],
      [1413, "MAI DS R1 Thinking"], // est
      [1409, "Qwen3 Coder 480b A35b"],
      [1404, "Qwen3 30b A3b Thinking"],
      [1404, "GPT 5 mini Thinking"],
      [1403, "DeepSeek v3 0324"],
      [1400, "Raptor mini"], // est
      [1397, "GPT 4.1 mini"],
      [1395, "Mistral Medium 3 (25.05)"],
      [1390, "Gemini 2.5 Flash Lite"],
      [1386, "GLM 4.5 Air"], // est
      [1386, "GLM 4.5 Air Thinking"],
      [1381, "Gemini 2.5 Flash Lite Thinking"],
      [1374, "Grok 3 mini Thinking"],
      [1369, "Mistral Small 3.2"],
      [1364, "Gemma 3 27b"],
      [1363, "Cohere Command A"],
      [1362, "Qwen3 32b"], // est
      [1362, "Qwen3 32b Thinking"],
      [1355, "gpt oss 120b Thinking"],
      [1353, "GPT 5 nano Thinking"],
      [1350, "Grok Code Fast 1 Thinking"], // est
      [1346, "Gemini 2.0 Flash"],
      [1346, "Gemini 2.0 Flash Experimental"],
      [1338, "Llama 3.1 405b"],
      [1336, "Llama 4 Maverick"],
      [1334, "GPT 4o"],
      [1329, "Gemma 3 12b"],
      [1328, "GPT 4.1 nano"],
      [1326, "Llama 4 Scout"],
      [1320, "gpt oss 20b Thinking"],
      [1318, "Llama 3.3 70b"],
      [1317, "Mistral Small 3.1"],
      [1313, "Qwen2.5 72b"],
      [1312, "Gemma 3n E4b"],
      [1309, "Mistral Large 24.11"],
      [1307, "GPT 4o mini"],
      [1299, "Qwen2.5 Coder 32b"],
      [1281, "Gemma 3 4b"],
      [1280, "Mistral Small 3"],
      [1280, "AI21 Jamba 1.5 Large"],
      [1274, "Phi 4"],
      [1258, "Cohere Command R+ 08 2024"],
      [1253, "Cohere Command R 08 2024"],
      [1233, "AI21 Jamba 1.5 mini"],
      [1219, "Llama 3.1 8b"],
      [1166, "Llama 3.2 3b"],
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
    .replace("Mini", "mini")
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
  "GPT 5.1",
  "GPT 5.1 Codex",
  "GPT 5.1 Codex mini",
  "Grok Code Fast 1",
  "Gemini 2.5 Pro",
];
export const orfTPS: Record<string, number> = {
  "DeepSeek v3.1 Thinking": 20,
  "DeepSeek v3.1": 20,
  "Gemma 3 12b": 40,
  "Gemma 3 27b": 40,
  "GLM 4.5 Air Thinking": 40,
  "GLM 4.5 Air": 40,
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
  "Polaris Alpha": 50,
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
  "Grok 3 mini Thinking": 80,
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
  "GPT 5.1 Codex mini Thinking": 140,
  "Gemini 2.5 Pro Thinking": 80,
  "Grok Code Fast 1 Thinking": 200,
  "Raptor mini": 140,
};

for (const obj of [elos, orfTPS, ghmTPS, ghcTPS]) {
  for (const key of Object.keys(obj)) {
    const processed = processName(key);
    if (processed != key) {
      console.warn(key, "is unprocessed!");
    }
  }
}
