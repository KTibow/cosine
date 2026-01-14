import { constructBase, type Dict, type Headerslike, type Requestlike } from "./_base";
import type {
  OptionsInference,
  Message,
  UserMessage,
  AssistantMessage,
  AssistantTextPart,
  AssistantReasoningPart,
  AssistantToolCallPart,
} from "../../types";
import streamSSE from "../stream-sse";

// Minimal Anthropic message/content shapes we need
type AntText = { type: "text"; text: string };
type AntImage = {
  type: "image";
  source: { type: "url"; url: string } | { type: "base64"; media_type: string; data: string };
};
type AntToolResult = { type: "tool_result"; tool_use_id: string; content: string };
type AntToolUse = { type: "tool_use"; id: string; name: string; input: any };
type AntUserBlock = AntText | AntImage | AntToolResult;
type AntAssistantBlock = AntText | AntToolUse;

type AntUserMsg = { role: "user"; content: AntUserBlock[] };
type AntAssistantMsg = { role: "assistant"; content: AntAssistantBlock[] };
type AntMessage = AntUserMsg | AntAssistantMsg;

// Serialize our Message[] -> { system?, messages[] } for Anthropic
const serializeForAnthropic = async (
  messages: Message[],
): Promise<{ system?: string; messages: AntMessage[] }> => {
  let system: string | undefined;
  const out: AntMessage[] = [];

  for (const m of messages) {
    if (m.role == "system") {
      system = system ? `${system}\n${m.content}` : m.content;
      continue;
    }

    if (m.role == "user") {
      const blocks: AntUserBlock[] = [];

      // main text
      if (m.content) {
        blocks.push({ type: "text", text: m.content });
      }

      // optional image
      if ("imageURI" in m && m.imageURI) {
        const uri = m.imageURI;
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          blocks.push({ type: "image", source: { type: "url", url: uri } });
        } else {
          // Use provided deconstruct() for non-URL (blob/file/etc.)
          const { mimeType, base64 } = await m.deconstruct();
          blocks.push({
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64 },
          });
        }
      }

      out.push({ role: "user", content: blocks.length ? blocks : [{ type: "text", text: "" }] });
      continue;
    }

    if (m.role == "assistant") {
      out.push({
        role: "assistant",
        content: m.content
          .map((part) => {
            if (part.type == "text") {
              return { type: "text", text: part.text };
            } else if (part.type == "tool_call") {
              return {
                type: "tool_use",
                id: part.call.id,
                name: part.call.function.name,
                input: JSON.parse(part.call.function.arguments || "{}"),
              };
            }
          })
          .filter((part): part is AntAssistantBlock => Boolean(part)),
      });
      continue;
    }

    if (m.role == "tool") {
      // Anthropic expects tool results as user messages
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.tool_call_id,
            content: m.content,
          },
        ],
      });
      continue;
    }
  }

  return { system, messages: out };
};

// Streaming parser for Anthropic /v1/messages SSE
const parseAnthropicStream = async function* (
  response: Response,
  { startTime }: { startTime: number },
): AsyncGenerator<AssistantMessage> {
  const message: AssistantMessage = { role: "assistant", content: [] };
  let startContentTime = 0;

  // Track active blocks by index
  type Active =
    | { kind: "text"; part: AssistantTextPart }
    | { kind: "thinking"; part: AssistantReasoningPart }
    | { kind: "tool_use"; part: AssistantToolCallPart };
  const active = new Map<number, Active>();

  const begin = (index: number, block: any) => {
    if (block?.type == "text") {
      const p: AssistantTextPart = { type: "text", text: "" };
      message.content.push(p);
      active.set(index, { kind: "text", part: p });
    } else if (block?.type == "thinking") {
      const p: AssistantReasoningPart = { type: "reasoning", category: "text", text: "" };
      message.content.push(p);
      active.set(index, { kind: "thinking", part: p });
    } else if (block?.type == "redacted_thinking") {
      const p: AssistantReasoningPart = {
        type: "reasoning",
        category: "encrypted",
        data: "",
        source: "anthropic",
      };
      message.content.push(p);
      active.set(index, { kind: "thinking", part: p });
    } else if (block?.type == "tool_use") {
      const p: AssistantToolCallPart = {
        type: "tool_call",
        status: "in_progress",
        call: {
          id: block.id || "",
          type: "function",
          function: { name: block.name || "", arguments: "" },
        },
      };
      message.content.push(p);
      active.set(index, { kind: "tool_use", part: p });
    }
  };

  const append = (index: number, delta: any) => {
    const a = active.get(index);
    if (!a) return;
    if (a.kind == "text") {
      const chunk = delta?.text || "";
      if (chunk) startContentTime ||= performance.now();
      a.part.text += chunk;
    } else if (a.kind == "thinking" && a.part.category == "text") {
      a.part.text += delta?.thinking || "";
    } else if (
      a.kind == "thinking" &&
      a.part.category == "encrypted" &&
      typeof delta.data == "string"
    ) {
      a.part.data += delta.data;
    } else if (a.kind == "tool_use") {
      if (delta?.partial_json) {
        a.part.call.function.arguments += delta.partial_json;
      }
    }
  };

  // Signal start
  yield message;

  for await (const lines of streamSSE(response)) {
    for (const raw of lines) {
      let evt: any;
      try {
        evt = JSON.parse(raw);
      } catch {
        continue;
      }

      const t = evt.type;
      if (!t) continue;

      if (t == "content_block_start") {
        begin(evt.index, evt.content_block);
      } else if (t == "content_block_delta") {
        append(evt.index, evt.delta);
      } else if (t == "error" || t == "message_error" || t == "fatal_error") {
        const msg = evt.error?.message || evt.message || "Anthropic stream error";
        throw new Error(msg);
      }
      // Ignore other event types (message_start, content_block_stop, message_delta, message_stop)
    }
    yield message;
  }

  const endTime = performance.now();
  const textLength = message.content.reduce(
    (sum, part) => (part.type === "text" ? sum + part.text.length : sum),
    0,
  );
  const estTokens = textLength ? Math.ceil(textLength / 4) : 0;
  const ttft = startContentTime ? `${(startContentTime - startTime).toFixed(0)}ms` : "N/A";
  const tps =
    startContentTime && estTokens
      ? (estTokens / ((endTime - startContentTime) / 1000)).toFixed(0)
      : "N/A";
  console.log(`TTFT ${ttft}, TPS ${tps}`);

  if (!message.content.length) throw new Error("[EMPTY]");
};

export const constructAnthropic = () =>
  constructBase(async (messages: Message[], options: OptionsInference, auth: string) => {
    const { system, messages: serialized } = await serializeForAnthropic(messages);

    const body: Dict = {
      model: options.model,
      messages: serialized,
      stream: true,
    };

    if (system) body.system = system;

    if (options.tools.length > 0) {
      body.tools = options.tools.map((tool: any) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
      }));
    }

    body.max_tokens = 34000;
    if (options.thinkingBudget) {
      body.thinking = { type: "enabled", budget_tokens: options.thinkingBudget };
    }

    const headers: Headerslike = {
      "x-api-key": auth,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };

    const request: Requestlike = {
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    return {
      request,
      parse: async function* (response: Response, startTime: number) {
        yield* parseAnthropicStream(response, { startTime });
      },
    };
  });
