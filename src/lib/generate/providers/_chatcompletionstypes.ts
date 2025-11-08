import { object, string, array, union, literal, optional, type InferOutput } from "valibot";

// OpenAI Chat Completions API types
// These schemas validate messages going to/from OpenAI-compatible APIs
// These are intentionally separate from internal app types even when shapes align

const toolCall = object({
  id: string(),
  type: literal("function"),
  function: object({
    name: string(),
    arguments: string(),
  }),
});
export type ChatCompletionsToolCall = InferOutput<typeof toolCall>;

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

const chatCompletionsMessage = union([
  systemMessage,
  userMessage,
  assistantMessage,
  toolMessage,
]);
export type ChatCompletionsAssistantMessage = InferOutput<typeof assistantMessage>;
export type ChatCompletionsMessage = InferOutput<typeof chatCompletionsMessage>;
