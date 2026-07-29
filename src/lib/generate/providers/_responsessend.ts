import type { AssistantMessage, Message } from '../../types';
import { convertUserMessage } from './_basesend';

const convertAssistantMessage = (message: AssistantMessage) => {
  // Tool calls are left behind: the provider ran them itself, so replaying them
  // would be sending back half of its own bookkeeping.
  const output: any[] = [];
  for (const part of message.content) {
    if (part.type == 'text') {
      output.push({ role: 'assistant', content: part.text });
    }
  }
  return output;
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
