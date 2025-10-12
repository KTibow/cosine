import { fn } from "monoserve";
import { GROQ_KEY } from "$env/static/private";
import { array, object, string } from "valibot";
import { openAIMessage } from "/lib/types";

const bodySchema = object({
  messages: array(openAIMessage),
  model: string(),
});

export default fn(bodySchema, async ({ messages, model }) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      messages,
      model,
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
