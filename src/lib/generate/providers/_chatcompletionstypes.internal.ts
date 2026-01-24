// Internal TypeScript types for Chat Completions messages
// These include provider-specific extensions (reasoning_opaque, etc.)

export type ChatCompletionsToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatCompletionsSystemMessage = {
  role: "system";
  content: string;
};

export type ChatCompletionsUserMessage = {
  role: "user";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
};

export type ChatCompletionsAssistantMessage = {
  role: "assistant";
  content?:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
  tool_calls?: ChatCompletionsToolCall[];
  reasoning_opaque?: string; // Gemini via GitHub Copilot
};

export type ChatCompletionsToolMessage = {
  role: "tool";
  content: string;
  tool_call_id: string;
};

export type ChatCompletionsMessage =
  | ChatCompletionsSystemMessage
  | ChatCompletionsUserMessage
  | ChatCompletionsAssistantMessage
  | ChatCompletionsToolMessage;
