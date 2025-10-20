import { fn } from "monoserve";
import { string } from "valibot";

export default fn(string(), async (url) => {
  let accept = "text/html";
  if (url.endsWith(".diff")) accept = "text/plain";
  const r = await fetch(url, {
    headers: { accept, "user-agent": "Cosine Summarizer" },
  });
  if (!r.ok) throw new Error(`URL is ${r.status}ing`);

  let mime = r.headers.get("content-type");
  if (mime) mime = mime.split(";")[0];
  if (mime != accept) throw new Error(`URL is ${mime}, expected ${accept}`);

  return new Response(r.body, { headers: { "content-type": mime } });
});
