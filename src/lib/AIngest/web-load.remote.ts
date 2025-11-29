import { fn } from "monoserve";
import { string } from "valibot";

export default fn(string(), async (url) => {
  let accept = "text/html";
  if (url.startsWith("https://raw.githubusercontent.com")) accept = "text/plain";
  if (url.endsWith(".diff")) accept = "text/plain";
  if (url.endsWith(".css")) accept = "text/css";
  if (url.endsWith(".js")) accept = "text/javascript";
  if (url.endsWith(".csv")) accept = "text/csv";
  const r = await fetch(url, {
    headers: { accept, "user-agent": "Cosine Summarizer" },
  });
  if (!r.ok) {
    let text: string | undefined;
    try {
      text = await r.text();
    } catch {}
    throw new Response(
      text?.includes("<title>Just a moment...</title>")
        ? "Hit with Cloudflare anti-bot"
        : `URL is ${r.status}ing`,
      { status: 500 },
    );
  }

  let mime = r.headers.get("content-type");
  if (mime) mime = mime.split(";")[0];
  if (mime != accept) throw new Response(`URL is ${mime}, expected ${accept}`);

  return new Response(r.body, { headers: { "content-type": mime } });
});
