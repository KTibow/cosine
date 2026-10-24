import type { AssistantMessage, AssistantToolCallPart, Message, UserMessage } from '../../types';
import streamSSE from '../stream-sse';
import { constructBase, type Dict, type Headerslike, type Requestlike } from './_base';

// Models from before adaptive thinking, which only take a fixed budget
export const isLegacyClaude = (model: string) =>
  /^claude-(3|(opus|sonnet|haiku)-4(-[015])?(-\d{8})?$)/.test(model);

// Models that opt into Anthropic retrying policy refusals on another model
const hasServerFallback = (model: string) =>
  /^claude-(fable-5-1|opus-5-5|opus-5|sonnet-5-5)$/.test(model);

const convertUserMessage = async (message: UserMessage) => {
  if ('imageURI' in message) {
    const url = message.imageURI;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { type: 'image', source: { type: 'url', url } };
    }
    const { mimeType, base64 } = await message.deconstruct();
    return { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };
  }
  return { type: 'text', text: message.content };
};

const toAnthropic = async (messages: Message[]) => {
  const system: string[] = [];
  const out: { role: 'user' | 'assistant'; content: Dict[] }[] = [];
  const push = (role: 'user' | 'assistant', block: Dict) => {
    const last = out.at(-1);
    if (last?.role == role) last.content.push(block);
    else out.push({ role, content: [block] });
  };

  for (const message of messages) {
    if (message.role == 'system') {
      system.push(message.content);
    } else if (message.role == 'user') {
      push('user', await convertUserMessage(message));
    } else {
      // Thinking and tool calls are left behind: Anthropic ran the tools itself,
      // and old thinking isn't needed outside a tool loop.
      const text = message.content
        .map((part) => (part.type == 'text' ? part.text : ''))
        .join('')
        .trim();
      if (text) push('assistant', { type: 'text', text });
    }
  }

  return { system: system.join('\n'), messages: out };
};

async function* receive(r: Response, { startTime }: { startTime: number }) {
  const message: AssistantMessage = { role: 'assistant', content: [] };
  const blocks: Record<number, { type: string; part?: AssistantMessage['content'][number] }> = {};
  const toolsById: Record<string, AssistantToolCallPart> = {};
  const citations = new Map<string, string>();
  let startContentTime = 0;
  let refusal: string | undefined;

  const begin = (index: number, block: Dict) => {
    if (block.type == 'text') {
      // Citations split one answer into many blocks, so they're joined back up
      let part = message.content.at(-1);
      if (part?.type != 'text') {
        part = { type: 'text', text: '' };
        message.content.push(part);
      }
      blocks[index] = { type: 'text', part };
    } else if (block.type == 'thinking') {
      const part = { type: 'reasoning' as const, category: 'summary' as const, text: '' };
      message.content.push(part);
      blocks[index] = { type: 'thinking', part };
    } else if (block.type == 'server_tool_use') {
      const part: AssistantToolCallPart = {
        type: 'tool_call',
        status: 'in_progress',
        name: block.name,
        arguments: '',
      };
      toolsById[block.id] = part;
      message.content.push(part);
      blocks[index] = { type: 'server_tool_use', part };
    } else if (block.type.endsWith('_tool_result')) {
      const part = toolsById[block.tool_use_id];
      if (part) {
        const content = block.content;
        if (Array.isArray(content)) {
          part.output = content.map((r: Dict) => `- [${r.title || r.url}](${r.url})`).join('\n');
        } else if (content?.stdout != undefined || content?.stderr) {
          part.output = [content.stdout, content.stderr].filter(Boolean).join('\n');
        } else if (!content?.type?.startsWith('encrypted_')) {
          part.output = JSON.stringify(content);
        }
        part.status = 'completed';
      }
      blocks[index] = { type: block.type };
    } else {
      blocks[index] = { type: block.type };
    }
  };

  const append = (index: number, delta: Dict) => {
    const part = blocks[index]?.part;
    if (!part) return;
    if (delta.type == 'text_delta' && part.type == 'text') {
      if (delta.text) startContentTime ||= performance.now();
      part.text += delta.text;
    } else if (delta.type == 'thinking_delta' && part.type == 'reasoning' && 'text' in part) {
      part.text += delta.thinking;
    } else if (delta.type == 'input_json_delta' && part.type == 'tool_call') {
      part.arguments += delta.partial_json;
    } else if (delta.type == 'citations_delta') {
      const { url, title } = delta.citation || {};
      if (url) citations.set(url, title || 'Source');
    }
  };

  yield message;

  for await (const lines of streamSSE(r)) {
    for (const line of lines) {
      const event = JSON.parse(line);
      if (event.type == 'content_block_start') {
        begin(event.index, event.content_block);
      } else if (event.type == 'content_block_delta') {
        append(event.index, event.delta);
      } else if (event.type == 'message_delta' && event.delta?.stop_reason == 'refusal') {
        refusal = event.delta.stop_details?.category || 'unknown';
      } else if (event.type == 'error') {
        throw new Error(event.error?.message || 'Anthropic stream error');
      }
    }
    yield message;
  }

  // Thinking can come back empty or as a placeholder between tool calls
  message.content = message.content.filter(
    (part) => !(part.type == 'reasoning' && 'text' in part && !part.text.trim()),
  );
  const lastText = message.content.findLast((part) => part.type == 'text');
  if (citations.size && lastText?.type == 'text') {
    const sources = [...citations].map(([url, title]) => `- [${title}](${url})`).join('\n');
    lastText.text += `\n\n---\n\n**Sources**\n\n${sources}`;
  }
  yield message;

  const endTime = performance.now();
  const textLength = message.content.reduce(
    (sum, part) => (part.type == 'text' ? sum + part.text.length : sum),
    0,
  );
  const estTokens = Math.ceil(textLength / 4);
  const genTime = endTime - startContentTime;
  console.log(
    `TTFT ${(startContentTime - startTime).toFixed(0)}ms, gen ${genTime.toFixed(0)}ms, TPS ${(estTokens / (genTime / 1000)).toFixed(0)}`,
  );

  if (refusal) throw new Error(`Refused (${refusal})`);
  if (!message.content.length) throw new Error('[EMPTY]');
}

export const constructAnthropic = () =>
  constructBase(async (messages, options, auth) => {
    const { system, messages: serialized } = await toAnthropic(messages);
    const model = options.model;
    const effort = options.reasoningEffort;

    const body: Dict = {
      model,
      messages: serialized,
      max_tokens: 32000,
      stream: true,
      cache_control: { type: 'ephemeral' },
    };
    if (system) body.system = system;
    if (options.tools.length > 0) body.tools = options.tools;

    if (effort == 'none') {
      body.thinking = { type: 'disabled' };
    } else if (effort && isLegacyClaude(model)) {
      body.thinking = { type: 'enabled', budget_tokens: 16000 };
    } else if (effort) {
      body.thinking = { type: 'adaptive', display: 'summarized' };
      body.output_config = { effort };
    }

    const headers: Headerslike = {
      'x-api-key': auth,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
    if (hasServerFallback(model)) {
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
      body.fallbacks = 'default';
    }

    const request: Requestlike = {
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    };

    return {
      request,
      parse: async function* (response: Response, startTime: number) {
        yield* receive(response, { startTime });
      },
    };
  });
