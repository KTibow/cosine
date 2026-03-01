import type { Provider } from './generate/providers';

type ReasoningConfig = { enabled: boolean };

export type Options = {
  model: string;
  reasoningEffort?: string;
  disableThinking?: boolean;
  thinkingBudget?: number;
  reasoning?: ReasoningConfig;
  useResponses?: boolean;
};
export type OptionsInference = Options & {
  tools: any[];
  initiator: string;
};
export type StackItem = { provider: Provider; options: Options };
export type Stack = StackItem[];

type SystemMessage = { role: 'system'; content: string };

// ---

export type UserMessage =
  | { role: 'user'; content: string }
  | { role: 'user'; content: string; attachmentData: { text: string; source: string } }
  | {
      role: 'user';
      content?: never;
      imageURI: string;
      deconstruct: () => Promise<{ mimeType: string; base64: string }>;
    };

// ---

export type AssistantReasoningPart =
  | { type: 'reasoning'; category: 'text'; text: string }
  | { type: 'reasoning'; category: 'summary'; text: string }
  | { type: 'reasoning'; category: 'encrypted'; data: string; source: string };
export type AssistantTextPart = { type: 'text'; text: string };
export type AssistantToolCallPart = {
  type: 'tool_call';
  status?: 'in_progress' | 'completed' | 'incomplete';
  call: ToolCall;
};
export type AssistantPart = AssistantTextPart | AssistantReasoningPart | AssistantToolCallPart;

export type AssistantMessage = {
  role: 'assistant';
  content: AssistantPart[];
};

// ---

type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};
export type ToolMessage = { role: 'tool'; content: string; tool_call_id: string };

// ---

export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;
