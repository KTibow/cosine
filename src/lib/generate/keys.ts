import * as env from '$env/static/private';

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
