// import type { OpenAIMessage, AssistantMessage } from "../../types";
// import { BaseProtocol } from "./base";
// import streamSSE from "../stream-sse";

// /**
//  * ResponsesProtocol - For OpenAI's Responses API (successor to chat/completions)
//  * Handles the newer event-based streaming format with granular deltas
//  */
// export abstract class ResponsesProtocol extends BaseProtocol {
//   abstract get baseURL(): string;

//   get endpoint(): string {
//     return `${this.baseURL}/v1/responses`;
//   }

//   buildRequest(messages: OpenAIMessage[], model: string, auth: string): RequestInit {
//     const headers: Record<string, string> = {
//       authorization: `Bearer ${auth}`,
//       "content-type": "application/json",
//     };

//     // Convert messages to input format
//     // For simplicity, we'll use the array format
//     const input = messages.map((msg) => {
//       if (msg.role === "system") {
//         // System messages become instructions in Responses API
//         return null;
//       }
//       return msg;
//     }).filter(Boolean);

//     // Extract system message as instructions
//     const systemMsg = messages.find((m) => m.role === "system");
//     const instructions = systemMsg?.content;

//     const body: Record<string, any> = {
//       model,
//       input,
//       stream: true,
//     };

//     if (instructions) {
//       body.instructions = instructions;
//     }

//     return {
//       method: "POST",
//       headers,
//       body: JSON.stringify(body),
//     };
//   }

//   async *parseStream(response: Response, startTime: number): AsyncGenerator<AssistantMessage> {
//     const message: AssistantMessage = { role: "assistant" };
//     let startContentTime = 0;

//     yield message; // indicate start

//     for await (const lines of streamSSE(response)) {
//       for (const line of lines) {
//         const event = JSON.parse(line);

//         // Handle different event types
//         switch (event.type) {
//           case "response.output_text.delta": {
//             const delta = event.delta;
//             if (delta) {
//               startContentTime ||= performance.now();
//               message.content ||= "";
//               message.content += delta;
//             }
//             break;
//           }

//           case "response.reasoning_text.delta": {
//             const delta = event.delta;
//             if (delta) {
//               message.reasoning ||= "";
//               message.reasoning += delta;
//             }
//             break;
//           }

//           case "response.reasoning_summary_text.delta": {
//             const delta = event.delta;
//             if (delta) {
//               message.reasoning ||= "";
//               message.reasoning += delta;
//             }
//             break;
//           }

//           case "response.function_call_arguments.delta": {
//             // Handle tool calls
//             const delta = event.delta;
//             const itemId = event.item_id;
//             message.tool_calls ||= [];

//             // Find or create tool call
//             let toolCall = message.tool_calls.find((tc) => tc.id === itemId);
//             if (!toolCall) {
//               toolCall = {
//                 id: itemId,
//                 type: "function",
//                 function: { name: "", arguments: "" },
//               };
//               message.tool_calls.push(toolCall);
//             }

//             toolCall.function.arguments += delta;
//             break;
//           }

//           case "response.function_call_arguments.done": {
//             // Finalize tool call
//             const itemId = event.item_id;
//             const name = event.name;
//             const args = event.arguments;

//             message.tool_calls ||= [];
//             let toolCall = message.tool_calls.find((tc) => tc.id === itemId);
//             if (!toolCall) {
//               toolCall = {
//                 id: itemId,
//                 type: "function",
//                 function: { name, arguments: args },
//               };
//               message.tool_calls.push(toolCall);
//             } else {
//               toolCall.function.name = name;
//               toolCall.function.arguments = args;
//             }
//             break;
//           }

//           case "response.failed": {
//             const error = event.response?.error;
//             throw new Error(error?.message || "Response failed");
//           }

//           case "error": {
//             throw new Error(event.message || `Error ${event.code}`);
//           }

//           // Ignore other event types
//           default:
//             break;
//         }
//       }

//       yield message;
//     }

//     const endTime = performance.now();
//     const estTokens = message.content ? Math.ceil(message.content.length / 4) : 0;
//     console.log(
//       `TTFT ${(startContentTime - startTime).toFixed(0)}ms, TPS ${(estTokens / ((endTime - startContentTime) / 1000)).toFixed(0)}`
//     );

//     if (!message.content && !message.tool_calls) {
//       throw new Error("[EMPTY]");
//     }
//   }
// }
