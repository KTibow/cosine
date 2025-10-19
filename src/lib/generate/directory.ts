const directory = {
  "Cerebras via Cosine": { base: "https://api.cerebras.ai/v1", key: "CEREBRAS_KEY" },
  "Groq via Cosine": { base: "https://api.groq.com/openai/v1", key: "GROQ_KEY" },
  "Gemini via Cosine": {
    base: "https://generativelanguage.googleapis.com/v1beta/openai",
    key: "GEMINI_KEY",
  },
  "OpenRouter Free via Cosine": {
    base: "https://openrouter.ai/api/v1",
    key: "OPENROUTER_FREE_KEY",
  },
  "GitHub Copilot": {
    base: "https://api.githubcopilot.com",
    headers: {
      "editor-version": "vscode/0-insider",
      "x-github-api-version": "2025-05-01",
      "copilot-vision-request": "true",
    },
    key: "user",
  },
  "GitHub Models": {
    base: "https://models.github.ai/inference",
    key: "user",
  },
};
export default directory;
export type Provider = keyof typeof directory;
