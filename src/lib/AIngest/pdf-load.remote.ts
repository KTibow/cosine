import { fn } from 'monoserve';
import { string } from 'valibot';
import { MISTRAL_KEY } from '$env/static/private';

export default fn(string(), async (url) => {
  const r = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${MISTRAL_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      include_image_base64: false,
      document: {
        type: 'document_url',
        document_url: url,
      },
    }),
  });
  if (!r.ok) {
    throw new Response(`Mistral is ${r.status}ing`, { status: 500 });
  }
  const data: { pages: any[] } = await r.json();
  return data.pages.map((p) => p.markdown).join(`\n\n---\n\n`);
});
