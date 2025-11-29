import type {
  AssistantMessage,
  AssistantReasoningPart,
  AssistantTextPart,
  AssistantToolCallPart,
} from "../../types";
import streamSSE from "../stream-sse";

export default async function* receive(
  response: Response,
  { url, startTime }: { url: string; startTime: number },
): AsyncGenerator<AssistantMessage> {
  const message: AssistantMessage = { role: "assistant", content: [] };
  let startContentTime = 0;

  const ensureTextPart = () => {
    const last = message.content[message.content.length - 1];
    if (last && last.type == "text") return last;
    const part: AssistantTextPart = { type: "text", text: "" };
    message.content.push(part);
    return part;
  };

  const appendText = (delta: string) => {
    if (!delta) return;
    const part = ensureTextPart();
    part.text += delta;
    startContentTime ||= performance.now();
  };

  const reasoningSummaries: Extract<AssistantReasoningPart, { category: "summary" }>[] = [];
  const ensureSummaryPart = (index: number) => {
    let summary = reasoningSummaries[index];
    if (!summary) {
      summary = reasoningSummaries[index] = { type: "reasoning", category: "summary", text: "" };
      message.content.push(summary);
    }
    return summary;
  };

  const toolCalls = new Map<number, AssistantToolCallPart>();
  const ensureToolCallPart = (index: number, id: string) => {
    let part = toolCalls.get(index);
    if (!part) {
      part = {
        type: "tool_call",
        status: "in_progress",
        call: {
          id,
          type: "function",
          function: { name: "", arguments: "" },
        },
      };
      toolCalls.set(index, part);
      message.content.push(part);
    }
    return part;
  };

  yield message; // signal start

  for await (const lines of streamSSE(response)) {
    for (const line of lines) {
      const event = JSON.parse(line);

      if (event.type == "response.output_text.delta") {
        appendText(event.delta);
      } else if (event.type == "response.reasoning_summary_text.delta") {
        const summary = ensureSummaryPart(event.summary_index);
        summary.text += event.delta;
      } else if (event.type == "response.output_item.added") {
        if (event.item?.type == "function_call") {
          const part = ensureToolCallPart(event.output_index, event.item.call_id);
          part.call.function.name = event.item.name;
        }
      } else if (event.type == "response.function_call_arguments.delta") {
        const part = toolCalls.get(event.output_index)!;
        part.call.function.arguments += event.delta;
      } else if (event.type == "response.failed") {
        const error = event.response?.error;
        throw new Error(error?.message || "Response failed");
      } else if (event.type == "response.output_item.done") {
        if (event.item.type == "reasoning") {
          message.content.push({
            type: "reasoning",
            category: "encrypted",
            data: event.item.encrypted_content,
            source: url,
          });
        } else if (event.item.type == "function_call") {
          const part = toolCalls.get(event.output_index)!;
          part.status = "completed";
        }
      } else if (event.type == "error") {
        throw new Error(event.message || `Error ${event.code}`);
      }
    }
    yield message;
  }

  const endTime = performance.now();
  const textLength = message.content.reduce(
    (sum, part) => (part.type == "text" ? sum + part.text.length : sum),
    0,
  );
  const estTokens = textLength ? Math.ceil(textLength / 4) : 0;
  const ttft = startContentTime ? `${(startContentTime - startTime).toFixed(0)}ms` : "N/A";
  const tps =
    startContentTime && estTokens
      ? (estTokens / ((endTime - startContentTime) / 1000)).toFixed(0)
      : "N/A";
  console.log(`TTFT ${ttft}, TPS ${tps}`);

  if (!message.content.length) {
    throw new Error("[EMPTY]");
  }
}
