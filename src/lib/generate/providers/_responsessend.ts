import type { AssistantMessage, Message, ToolMessage } from '../../types';
import { convertUserMessage } from './_basesend';

const convertAssistantMessage = (message: AssistantMessage) => {
  const output: any[] = [];
  for (const part of message.content) {
    if (part.type == 'text') {
      output.push({ role: 'assistant', content: part.text });
    } else if (part.type == 'tool_call') {
      output.push({
        type: 'function_call',
        status: part.status,
        call_id: part.call.id,
        name: part.call.function.name,
        arguments: part.call.function.arguments,
      });
    }
  }
  return output;
};

const convertToolOutputMessage = (message: ToolMessage) => {
  return {
    type: 'function_call_output',
    call_id: message.tool_call_id,
    output: message.content,
  };
};

export default async (messages: Message[], inlineImages: boolean) => {
  const converted = await Promise.all(
    messages.flatMap((message) => {
      if (message.role == 'user') {
        return convertUserMessage(message, inlineImages);
      }
      if (message.role == 'assistant') {
        return convertAssistantMessage(message);
      }
      if (message.role == 'tool') {
        return convertToolOutputMessage(message);
      }
      return message;
    }),
  );
  const systemMessage = converted.find((msg) => msg.role == 'system');
  const input = converted.filter((msg) => msg.role != 'system');

  return {
    input,
    instructions: systemMessage?.content,
  };
};
