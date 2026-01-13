// credit to lm arena hard prompts
export const elos: Record<string, number> = Object.fromEntries(
  (
    [
      [1504, "Gemini 3 Pro Thinking"],
      [1494, "Claude Opus 4.5"],
      [1488, "Gemini 3 Flash Thinking"],
      [1485, "Claude Sonnet 4.5 Thinking"],
      [1483, "Gemini 3 Flash"],
      [1475, "Claude Sonnet 4.5"],
      [1474, "GPT 5.1 Thinking"],
      [1462, "Gemini 2.5 Pro Thinking"],
      [1461, "GPT 5.2 Thinking"],
      [1458, "GLM 4.7 Thinking"],
      [1455, "GPT 5.1"],
      [1453, "Kimi K2 Thinking"],
      [1449, "Qwen3 235b 2507"],
      [1448, "GPT 5 Thinking"],
      [1448 - 10, "GPT 5.1 Codex Max Thinking"], // est
      [1448 - 10, "GPT 5.1 Codex Thinking"], // est
      [1448 - 10, "GPT 5 Codex Thinking"], // est
      [1447, "DeepSeek v3.2 Exp"],
      [1447, "GPT 5 chat"],
      [1444, "DeepSeek v3.2"],
      [1443, "DeepSeek v3.2 Exp Thinking"],
      [1441, "GLM 4.6 Thinking"],
      [1441, "INTELLECT 3 Thinking"], // est
      [1441 - 10, "INTELLECT 3"], // est
      [1441 - 10, "GLM 4.6"], // est
      [1441, "DeepSeek v3.1 Terminus Thinking"],
      [1440, "Grok 4.1 Fast Thinking"],
      [1439, "GPT 5.2"],
      [1436, "DeepSeek v3.1 Thinking"],
      [1435, "Kimi K2"],
      [1433, "DeepSeek v3.2 Speciale Thinking"], // est
      [1433, "Claude Haiku 4.5"],
      [1433 + 10, "Claude Haiku 4.5 Thinking"], // est
      [1431, "GLM 4.5 Thinking"],
      [1431, "DeepSeek R1 0528 Thinking"],
      [1431 - 10, "GLM 4.5"], // est
      [1430, "Kimi K2 0711"],
      [1430, "DeepSeek v3.1"],
      [1427, "GPT 4.1"],
      [1423, "LongCat Flash Chat"],
      [1422, "Grok 3"],
      [1421, "DeepSeek v3.1 Terminus"],
      [1420, "Qwen3 Next 80b A3b"],
      [1419, "DeepSeek v3.2 Thinking"],
      [1417, "Gemini 2.5 Flash 2509"], // est
      [1417, "Gemini 2.5 Flash 2509 Thinking"],
      [1416, "Qwen3 235b 2507 Thinking"],
      [1415, "Ring 1t Thinking"], // est
      [1415, "MAI DS R1 Thinking"], // est
      [1415, "GPT 5.1 Codex mini Thinking"], // est
      [1415, "DeepSeek R1 Thinking"],
      [1414, "Gemini 2.5 Flash"], // est
      [1414, "Gemini 2.5 Flash Thinking"],
      [1410, "Qwen3 Coder 480b A35b"],
      [1407, "MiniMax M2.1 Thinking"],
      [1405, "Qwen3 30b A3b"],
      [1404, "GPT 5 mini Thinking"],
      [1403, "DeepSeek v3 0324"],
      [1400, "Raptor mini Thinking"], // est
      [1398, "GPT 4.1 mini"],
      [1396, "Mistral Medium 3 (2505)"],
      [1391, "Gemini 2.5 Flash Lite 2509"],
      [1389, "Qwen3 235b Thinking"],
      [1389, "GLM 4.5 Air Thinking"],
      [1389 - 10, "GLM 4.5 Air"], // est
      [1381, "Gemini 2.5 Flash Lite 2509 Thinking"],
      [1374, "Grok 3 mini Thinking"],
      [1370, "Mistral Small 3.2"],
      [1365, "MiniMax M2 Thinking"],
      [1364, "Cohere Command A"],
      [1363, "Gemma 3 27b"],
      [1362, "Qwen3 32b"], // est
      [1362, "Qwen3 32b Thinking"],
      [1360, "Nova 2 Lite Thinking"],
      [1359, "gpt oss 120b Thinking"],
      [1353, "GPT 5 nano Thinking"],
      [1350, "Grok Code Fast 1 Thinking"], // est
      [1347, "Gemini 2.0 Flash"],
      [1347, "Gemini 2.0 Flash Experimental"],
      [1341, "Claude Haiku 3.5"],
      [1339, "Llama 3.1 405b"],
      [1337, "Llama 4 Maverick"],
      [1334, "GPT 4o"],
      [1330, "Gemma 3 12b"],
      [1328, "GPT 4.1 nano"],
      [1327, "Llama 4 Scout"],
      [1321, "gpt oss 20b Thinking"],
      [1319, "Llama 3.3 70b"],
      [1317, "Mistral Small 3.1"],
      [1314, "Qwen2.5 72b"],
      [1312, "Gemma 3n E4b"],
      [1310, "Mistral Large 2411"],
      [1307, "GPT 4o mini"],
      [1300, "Qwen2.5 Coder 32b"],
      [1282, "Gemma 3 4b"],
      [1281, "Mistral Small 3"],
      [1280, "AI21 Jamba 1.5 Large"],
      [1274, "Phi 4"],
      [1274, "Phi 4 multimodal"], // est
      [1262, "Claude Haiku 3"],
      [1258, "Cohere Command R+ 2408"],
      [1253, "Cohere Command R 2408"],
      [1250, "Phi 4 mini"], // est
      [1250, "Ministral 3b"], // est
      [1233, "AI21 Jamba 1.5 mini"],
      [1219, "Llama 3.1 8b"],
      [1166, "Llama 3.2 3b"],
      [1154, "Mistral 7b"],
      [1112, "Llama 3.2 1b"],
      [1000, "gpt oss safeguard 120b"], // est
      [1000, "Stok 0.4.1"], // est
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
    .replace(/\bMini\b/, "mini")
    .replace(/GPT OSS/i, "gpt oss")
    .replace(/\bV(?=[0-9])/, "v")
    .replace(/(?<= (?:1|3|4|7|8|11|12|14|17|22|27|30|32|70|72|80|90|120|235|405|480))B/, "b")
    .replace(/(?<= (?:1))T/, "t")
    .replace(/(?<=A(?:3|22|35))B/, "b")
    .replace(" A22b", "")
    .replace(/3n ([0-9]+)b/i, "3n E$1b")
    .replace(/ preview| \(preview\)/i, "")
    .replace(/(?<=Mistral Small.+) 24b/i, "")
    .replace(/\b([01][0-9]) 20(2[0-9])\b/, "$2$1")
    .replace(/(?<=\b2[0-9])\.(?=[01][0-9]\b)/, "")
    .replace(/\bReasoner\b/, "Thinking")
    .replace(/\bThink\b/, "Thinking")
    .replace(/^(.+) Thinking (.+)$/, "$1 $2 Thinking")
    .replace(/ instruct$/i, "")
    .replace(/ 17b 128e instruct fp8$/i, "")
    .replace(/ 17b 128e$/i, "")
    .replace(/ 17b 16e instruct$/i, "")
    .replace(/ 17b 16e$/i, "")
    .replace(/(?<=3\.2.+) Vision$/, ""));
export const k = (n: number) => n * 1024;
export const identifiablePrefixes = [
  "deephermes",
  "deepseek",
  "devstral",
  "gemini",
  "gemma",
  "glm",
  "grok",
  "gpt",
  "hunyuan",
  "intellect",
  "kimi",
  "llama",
  "longcat",
  "mai",
  "minimax",
  "mistral",
  "nemotron",
  "qwen",
  "qwq",
  "ring",
  "stok",
  "trinity",
];
export const alwaysReasoners = [
  "DeepSeek R1 0528",
  "DeepSeek R1 Distill Llama 70b",
  "DeepSeek R1 Distill Qwen 32b",
  "DeepSeek v3.2 Speciale",
  "Gemini 2.5 Pro",
  "Gemini 3 Pro",
  "GPT 5 Codex",
  "GPT 5 mini",
  "GPT 5",
  "GPT 5.1 Codex Max",
  "GPT 5.1 Codex mini",
  "GPT 5.1 Codex",
  "gpt oss 120b",
  "Grok Code Fast 1",
  "MiniMax M2",
  "MiniMax M2.1",
  "Raptor mini",
  "Ring 1t",
];
export const crofReasonPatches = [
  "DeepSeek v3.2",
  "DeepSeek v3.2 Exp",
  "GLM 4.5",
  "GLM 4.5 Air",
  "GLM 4.6",
  "GLM 4.7",
  "INTELLECT 3",
];
export const crofTPS: Record<string, number> = {
  "DeepSeek v3 0324": 33,
  "DeepSeek v3 0324 Turbo": 22,
  "DeepSeek v3.1": 8,
  "DeepSeek v3.1 Free": 22,
  "DeepSeek v3.1 Thinking": 88,
  "DeepSeek v3.1 Terminus": 1,
  "DeepSeek v3.1 Terminus Thinking": 45,
  "DeepSeek v3.2 Exp": 6,
  "DeepSeek v3.2 Exp Thinking": 6,
  "DeepSeek v3.2": 40,
  "DeepSeek v3.2 Thinking": 40,
  "DeepSeek v3.2 Precision": 30,
  "DeepSeek v3.2 Precision Thinking": 30,
  "DeepSeek v3.2 Speciale Thinking": 114,
  "DeepSeek R1 0528 Thinking": 33,
  "DeepSeek R1 0528 Turbo Thinking": 11,
  "DeepSeek R1 Distill Llama 70b Thinking": 64,
  "DeepSeek R1 Distill Qwen 32b Thinking": 65,
  "Devstral Small 2505": 10,
  "Gemma 3 27b": 87,
  "GLM 4.5": 165,
  "GLM 4.5 Thinking": 165,
  "GLM 4.6": 92,
  "GLM 4.6 Thinking": 92,
  "GLM 4.6 Turbo": 41,
  "GLM 4.6 Turbo Thinking": 41,
  "GLM 4.7": 10,
  "GLM 4.7 Thinking": 10,
  "gpt oss 120b Thinking": 148,
  "INTELLECT 3": 80,
  "INTELLECT 3 Thinking": 80,
  "Kimi K2": 33,
  "Kimi K2 Turbo": 400,
  "Kimi K2 0711 Eco": 16,
  "Kimi K2 Thinking": 140,
  "Kimi K2 Turbo Thinking": 275,
  "Llama 3.3 70b": 31,
  "Llama 4 Scout": 65,
  "MiniMax M2 Thinking": 33,
  "Qwen3 235b 2507": 96,
  "Qwen3 235b 2507 Thinking": 40,
  "Qwen3 Coder 480b A35b": 93,
  "Qwen3 Coder 480b A35b Free": 44,
  "Qwen3 Coder 480b A35b Turbo": 254,
  "Qwen3 Next 80b A3b": 24,
  "Ring 1t Thinking": 112,
  "Stok 0.4.1": 5248,
};
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
  "Qwen3 30b A3b": 100,
};
export const orhcTPS: Record<string, number> = {
  "Grok 4.1 Fast Thinking": 120,
  "Gemini 3 Pro Thinking": 80,
  "Gemini 3 Flash Thinking": 140,
  "GPT 5.1 Thinking": 80,
  "Kimi K2": 300,
  "Kimi K2 Thinking": 200,
  "GLM 4.6 Thinking": 40,
  "DeepSeek v3.2 Speciale Thinking": 40,
  "Qwen3 Next 80b A3b": 200,
  "GPT 5 mini thinking": 80,
  "DeepSeek v3.2 Exp Thinking": 20,
  "DeepSeek R1 0528 Thinking": 20,
};
export const ghmTPS: Record<string, number> = {
  "AI21 Jamba 1.5 Large": 20,
  "Cohere Command A": 20,
  "Cohere Command R 2408": 20,
  "Cohere Command R+ 2408": 20,
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
  "Mistral Medium 3 (2505)": 30,
  "Mistral Small 3.1": 80,
  "Phi 4": 10,
};
export const ghcTPS: Record<string, number> = {
  "Claude Opus 4.5": 60,
  "Claude Sonnet 4.5": 80,
  "Claude Haiku 4.5": 180,
  "GPT 4.1": 140,
  "GPT 4o": 80,
  "GPT 5 mini Thinking": 40,
  "GPT 5 Codex Thinking": 140,
  "GPT 5 Thinking": 140,
  "GPT 5.1": 80,
  "GPT 5.1 Codex Thinking": 100,
  "GPT 5.1 Codex Max Thinking": 100,
  "GPT 5.1 Codex mini Thinking": 140,
  "Gemini 2.5 Pro Thinking": 80,
  "Gemini 3 Pro Thinking": 80,
  "Grok Code Fast 1 Thinking": 200,
  "Raptor mini Thinking": 140,
  "Gemini 3 Flash": 140,
};

for (const obj of [elos, crofTPS, orfTPS, orhcTPS, ghmTPS, ghcTPS]) {
  for (const key of Object.keys(obj)) {
    const processed = processName(key);
    if (processed != key) {
      console.warn(key, "is unprocessed - should be", processed);
    }
  }
}

export const DEFAULT_ELO = 1200;
export const ORF_DEFAULT_TPS = 40;
export const ORHC_DEFAULT_TPS = 50;
export const CROF_DEFAULT_TPS = 50;
export const GHM_DEFAULT_TPS = 50;
export const GHC_DEFAULT_TPS = 100;
