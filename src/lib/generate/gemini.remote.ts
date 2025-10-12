import { fn } from "monoserve";
import { GEMINI_KEY } from "$env/static/private";
import { array, object, string } from "valibot";
import { openAIMessage } from "/lib/types";

const bodySchema = object({
  messages: array(openAIMessage),
  model: string(),
});

export default fn(bodySchema, async ({ messages, model }) => {
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${GEMINI_KEY}`,
      },
      body: JSON.stringify({
        messages,
        model,
        stream: true,
      }),
    },
  );
  if (!r.ok) throw new Error(`Gemini is ${r.status}ing`);
  return new Response(r.body, {
    headers: {
      "content-type": "text/event-stream",
    },
  });
});
