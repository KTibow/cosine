// Internal TypeScript types for Chat Completions messages

export type ChatCompletionsSystemMessage = {
  role: 'system';
  content: string;
};

export type ChatCompletionsUserMessage = {
  role: 'user';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

export type ChatCompletionsAssistantMessage = {
  role: 'assistant';
  content?:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

export type ChatCompletionsMessage =
  | ChatCompletionsSystemMessage
  | ChatCompletionsUserMessage
  | ChatCompletionsAssistantMessage;
