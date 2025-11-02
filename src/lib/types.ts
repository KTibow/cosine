import { object, string, array, union, literal, optional, type InferOutput } from "valibot";
import type { Provider } from "./generate/providers";

export type Options = Record<string, any>;
export type StackItem = { provider: Provider; options: Options };
export type Stack = StackItem[];

const toolCall = object({
  id: string(),
  type: literal("function"),
  function: object({
    name: string(),
    arguments: string(),
  }),
});

const systemMessage = object({
  role: literal("system"),
  content: string(),
});
const userMessage = object({
  role: literal("user"),
  content: union([
    string(),
    array(
      union([
        object({
          type: literal("text"),
          text: string(),
        }),
        object({
          type: literal("image_url"),
          image_url: object({
            url: string(),
            // detail: optional(picklist(["auto", "low", "high"]))
          }),
        }),
      ]),
    ),
  ]),
});
const assistantMessage = object({
  role: literal("assistant"),
  content: optional(string()),
  tool_calls: optional(array(toolCall)),
});
const toolMessage = object({
  role: literal("tool"),
  content: string(),
  tool_call_id: string(),
});

export const openAIMessage = union([systemMessage, userMessage, assistantMessage, toolMessage]);
export type OpenAIMessage = InferOutput<typeof openAIMessage>;

type SystemMessage = InferOutput<typeof systemMessage>;
export type UserMessage =
  | { role: "user"; content: string }
  | { role: "user"; content: string; attachmentData: { text: string; source: string } }
  | { role: "user"; content?: never; imageURI: string; asBuffer: () => Promise<ArrayBuffer> };
export type ReasoningEntry =
  | { type: "text"; text: string }
  | { type: "summary"; text: string }
  | { type: "encrypted"; data: string; source: string };
export type AssistantMessage = InferOutput<typeof assistantMessage> & {
  reasoning?: ReasoningEntry[];
};
type ToolMessage = InferOutput<typeof toolMessage>;
export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;
