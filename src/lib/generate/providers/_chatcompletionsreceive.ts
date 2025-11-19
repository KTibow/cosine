import type { AssistantMessage, AssistantToolCallPart } from "../../types";
import streamSSE from "../stream-sse";

export default async function* (
  r: Response,
  { url, startTime }: { url: string; startTime: number },
) {
  const message: AssistantMessage = { role: "assistant", content: [] };
  let redirectReasoning = false;
  let startContentTime = 0;
  const toolCallsByIndex: AssistantToolCallPart[] = [];

  const append = (type: "text" | "reasoning", text: string, category?: "text" | "summary") => {
    if (!text) return;

    const last = message.content[message.content.length - 1];

    if (type == "text" && last?.type == "text") {
      last.text += text;
    } else if (type == "reasoning" && last?.type == "reasoning" && last.category == category) {
      last.text += text;
    } else if (text.trim()) {
      message.content.push(
        type == "text" ? { type: "text", text } : { type: "reasoning", category: category!, text },
      );
    }

    if (type == "text") startContentTime ||= performance.now();
  };
  const addReasoningSummary = (text: string) => {
    if (!text.trim()) return;
    message.content.push({
      type: "reasoning",
      category: "summary",
      text: text,
    });
  };

  yield message;

  for await (const lines of streamSSE(r)) {
    for (const line of lines) {
      const data = JSON.parse(line);

      const error = data.error || { message: undefined, code: undefined };
      if (error.code) throw new Error(`Error ${error.code}`);

      const delta = data.choices?.[0]?.delta;
      if (!delta) continue;

      let content = delta.content;
      let reasoning = delta.reasoning || delta.reasoning_content;
      const tool_calls = delta.tool_calls;

      // Gemini via GitHub Copilot CC
      if (delta.reasoning_text) {
        addReasoningSummary(delta.reasoning_text);
      }
      if (delta.reasoning_opaque) {
        message.content.push({
          type: "reasoning",
          category: "encrypted",
          data: delta.reasoning_opaque,
          source: url,
        });
      }

      // Gemini via direct CC
      if (delta.extra_content?.google?.thought && content) {
        addReasoningSummary(content.replace("<thought>", ""));
        content = "";
      }

      if (content?.startsWith("</thought>")) {
        content = content.replace("</thought>", "");
      }

      // Qwen, GPT-OSS
      if (content == "<think>") {
        redirectReasoning = true;
        continue;
      }

      if (content?.includes("</think>")) {
        const last = message.content.at(-1);
        if (last?.type == "text") {
          content = last.text + content;
          message.content.pop();
        }
        [reasoning, content] = content.split("</think>");

        redirectReasoning = false;
      }

      if (redirectReasoning) {
        reasoning = content;
        content = "";
      }

      if (content) append("text", content);
      if (reasoning) append("reasoning", reasoning, "text");

      if (tool_calls) {
        let i = 0;
        for (const call of tool_calls) {
          const index = call.index ?? i;

          if (!toolCallsByIndex[index]) {
            const part: AssistantToolCallPart = {
              type: "tool_call",
              status: "in_progress",
              call: {
                id: call.id || "",
                type: "function",
                function: { name: "", arguments: "" },
              },
            };
            toolCallsByIndex[index] = part;
            message.content.push(part);
          }

          const part = toolCallsByIndex[index];
          if (call.function?.name) part.call.function.name = call.function.name;
          if (call.function?.arguments) part.call.function.arguments += call.function.arguments;
          if (call.id) part.call.id = call.id;

          i++;
        }
      }
    }

    yield message;
  }

  for (const part of message.content) {
    if (part.type == "tool_call") part.status = "completed";
  }

  const endTime = performance.now();
  const textLength = message.content.reduce(
    (sum, part) => (part.type == "text" ? sum + part.text.length : sum),
    0,
  );
  const estTokens = Math.ceil(textLength / 4);
  console.log(
    `TTFT ${(startContentTime - startTime).toFixed(0)}ms, TPS ${(estTokens / ((endTime - startContentTime) / 1000)).toFixed(0)}`,
  );

  if (!message.content.length) {
    throw new Error("[EMPTY]");
  }
}
