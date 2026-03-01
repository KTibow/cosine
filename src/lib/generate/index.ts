import { snackbar } from 'm3-svelte';
import { getStorage } from 'monoidentity';
import type { Message, Stack, AssistantMessage } from '../types';
import fetchRemote from './fetch.remote';
import { providers } from './providers';
import getAccessToken from './copilot/get-access-token';
import { tools, toolDefinitions } from '../tools';

export default async function (
  messages: Message[],
  stack: Stack,
  addMessage: <T extends Message>(base: T) => T,
  signal?: AbortSignal,
  enabledTools: string[] = [],
) {
  const configuredProviders = getStorage('config').providers || {};

  for (const { provider, options } of stack) {
    try {
      const generate = providers[provider];
      if (!generate) {
        throw new Error(`Provider ${provider} not implemented`);
      }

      let allMessages = [...messages];
      for (let iterations = 0; iterations < 30; iterations++) {
        let lastMessage: AssistantMessage | undefined;

        const enhancedOptions = {
          ...options,
          tools: toolDefinitions.filter((def) => enabledTools.includes(def.function.name)),
          initiator: iterations == 0 ? 'user' : 'agent',
        };

        let auth = 'SERVER_KEY';
        if (provider == 'GitHub Models') {
          const token = configuredProviders.ghm?.token;
          if (!token) throw new Error('No GitHub token provided');
          auth = token;
        }
        if (provider == 'GitHub Copilot') {
          const token = configuredProviders.ghc?.token;
          if (!token) throw new Error('No GitHub token provided');
          auth = await getAccessToken(token);
        }

        for await (const message of generate(
          allMessages,
          enhancedOptions,
          auth,
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

        if (!lastMessage) break;

        // Mark all tool calls as completed after streaming finishes
        for (const part of lastMessage.content) {
          if (part.type == 'tool_call') {
            part.status = 'completed';
          }
        }

        // Add the assistant message to our working array
        allMessages.push(lastMessage);

        // Check if there are tool calls to execute
        const toolCalls = lastMessage.content.filter((part) => part.type === 'tool_call');
        if (toolCalls.length == 0) break;

        // Execute tool calls
        for (const toolCall of toolCalls) {
          if (toolCall.type != 'tool_call') continue;

          const toolName = toolCall.call.function.name;
          const tool = tools[toolName];

          let toolMessageBase: Message;
          if (!tool) {
            toolMessageBase = {
              role: 'tool',
              content: `Error: Tool ${toolName} not found`,
              tool_call_id: toolCall.call.id,
            };
          } else {
            try {
              const args = JSON.parse(toolCall.call.function.arguments);
              const result = await tool(args);
              toolMessageBase = {
                role: 'tool',
                content: result,
                tool_call_id: toolCall.call.id,
              };
            } catch (e) {
              toolMessageBase = {
                role: 'tool',
                content: `Error executing tool: ${e instanceof Error ? e.message : String(e)}`,
                tool_call_id: toolCall.call.id,
              };
            }
          }

          const toolMessage = addMessage(toolMessageBase);
          allMessages.push(toolMessage);
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
