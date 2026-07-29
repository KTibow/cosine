import type { AssistantMessage, Message } from '../../types';
import type {
  ChatCompletionsAssistantMessage,
  ChatCompletionsMessage,
} from './_chatcompletionstypes.internal';
import { convertUserMessage } from './_basesend';

const convertAssistantMessage = async (
  message: AssistantMessage,
): Promise<ChatCompletionsAssistantMessage> => {
  // Tool calls are left behind: the provider ran them itself, so replaying them
  // would be sending back half of its own bookkeeping.
  let textContent = '';

  for (const part of message.content) {
    if (part.type == 'text') {
      textContent += part.text;
    }
  }

  const assistant: ChatCompletionsAssistantMessage = { role: 'assistant' };

  if (textContent.includes('blob:')) {
    const content: Array<
      { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
    > = [];
    const parts = textContent.split(/(!\[.*?\]\(blob:.*?\))/g);

    for (const part of parts) {
      if (!part) continue;

      const blobMatch = part.match(/^!\[.*?\]\((blob:.*?)\)$/);
      if (blobMatch) {
        const blobUrl = blobMatch[1];
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          content.push({ type: 'image_url', image_url: { url: base64 } });
        } catch (e) {
          content.push({ type: 'text', text: part });
        }
      } else {
        content.push({ type: 'text', text: part });
      }
    }

    assistant.content = content;
  } else if (textContent) {
    assistant.content = textContent;
  }

  return assistant;
};

export default (messages: Message[], inlineImages: boolean): Promise<ChatCompletionsMessage[]> =>
  Promise.all(
    messages.map((message) => {
      if (message.role == 'assistant') {
        return convertAssistantMessage(message);
      }
      if (message.role == 'user') {
        return convertUserMessage(message, inlineImages);
      }
      return message;
    }),
  );
