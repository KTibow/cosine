import type { AssistantMessage, Message, UserMessage } from "../../types";
import type {
  ChatCompletionsAssistantMessage,
  ChatCompletionsMessage,
  ChatCompletionsToolCall,
} from "./_chatcompletionstypes";

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

const convertUserMessage = async (
  message: UserMessage,
  inlineImages: boolean,
): Promise<ChatCompletionsMessage> => {
  if ("imageURI" in message) {
    let url = message.imageURI;
    const mustInline =
      inlineImages ||
      url.startsWith("blob:") ||
      (!url.startsWith("data:") && !url.startsWith("http://") && !url.startsWith("https://"));

    if (mustInline && !url.startsWith("data:")) {
      const buffer = await message.asBuffer();
      const arr = new Uint8Array(buffer);
      url = `data:image/png;base64,${arr.toBase64()}`;
    }

    return {
      role: "user",
      content: [{ type: "image_url", image_url: { url } }],
    };
  }

  return {
    role: "user",
    content: message.content,
  };
};

export default async (messages: Message[], inlineImages: boolean) => {
  const converted = await Promise.all(
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
  const systemMessage = converted.find((msg) => msg.role == "system");
  const input = converted.filter((msg) => msg.role != "system");

  return {
    input,
    instructions: systemMessage?.content,
  };
};
