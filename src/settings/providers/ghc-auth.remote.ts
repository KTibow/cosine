import { fn } from 'monoserve';

export default fn(async () => {
  const r = await fetch(
    'https://github.com/login/device/code?' +
      new URLSearchParams({
        client_id: 'Iv1.b507a08c87ecfe98',
      }),
    {
      method: 'POST',
      headers: { accept: 'application/json' },
    },
  );
  if (!r.ok) throw new Response(`Github is ${r.status}ing: ${await r.text()}`, { status: 500 });

  const data: {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  } = await r.json();
  return data;
});
