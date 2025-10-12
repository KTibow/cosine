import { fn } from "monoserve";
import { string } from "valibot";

export default fn(string(), async (device_code) => {
  const r = await fetch(
    "https://github.com/login/oauth/access_token?" +
      new URLSearchParams({
        client_id: "Iv1.b507a08c87ecfe98",
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    {
      method: "POST",
      headers: {
        accept: "application/json",
      },
    },
  );
  if (!r.ok) throw new Error(`Github is ${r.status}ing: ${await r.text()}`);

  const data:
    | { error: string; error_description: string; error_uri: string }
    | { access_token: string; token_type: string; scope: string } = await r.json();
  return data;
});
