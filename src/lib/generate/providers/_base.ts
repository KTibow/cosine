import type { OpenAIMessage } from "/lib/types";

export type Requestlike = {
  url: string;
  method: "POST";
  body: string;
  headers: Record<string, string>;
};
export type Fetchlike = (request: Requestlike) => Promise<Response>;
export type ProviderFunction = (
  messages: OpenAIMessage[],
  model: string,
  auth: string,
  fetcher: Fetchlike,
) => AsyncGenerator<OpenAIMessage>;

export const constructBase = (
  formatRequest: (
    messages: OpenAIMessage[],
    model: string,
    auth: string,
  ) => {
    request: Requestlike;
    parse: (response: Response, startTime: number) => AsyncGenerator<OpenAIMessage>;
  },
) => {
  return async function* (messages, model, auth, fetcher) {
    const { request, parse } = formatRequest(messages, model, auth);
    const startTime = performance.now();

    const response = await fetcher(request);
    if (!response.ok) {
      throw new Error(`${response.status}ing: ${await response.text()}`);
    }

    yield* parse(response, startTime);
  } satisfies ProviderFunction;
};
