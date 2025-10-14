import type { AssistantMessage } from "../types";
import lineByLine from "./line-by-line";

export default async function* (r: Response, { startTime }: { startTime: number }) {
  const message: AssistantMessage = { role: "assistant", content: "" };
  let redirectReasoning = false;
  let startContentTime = 0;

  for await (const line of lineByLine(r)) {
    const data = JSON.parse(line);

    const error = data.error || { message: undefined, code: undefined };
    const delta = data.choices?.[0]?.delta as {
      content?: string;
      reasoning?: string;
      tool_calls?: any;
    };

    if (error.code) {
      throw new Error(`Error ${error.code}`);
    }

    let content = delta?.content;
    let reasoning = delta?.reasoning;
    const tool_calls = delta?.tool_calls;
    if (content == "<think>") {
      redirectReasoning = true;
      continue;
    }
    if (content?.includes("</think>")) {
      reasoning = content.split("</think>")[0];
      content = content.split("</think>")[1] || "";
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
      message.reasoning ||= "";
      message.reasoning += reasoning;
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
