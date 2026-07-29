import type { AssistantMessage, AssistantToolCallPart } from '../../types';
import streamSSE from '../stream-sse';

export default async function* (
  r: Response,
  { url, startTime }: { url: string; startTime: number },
) {
  const message: AssistantMessage = { role: 'assistant', content: [] };
  let redirectReasoning = false;
  let startContentTime = 0;
  const executedByIndex: AssistantToolCallPart[] = [];
  const citations = new Map<string, string>();

  const append = (type: 'text' | 'reasoning', text: string, category?: 'text' | 'summary') => {
    if (!text) return;

    const last = message.content[message.content.length - 1];

    if (type == 'text' && last?.type == 'text') {
      last.text += text;
    } else if (type == 'reasoning' && last?.type == 'reasoning' && last.category == category) {
      last.text += text;
    } else if (text.trim()) {
      message.content.push(
        type == 'text' ? { type: 'text', text } : { type: 'reasoning', category: category!, text },
      );
    }

    if (type == 'text') startContentTime ||= performance.now();
  };
  const addReasoningSummary = (text: string) => {
    if (!text.trim()) return;
    message.content.push({
      type: 'reasoning',
      category: 'summary',
      text: text,
    });
  };

  yield message;

  for await (const lines of streamSSE(r)) {
    for (const line of lines) {
      const data = JSON.parse(line);

      const error = data.error || { message: undefined, code: undefined };
      if (error.code) throw new Error(`Error ${error.code}`);

      const delta = data.choices?.[0]?.delta;
      if (!delta) continue;

      let content = delta.content;
      let reasoning = delta.reasoning || delta.reasoning_content;
      const images = delta.images;

      if (images) {
        for (const img of images) {
          if (img.type == 'image_url' && img.image_url?.url) {
            let url = img.image_url.url;
            if (url.startsWith('data:')) {
              const response = await fetch(url);
              const blob = await response.blob();
              url = URL.createObjectURL(blob);
            }
            if (!content) content = '';
            if (message.content.length > 0) content += '\n';
            content += `![Generated Image](${url})`;
          }
        }
      }

      if (delta.reasoning_text) {
        addReasoningSummary(delta.reasoning_text);
      }

      // Gemini via direct CC
      if (delta.extra_content?.google?.thought && content) {
        addReasoningSummary(content.replace('<thought>', ''));
        content = '';
      }

      if (content?.startsWith('</thought>')) {
        content = content.replace('</thought>', '');
      }

      // Qwen, GPT-OSS
      if (content == '<think>') {
        redirectReasoning = true;
        continue;
      }

      if (content?.includes('</think>')) {
        const last = message.content.at(-1);
        if (last?.type == 'text') {
          content = last.text + content;
          message.content.pop();
        }
        [reasoning, content] = content.split('</think>');

        redirectReasoning = false;
      }

      if (redirectReasoning) {
        reasoning = content;
        content = '';
      }

      if (content) append('text', content);
      if (reasoning) append('reasoning', reasoning, 'text');

      // Groq reports each built-in tool it ran twice: once as the call starts,
      // then again carrying the output.
      for (const call of delta.executed_tools || []) {
        let part = executedByIndex[call.index];
        if (!part) {
          part = { type: 'tool_call', status: 'in_progress', name: call.name, arguments: '' };
          executedByIndex[call.index] = part;
          message.content.push(part);
        }
        if (call.arguments) part.arguments = call.arguments;
        if (call.output) {
          part.output = call.output;
          part.status = 'completed';
        }
      }

      // OpenRouter reports what its search read as citations rather than as
      // tool calls, and some models never spell the links out in the answer.
      for (const { url_citation } of delta.annotations || []) {
        if (url_citation?.url) citations.set(url_citation.url, url_citation.title || 'Source');
      }
    }

    yield message;
  }

  // Groq's built-in browser cites with 【N†Lx-Ly】 markers that point into its
  // own transcript and mean nothing to the reader. They can straddle chunks, so
  // this waits until the text has stopped growing.
  for (const part of message.content) {
    if (part.type == 'text') part.text = part.text.replace(/【[^】]*】/g, '');
  }
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

  if (!message.content.length) {
    throw new Error('[EMPTY]');
  }
}
