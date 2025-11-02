import type { OpenAIMessage, Options } from "../../types";

export type Dict = Record<string, any>;
export type Headerslike = Record<string, string>;
export type Requestlike = {
  url: string;
  method: "POST";
  body: string;
  headers: Headerslike;
};
export type Fetchlike = (request: Requestlike) => Promise<Response>;
export type ProviderFunction = (
  messages: OpenAIMessage[],
  options: Options,
  auth: string,
  fetcher: Fetchlike,
) => AsyncGenerator<OpenAIMessage>;

export const constructBase = (
  formatRequest: (
    messages: OpenAIMessage[],
    options: Options,
    auth: string,
  ) => {
    request: Requestlike;
    parse: (response: Response, startTime: number) => AsyncGenerator<OpenAIMessage>;
  },
) => {
  return async function* (messages, options, auth, fetcher) {
    const { request, parse } = formatRequest(messages, options, auth);
    const startTime = performance.now();

    const response = await fetcher(request);
    if (!response.ok) {
      throw new Error(`${response.status}ing: ${await response.text()}`);
    }

    yield* parse(response, startTime);
  } satisfies ProviderFunction;
};
