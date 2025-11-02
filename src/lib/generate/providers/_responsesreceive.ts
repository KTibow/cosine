import type { AssistantMessage } from "../../types";
import streamSSE from "../stream-sse";

export default async function* receive(
  response: Response,
  { startTime }: { startTime: number },
): AsyncGenerator<AssistantMessage> {
  const message: AssistantMessage = { role: "assistant" };
  let startContentTime = 0;

  yield message; // signal start

  for await (const lines of streamSSE(response)) {
    for (const line of lines) {
      const event = JSON.parse(line);

      if (event.type == "response.output_text.delta") {
        startContentTime ||= performance.now();
        message.content ||= "";
        message.content += event.delta;
      } else if (
        event.type == "response.reasoning_text.delta" ||
        event.type == "response.reasoning_summary_text.delta"
      ) {
        message.reasoning ||= "";
        message.reasoning += event.delta;
      } else if (event.type == "response.function_call_arguments.delta") {
        const delta = event.delta;
        const itemId = event.item_id;
        message.tool_calls ||= [];

        let toolCall = message.tool_calls.find((tc) => tc.id == itemId);
        if (!toolCall) {
          toolCall = {
            id: itemId,
            type: "function",
            function: { name: "", arguments: "" },
          };
          message.tool_calls.push(toolCall);
        }
        toolCall.function.arguments += delta;
      } else if (event.type == "response.function_call_arguments.done") {
        const itemId = event.item_id;
        const name = event.name;
        const args = event.arguments;

        message.tool_calls ||= [];
        let toolCall = message.tool_calls.find((tc) => tc.id == itemId);
        if (!toolCall) {
          toolCall = {
            id: itemId,
            type: "function",
            function: { name, arguments: args },
          };
          message.tool_calls.push(toolCall);
        } else {
          toolCall.function.name = name;
          toolCall.function.arguments = args;
        }
      } else if (event.type == "response.failed") {
        const error = event.response?.error;
        throw new Error(error?.message || "Response failed");
      } else if (event.type == "error") {
        throw new Error(event.message || `Error ${event.code}`);
      }
    }
    yield message;
  }

  const endTime = performance.now();
  const estTokens = message.content ? Math.ceil(message.content.length / 4) : 0;
  console.log(
    `TTFT ${(startContentTime - startTime).toFixed(0)}ms, TPS ${(
      estTokens /
      ((endTime - startContentTime) / 1000)
    ).toFixed(0)}`,
  );

  if (!message.content && !message.tool_calls) {
    throw new Error("[EMPTY]");
  }
}
