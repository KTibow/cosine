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
    if (provider == "Copilot") {
      const token = providers.ghc?.token;
      if (!token) throw new Error("No GitHub token provided");
      key = await getAccessToken(token);
    }
    const r = await useDirectory({ provider, key, messages, model });
    for await (const message of receive(r)) {
      yield message;
    }
    return;
  }
}
