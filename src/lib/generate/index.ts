import type { Message, Stack } from "../types";
import useDirectory from "./use-directory.remote";
import receive from "./receive";
import { getStorage } from "monoidentity";
import getAccessToken from "./copilot/get-access-token";

export default async function* (messages: Message[], stack: Stack) {
  const config = getStorage("config");
  const providers = config.providers || {};
  for (const { provider, model } of stack) {
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
    const startTime = performance.now();
    const r = await useDirectory({ provider, key, messages, model });
    for await (const message of receive(r, { startTime })) {
      yield message;
    }
    return;
  }
}
