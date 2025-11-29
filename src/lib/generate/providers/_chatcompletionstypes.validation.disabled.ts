import { object, string, array, union, literal, optional } from "valibot";

// Valibot schemas for strict OpenAI Chat Completions API validation
// Use these when setting up OpenAI-compatible API endpoints
// Does NOT include provider-specific extensions

const toolCallSchema = object({
  id: string(),
  type: literal("function"),
  function: object({
    name: string(),
    arguments: string(),
  }),
});

const systemMessageSchema = object({
  role: literal("system"),
  content: string(),
});

const userMessageSchema = object({
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
          }),
        }),
      ]),
    ),
  ]),
});

const assistantMessageSchema = object({
  role: literal("assistant"),
  content: optional(string()),
  tool_calls: optional(array(toolCallSchema)),
});

const toolMessageSchema = object({
  role: literal("tool"),
  content: string(),
  tool_call_id: string(),
});

export const chatCompletionsMessageSchema = union([
  systemMessageSchema,
  userMessageSchema,
  assistantMessageSchema,
  toolMessageSchema,
]);
