import { snackbar } from "m3-svelte";
import { getStorage } from "monoidentity";
import type { Message, Stack } from "../types";
import fetchRemote from "./fetch.remote";
import { providers } from "./providers";
import getAccessToken from "./copilot/get-access-token";

export default async function* (messages: Message[], stack: Stack, signal?: AbortSignal) {
  const configuredProviders = getStorage("config").providers || {};

  for (const { provider, options } of stack) {
    try {
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
