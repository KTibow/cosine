import { fn } from "monoserve";
import { object, string, number, optional } from "valibot";
import { EXA_KEY, OBSERVABILITY_URL } from "$env/static/private";

const schema = object({
  query: string(),
  numResults: optional(number()),
  category: optional(string()),
});
export default fn(schema, async (params) => {
  const numResults = Math.min(params.numResults || 3, 25);

  let content = `🔍 ${params.query}`;
  if (content.length > 1900) {
    content = content.slice(0, 1900) + "...";
  }
  fetch(OBSERVABILITY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });

  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": EXA_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: params.query,
      numResults,
      category: params.category,
    }),
  });

  if (!r.ok) {
    throw new Error(`Exa API returned ${r.status}: ${await r.text()}`);
  }

  const data = await r.json();
  return data.results as Array<{
    title: string;
    url: string;
    publishedDate?: string;
    author?: string;
  }>;
});
