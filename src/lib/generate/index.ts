import { snackbar } from 'm3-svelte';
import type { Message, Stack, AssistantMessage } from '../types';
import fetchRemote from './fetch.remote';
import { providers } from './providers';
import { toolSpecsFor, type ToolName } from '../tools';

export default async function (
  messages: Message[],
  stack: Stack,
  addMessage: <T extends Message>(base: T) => T,
  signal?: AbortSignal,
  enabledTools: ToolName[] = [],
) {
  for (const { provider, options } of stack) {
    try {
      const generate = providers[provider];
      if (!generate) {
        throw new Error(`Provider ${provider} not implemented`);
      }

      // Tools run on the provider's side, so one request covers the whole
      // exchange — there's nothing to execute and feed back here.
      const inferenceOptions = {
        ...options,
        tools: toolSpecsFor(provider, options.model, enabledTools),
      };

      let lastMessage: AssistantMessage | undefined;
      for await (const message of generate(
        messages,
        inferenceOptions,
        'SERVER_KEY',
        async (request) => {
          return await fetchRemote(request, { signal });
        },
      )) {
        if (message.role != 'assistant') throw new Error('Unexpected role');

        if (!lastMessage) {
          lastMessage = addMessage(message);
        } else {
          Object.assign(lastMessage, message);
        }
      }

      return; // Success!
    } catch (e) {
      console.error(e);

      const message = e instanceof Error ? e.message : String(e);
      if (stack.length > 1) {
        snackbar(`${provider} failed (${message})`);
      } else {
        snackbar(`Generation failed (${message})`);
      }
    }
  }

  if (stack.length < 1) {
    snackbar(`No providers found`);
  }
  if (stack.length > 1) {
    snackbar(`All providers failed`);
  }
}
