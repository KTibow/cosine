// import * as env from "$env/static/private";
// import { fn } from "monoserve";
// import { array, object, optional, string, boolean } from "valibot";
// import { openAIMessage } from "/lib/types";
// import createProtocol from "./core/create-protocol";
// import directory from "./directory";
// import type { Provider } from "./directory";

// const bodySchema = object({
//   messages: array(openAIMessage),
//   model: string(),
//   stream: optional(boolean()),
// });

// /**
//  * OpenAI-compatible chat/completions endpoint
//  * Maps model names to providers and streams responses
//  */
// export default fn(bodySchema, async ({ messages, model, stream: shouldStream = true }) => {
//   // Map model name to provider
//   // For now, use a simple mapping. In the future, this could be more sophisticated
//   const provider = resolveProvider(model);

//   if (!provider) {
//     throw new Response(`Model ${model} not found`, { status: 404 });
//   }

//   // Server-side auth resolver - uses environment variables
//   const getAuth = async () => {
//     const config = directory[provider];
//     if (config.key === "user") {
//       throw new Response("User auth not available server-side", { status: 400 });
//     }
//     const key = (env as Record<string, string>)[config.key];
//     if (!key) {
//       throw new Response(`No key for provider ${provider}`, { status: 500 });
//     }
//     return key;
//   };

//   const protocol = createProtocol(provider, fetch, getAuth);

//   if (!shouldStream) {
//     // Non-streaming: collect all chunks and return final message
//     let finalMessage: any = null;
//     for await (const chunk of protocol.generate(messages, model)) {
//       finalMessage = chunk;
//     }

//     return Response.json({
//       id: `chatcmpl-${Date.now()}`,
//       object: "chat.completion",
//       created: Math.floor(Date.now() / 1000),
//       model,
//       choices: [
//         {
//           index: 0,
//           message: finalMessage,
//           finish_reason: "stop",
//         },
//       ],
//     });
//   }

//   // Streaming: convert our generator to OpenAI SSE format
//   const encoder = new TextEncoder();
//   const streamBody = new ReadableStream({
//     async start(controller) {
//       try {
//         let isFirst = true;
//         for await (const chunk of protocol.generate(messages, model)) {
//           if (isFirst) {
//             // Skip the first empty chunk
//             isFirst = false;
//             continue;
//           }

//           // Convert to OpenAI streaming format
//           const delta: any = {};
//           if (chunk.content) delta.content = chunk.content;
//           if (chunk.reasoning) delta.reasoning = chunk.reasoning;
//           if (chunk.tool_calls) delta.tool_calls = chunk.tool_calls;

//           const sseData = {
//             id: `chatcmpl-${Date.now()}`,
//             object: "chat.completion.chunk",
//             created: Math.floor(Date.now() / 1000),
//             model,
//             choices: [
//               {
//                 index: 0,
//                 delta,
//                 finish_reason: null,
//               },
//             ],
//           };

//           controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
//         }

//         // Send final [DONE] message
//         controller.enqueue(encoder.encode("data: [DONE]\n\n"));
//         controller.close();
//       } catch (error) {
//         controller.error(error);
//       }
//     },
//   });

//   return new Response(streamBody, {
//     headers: {
//       "content-type": "text/event-stream",
//       "cache-control": "no-cache",
//       connection: "keep-alive",
//     },
//   });
// });

// /**
//  * Resolve model name to provider
//  * This is a simple implementation - could be made more sophisticated
//  */
// function resolveProvider(model: string): Provider | null {
//   // Exact model name mapping
//   const modelMap: Record<string, Provider> = {
//     // Cerebras models
//     "llama3.1-8b": "Cerebras via Cosine",
//     "llama3.1-70b": "Cerebras via Cosine",

//     // Groq models
//     "llama-3.3-70b-versatile": "Groq via Cosine",
//     "llama-3.1-70b-versatile": "Groq via Cosine",

//     // GitHub Models
//     "gpt-4o": "GitHub Models",
//     "gpt-4o-mini": "GitHub Models",
//     "meta-llama-3.1-405b-instruct": "GitHub Models",

//     // Add more model mappings as needed
//   };

//   return modelMap[model] || null;
// }
