import { getStorage } from 'monoidentity';

export default async (token: string) => {
  const cache = getStorage('cache');
  const cached = cache['copilot-token'];
  if (cached && cached.for == token && Date.now() < cached.expires) {
    return cached.value;
  }

  const r = await fetch('https://api.github.com/copilot_internal/v2/token', {
    headers: {
      authorization: `bearer ${token}`,
    },
  });
  if (!r.ok) throw new Error(`Github Copilot is ${r.status}ing: ${await r.text()}`);

  const { expires_at, token: accessToken }: { expires_at: number; token: string } = await r.json();
  cache['copilot-token'] = {
    for: token,
    value: accessToken,
    expires: new Date(expires_at * 1000).getTime(),
  };
  return accessToken;
};
