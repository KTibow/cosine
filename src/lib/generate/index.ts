import type { Message, Stack } from "../types";
import groqRemote from "./groq.remote";
import cerebrasRemote from "./cerebras.remote";
import geminiRemote from "./gemini.remote";
import receive from "./receive";

export default async function* (messages: Message[], stack: Stack) {
  for (const { provider, model } of stack) {
    let fn;
    if (provider == "Groq via Cosine") {
      fn = groqRemote;
    } else if (provider == "Cerebras via Cosine") {
      fn = cerebrasRemote;
    } else if (provider == "Gemini via Cosine") {
      fn = geminiRemote;
    } else {
      throw new Error(`Unknown provider ${provider}`);
    }

    const r = await fn({ messages, model });
    for await (const message of receive(r)) {
      yield message;
    }
    return;
  }
}
