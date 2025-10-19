import { snackbar } from "m3-svelte";
import { getStorage } from "monoidentity";
import type { Message, Stack } from "../types";
import useDirectory from "./use-directory.remote";
import receive from "./receive";
import getAccessToken from "./copilot/get-access-token";

const transformMessages = async (inputMessages: Message[], noExternal = false) => {
  return Promise.all(
    inputMessages.map(async (x) => {
      if ("imageURI" in x) {
        let url;
        if (!noExternal && !x.imageURI.startsWith("blob:")) {
          url = x.imageURI;
        } else {
          const buffer = await x.asBuffer();
          const arr = new Uint8Array(buffer);
          url = `data:image/png;base64,${arr.toBase64()}`;
        }
        return {
          role: x.role,
          content: [{ type: "image_url", image_url: { url } } as const],
        };
      }
      return x;
    }),
  );
};
export default async function* (inputMessages: Message[], stack: Stack) {
  const config = getStorage("config");
  const providers = config.providers || {};
  for (const { provider, model } of stack) {
    try {
      let key: string | undefined;
      if (provider == "GitHub Models") {
        key = providers.ghm?.token;
        if (!key) throw new Error("No GitHub token provided");
      }
      if (provider == "GitHub Copilot") {
        const token = providers.ghc?.token;
        if (!token) throw new Error("No GitHub token provided");
        key = await getAccessToken(token);
      }
      const messages = await transformMessages(
        inputMessages,
        ["Gemini via Cosine", "GitHub Copilot"].includes(provider),
      );

      const startTime = performance.now();
      const r = await useDirectory({ provider, key, messages, model });
      yield undefined; // indicate start
      for await (const message of receive(r, { startTime })) {
        yield message;
      }
      return;
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
  if (stack.length > 1) {
    snackbar(`All providers failed`);
  }
}
