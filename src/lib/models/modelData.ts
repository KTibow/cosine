const model = (elo: number, tps: number) => ({
  intelligence: (elo - 1300) / (1485 - 1300),
  speed: (Math.log(tps) - Math.log(10)) / (Math.log(1600) - Math.log(10)),
});
export default {
  "gpt-oss-120b": model(1350, 1600),
  "gpt-oss-20b": model(1322, 800),
  "Kimi K2": model(1435, 350),
  "Gemini 2.5 Pro": model(1462, 60),
  "GPT-4.1": model(1426, 70),
  "GPT-5 mini": model(1400, 50),
  "GPT-5": model(1450, 50),
  "GPT-4o": model(1321, 80),
  "Grok Code Fast 1": model(1350, 80),
  "Claude Sonnet 3.7 Thinking": model(1412, 60),
  "Claude Sonnet 4.5": model(1462, 60),
  "Gemini 2.0 Flash": model(1370, 160),
};
