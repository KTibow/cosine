import * as env from '$env/static/private';
import { isValiError, literal, object, parse, string } from 'valibot';

// Server only — every resolver here reads secrets, so this must stay reachable
// exclusively from .remote.ts modules.
export type Key = () => string | Promise<string>;

const readEnv = (name: string) => {
  const value = (env as Record<string, string>)[name];
  if (!value) throw new Response(`Environment variable ${name} not set`, { status: 500 });
  return value;
};

export const envKey =
  (name: string): Key =>
  () =>
    readEnv(name);

const KEY_URL = 'https://jatevo.kendell.dev/key.json';
const keyFileSchema = object({ alg: literal('AES-GCM'), iv: string(), ct: string() });
const secretSchema = object({ key: string() });

const fromBase64 = (data: string) => Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

// Jatevo's API key is published AES-GCM encrypted; JATEVO_ENCRYPTION_KEY is the
// base64 32-byte secret that unwraps it. Fetched per request — it's a small R2
// object, and that way a rotated key.json takes effect immediately.
export const jatevoKey: Key = async () => {
  const secret = readEnv('JATEVO_ENCRYPTION_KEY');

  const r = await fetch(KEY_URL);
  if (!r.ok) throw new Response(`Jatevo key is ${r.status}ing`, { status: 500 });

  try {
    const { iv, ct } = parse(keyFileSchema, await r.json());
    const key = await crypto.subtle.importKey('raw', fromBase64(secret), 'AES-GCM', false, [
      'decrypt',
    ]);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      key,
      fromBase64(ct),
    );
    return parse(secretSchema, JSON.parse(new TextDecoder().decode(plaintext))).key;
  } catch (e) {
    if (isValiError(e)) {
      throw new Response(`Invalid Jatevo key: ${e.issues.map((i) => i.message).join(', ')}`, {
        status: 500,
      });
    }
    throw new Response(`Couldn't unwrap the Jatevo key: ${e instanceof Error ? e.message : e}`, {
      status: 500,
    });
  }
};
