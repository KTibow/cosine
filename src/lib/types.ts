import { object, string, array, union, literal, optional, type InferOutput } from "valibot";

export const openAIMessage = union([
  object({
    role: literal("system"),
    content: string(),
  }),

  object({
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
  }),

  object({
    role: literal("assistant"),
    content: optional(string()),
    tool_calls: optional(
      array(
        object({
          id: string(),
          type: literal("function"),
          function: object({
            name: string(),
            arguments: string(),
          }),
        }),
      ),
    ),
  }),

  object({
    role: literal("tool"),
    content: string(),
    tool_call_id: string(),
  }),
]);
export type OpenAIMessage = InferOutput<typeof openAIMessage>;
