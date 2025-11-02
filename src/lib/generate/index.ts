import { snackbar } from "m3-svelte";
import { getStorage } from "monoidentity";
import type { Message, Stack } from "../types";
import fetchRemote from "./fetch.remote";
import { providers } from "./providers";
import getAccessToken from "./copilot/get-access-token";

const processMessage = async (m: Message, noExternal: boolean) => {
  if (m.role == "assistant")
    return {
      role: m.role,
      content: m.content,
    };

  if (m.role != "user") return m;
  const role = m.role;
  let content;
  if ("imageURI" in m) {
    let url;
    if (!noExternal && !m.imageURI.startsWith("blob:")) {
      url = m.imageURI;
    } else {
      const buffer = await m.asBuffer();
      const arr = new Uint8Array(buffer);
      url = `data:image/png;base64,${arr.toBase64()}`;
    }
    content = [{ type: "image_url", image_url: { url } } as const];
  } else {
    content = m.content;
  }
  return {
    role,
    content,
  };
};

const transformMessages = async (inputMessages: Message[], noExternal = false) => {
  return Promise.all(inputMessages.map((m) => processMessage(m, noExternal)));
};

export default async function* (inputMessages: Message[], stack: Stack, signal?: AbortSignal) {
  const configuredProviders = getStorage("config").providers || {};

  for (const { provider, options } of stack) {
    try {
      const messages = await transformMessages(
        inputMessages,
        ["Gemini via Cosine", "GitHub Copilot"].includes(provider),
      );

      let auth = "SERVER_KEY";
      if (provider == "GitHub Models") {
        const token = configuredProviders.ghm?.token;
        if (!token) throw new Error("No GitHub token provided");
        auth = token;
      }
      if (provider == "GitHub Copilot") {
        const token = configuredProviders.ghc?.token;
        if (!token) throw new Error("No GitHub token provided");
        auth = await getAccessToken(token);
      }

      const generate = providers[provider];
      if (!generate) {
        throw new Error(`Provider ${provider} not implemented`);
      }
      for await (const message of generate(messages, options, auth, async (request) => {
        return await fetchRemote(request, { signal });
      })) {
        yield message;
      }
      return; // Success!
    } catch (e) {
      console.error(e);

      const message = e instanceof Error ? e.message : String(e);
      if (stack.length > 1) {
        snackbar(`${provider} failed (${message})`);
      } else {
        snackbar(`Generation failed (${message})`);
      }
    }
  }

  if (stack.length < 1) {
    snackbar(`No providers found`);
  }
  if (stack.length > 1) {
    snackbar(`All providers failed`);
  }
}
