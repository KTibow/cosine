import type { AssistantMessage, Message } from "../../types";
import type {
  ChatCompletionsAssistantMessage,
  ChatCompletionsMessage,
  ChatCompletionsToolCall,
} from "./_chatcompletionstypes";
import { convertUserMessage } from "./_basesend";

const convertAssistantMessage = (message: AssistantMessage): ChatCompletionsAssistantMessage => {
  const toolCalls: ChatCompletionsToolCall[] = [];
  let textContent = "";

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
    }
  }

  const assistant: ChatCompletionsAssistantMessage = { role: "assistant" };
  if (textContent) assistant.content = textContent;
  if (toolCalls.length) assistant.tool_calls = toolCalls;
  return assistant;
};

export default (messages: Message[], inlineImages: boolean): Promise<ChatCompletionsMessage[]> =>
  Promise.all(
    messages.map((message) => {
      if (message.role == "assistant") {
        return convertAssistantMessage(message);
      }
      if (message.role == "user") {
        return convertUserMessage(message, inlineImages);
      }
      return message;
    }),
  );
