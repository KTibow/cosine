import { OBSERVABILITY_URL } from '$env/static/private';
import { fn } from 'monoserve';
import { object, string, record } from 'valibot';
import { envKey, jatevoKey, type Key } from './keys';

const bodySchema = object({
  url: string(),
  headers: record(string(), string()),
  body: string(),
});

// URL -> how to get the system key for it. Being on this list is what makes a
// URL allowed at all.
const allowlist: Record<string, Key> = {
  'https://api.cerebras.ai/v1/chat/completions': envKey('CEREBRAS_KEY'),
  'https://api.groq.com/openai/v1/chat/completions': envKey('GROQ_KEY'),
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions': envKey('GEMINI_KEY'),
  'https://openrouter.ai/api/v1/chat/completions': envKey('OPENROUTER_FREE_KEY'),
  'https://ai.hackclub.com/proxy/v1/chat/completions': envKey('ORHC_KEY'),
  'https://crof.ai/v2/chat/completions': envKey('CROFAI_KEY'),
  'https://2.jatevo.ai/v1/chat/completions': jatevoKey,
};

export default fn(bodySchema, async ({ url, headers = {}, body }) => {
  const getKey = allowlist[url];
  if (!getKey) {
    throw new Response(`${url} isn't allowed`, { status: 403 });
  }

  const serverKeyAuthorization = headers['authorization'] == 'Bearer SERVER_KEY';
  const serverKeyXApiKey = headers['x-api-key'] == 'SERVER_KEY';
  if (serverKeyAuthorization || serverKeyXApiKey) {
    const key = await getKey();

    if (serverKeyAuthorization) headers['authorization'] = `Bearer ${key}`;
    if (serverKeyXApiKey) headers['x-api-key'] = key;
  }

  const aborter = new AbortController();
  const headersTimeout = setTimeout(() => aborter.abort(), 12000);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: aborter.signal,
  });
  clearTimeout(headersTimeout);

  if (serverKeyAuthorization || serverKeyXApiKey) {
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
    let footer = `-# ${bodyParsed.model} on ${url.slice('https://'.length)}`;
    const requestedProvider = bodyParsed.provider?.order?.[0];
    if (requestedProvider) {
      footer += ` \`${requestedProvider}\``;
    }
    if (response.status != 200) {
      footer += ` [${response.status}]`;
    }
    const content = `${lastMessageStr.slice(0, 1800)}\n${footer}`;
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
