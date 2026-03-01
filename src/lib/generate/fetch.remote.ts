import * as env from '$env/static/private';
import { OBSERVABILITY_URL } from '$env/static/private';
import { fn } from 'monoserve';
import { object, string, record } from 'valibot';

const bodySchema = object({
  url: string(),
  headers: record(string(), string()),
  body: string(),
});

const allowlist: Record<string, { keyName?: string }> = {
  // "https://api.anthropic.com/v1/messages": { keyName: "ANTHROPIC_KEY" },
  'https://api.groq.com/openai/v1/chat/completions': { keyName: 'GROQ_KEY' },
  'https://api.cerebras.ai/v1/chat/completions': { keyName: 'CEREBRAS_KEY' },
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions': {
    keyName: 'GEMINI_KEY',
  },
  'https://openrouter.ai/api/v1/chat/completions': { keyName: 'OPENROUTER_FREE_KEY' },
  'https://ai.hackclub.com/proxy/v1/chat/completions': { keyName: 'ORHC_KEY' },
  'https://ai.nahcrof.com/v2/chat/completions': { keyName: 'CROFAI_KEY' },
  'https://api.githubcopilot.com/chat/completions': {},
  'https://api.githubcopilot.com/responses': {},
  'https://models.github.ai/inference/chat/completions': {},
};

export default fn(bodySchema, async ({ url, headers = {}, body }) => {
  const config = allowlist[url];
  if (!config) {
    throw new Response(`${url} isn't allowed`, { status: 403 });
  }

  const serverKeyAuthorization = headers['authorization'] == 'Bearer SERVER_KEY';
  const serverKeyXApiKey = headers['x-api-key'] == 'SERVER_KEY';
  if (serverKeyAuthorization || serverKeyXApiKey) {
    if (!config.keyName) {
      throw new Response(`No system key configured for ${url}`, { status: 500 });
    }

    const envKey = (env as Record<string, string>)[config.keyName];
    if (!envKey) {
      throw new Response(`Environment variable ${config.keyName} not set`, { status: 500 });
    }

    if (serverKeyAuthorization) headers['authorization'] = `Bearer ${envKey}`;
    if (serverKeyXApiKey) headers['x-api-key'] = envKey;

    // ---

    const bodyParsed = JSON.parse(body);
    const lastMessage = bodyParsed.messages.at(-1);
    const stringifyUserMessage = ({ content }: { content: any }) => {
      let messageStr = '';
      if (typeof content == 'string') {
        messageStr = content;
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (part.text) {
            messageStr += part.text;
          }
        }
      }
      return messageStr;
    };
    const lastMessageStr =
      (lastMessage.role == 'user' && stringifyUserMessage(lastMessage)) ||
      JSON.stringify(lastMessage);
    const content = `${lastMessageStr.slice(0, 1800)}
-# ${bodyParsed.model} on ${url.slice('https://'.length)}`;
    fetch(OBSERVABILITY_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.includes('text/event-stream')) {
    const headers = new Headers();
    if (contentType) headers.set('content-type', contentType);
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } else {
    const text = await response.text();
    let code = 500;
    try {
      const json = JSON.parse(text);
      const jsonCode = +json.error.code;
      if (!Number.isInteger(jsonCode)) throw new Error('invalid code');
      if (jsonCode < 200) throw new Error('invalid code');
      if (jsonCode > 599) throw new Error('invalid code');
      code = jsonCode;
    } catch {}
    return new Response(text, {
      status: code,
      headers: { 'content-type': contentType },
    });
  }
});
