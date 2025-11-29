import type { AssistantMessage, Message } from "../../types";
import type {
  ChatCompletionsAssistantMessage,
  ChatCompletionsMessage,
  ChatCompletionsToolCall,
} from "./_chatcompletionstypes.internal";
import { convertUserMessage } from "./_basesend";

const GITHUB_COPILOT_URL = "https://api.githubcopilot.com/chat/completions";

const convertAssistantMessage = (
  message: AssistantMessage,
  targetUrl: string,
): ChatCompletionsAssistantMessage => {
  const toolCalls: ChatCompletionsToolCall[] = [];
  let textContent = "";
  let reasoningOpaque: string | undefined;

  for (const part of message.content) {
    if (part.type == "text") {
      textContent += part.text;
    } else if (part.type == "tool_call") {
      toolCalls.push({
        id: part.call.id,
        type: part.call.type,
        function: {
          name: part.call.function.name,
          arguments: part.call.function.arguments,
        },
      });
    } else if (
      part.type == "reasoning" &&
      part.category == "encrypted" &&
      part.source === GITHUB_COPILOT_URL &&
      targetUrl === GITHUB_COPILOT_URL
    ) {
      reasoningOpaque = part.data;
    }
  }

  const assistant: ChatCompletionsAssistantMessage = { role: "assistant" };
  if (textContent) assistant.content = textContent;
  if (toolCalls.length) assistant.tool_calls = toolCalls;
  if (reasoningOpaque) assistant.reasoning_opaque = reasoningOpaque;
  return assistant;
};

export default (
  messages: Message[],
  inlineImages: boolean,
  targetUrl: string,
): Promise<ChatCompletionsMessage[]> =>
  Promise.all(
    messages.map((message) => {
      if (message.role == "assistant") {
        return convertAssistantMessage(message, targetUrl);
      }
      if (message.role == "user") {
        return convertUserMessage(message, inlineImages);
      }
      return message;
    }),
  );
