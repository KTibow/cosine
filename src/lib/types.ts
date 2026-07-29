import type { Provider } from './generate/providers';

export type OptionsBase = {
  model: string;
  useResponses?: boolean;
  providerRestriction?: string;
};
export type Options = OptionsBase & {
  reasoningEffort: string | null;
};
export type OptionsInference = Options & {
  // Vendor-native tool specs, ready to send as-is — see lib/tools.
  tools: object[];
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
// A tool the provider ran for us, reported after the fact — never something we
// have to answer.
export type AssistantToolCallPart = {
  type: 'tool_call';
  status: 'in_progress' | 'completed';
  name: string;
  arguments: string;
  output?: string;
};
export type AssistantPart = AssistantTextPart | AssistantReasoningPart | AssistantToolCallPart;

export type AssistantMessage = {
  role: 'assistant';
  content: AssistantPart[];
};

// ---

export type Message = SystemMessage | UserMessage | AssistantMessage;
