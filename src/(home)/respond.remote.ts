import { fn } from "monoserve";
import { GROQ_KEY } from "$env/static/private";
import { array, object } from "valibot";
import { openAIMessage } from "/lib/types";

const bodySchema = object({
  messages: array(openAIMessage),
});

export default fn(bodySchema, async ({ messages }) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2-instruct-0905",
      messages,
      stream: true,
    }),
  });
  if (!r.ok) throw new Error(`Groq is ${r.status}ing`);
  return new Response(r.body, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
});
