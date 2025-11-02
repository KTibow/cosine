import type { AssistantMessage } from "../../types";
import streamSSE from "../stream-sse";

export default async function* (r: Response, { startTime }: { startTime: number }) {
  const message: AssistantMessage = { role: "assistant" };
  let redirectReasoning = false;
  let startContentTime = 0;

  yield message; // indicate start
  for await (const lines of streamSSE(r)) {
    for (const line of lines) {
      const data = JSON.parse(line);

      const error = data.error || { message: undefined, code: undefined };
      if (error.code) {
        throw new Error(`Error ${error.code}`);
      }

      const delta = data.choices?.[0]?.delta as {
        content?: string;
        reasoning?: string;
        reasoning_text?: string;
        reasoning_content?: string;
        extra_content?: any;
        tool_calls?: any;
      };
      if (!delta) {
        continue;
      }

      let content = delta.content;
      let reasoning = delta.reasoning || delta.reasoning_content; // reasoning_content is xai
      const tool_calls = delta.tool_calls;
      // github copilot nonstandard field
      if (delta.reasoning_text) {
        message.reasoning ||= [];
        message.reasoning.push({
          type: "summary",
          text: delta.reasoning_text.trim(),
        });
      }
      // gemini uses <thought>
      if (delta.extra_content?.google?.thought && delta.content) {
        message.reasoning ||= [];
        message.reasoning.push({
          type: "summary",
          text: delta.content.replace("<thought>", ""),
        });
        content = "";
      }
      if (content && content.startsWith("</thought>")) {
        content = content.replace("</thought>", "");
      }
      // qwen, gpt-oss use <think>
      if (content == "<think>") {
        redirectReasoning = true;
        continue;
      }
      if (content?.includes("</think>")) {
        if (message.content) {
          content = `${message.content}${content}`;
          message.content = "";
        }
        reasoning = content.split("</think>")[0];
        content = content.split("</think>")[1];

        redirectReasoning = false;
      }
      if (redirectReasoning) {
        reasoning = content;
        content = "";
      }
      if (content) {
        startContentTime ||= performance.now();
        message.content ||= "";
        message.content += content;
      }
      if (reasoning) {
        let canContinue = Boolean(message.reasoning);
        if (!canContinue && reasoning.trim()) {
          message.reasoning = [];
          canContinue = true;
        }
        if (canContinue) {
          let entry = message.reasoning?.[0];
          if (!entry) {
            entry = { type: "text", text: "" };
            message.reasoning ||= [];
            message.reasoning.push(entry);
          }
          if (entry.type != "text") {
            throw new Error("Mismatched reasoning type");
          }
          entry.text += reasoning;
        }
      }
      if (tool_calls) {
        message.tool_calls ||= [];
        let i = 0;
        for (const call of tool_calls) {
          const index = call.index ?? i;
          if (!message.tool_calls[index]) {
            message.tool_calls[index] = {
              id: call.id,
              type: "function",
              function: { name: call.function.name, arguments: "" },
            };
          }
          const args = call.function.arguments || "";
          message.tool_calls[index].function.arguments += args;
          i++;
        }
      }
    }

    yield message;
  }
  const endTime = performance.now();
  const estTokens = message.content ? Math.ceil(message.content.length / 4) : 0;
  console.log(
    `TTFT ${(startContentTime - startTime).toFixed(0)}ms, TPS ${(estTokens / ((endTime - startContentTime) / 1000)).toFixed(0)}`,
  );

  if (!message.content && !message.tool_calls) {
    throw new Error("[EMPTY]");
  }
}
