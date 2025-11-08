import type { Message, Options } from "../../types";

export type Dict = Record<string, any>;
export type Headerslike = Record<string, string>;
export type Requestlike = {
  url: string;
  method: "POST";
  body: string;
  headers: Headerslike;
};
type Fetchlike = (request: Requestlike) => Promise<Response>;
export type ProviderFunction = (
  messages: Message[],
  options: Options,
  auth: string,
  fetcher: Fetchlike,
) => AsyncGenerator<Message>;

type MaybePromise<T> = T | Promise<T>;
export const constructBase = (
  formatRequest: (
    messages: Message[],
    options: Options,
    auth: string,
  ) => MaybePromise<{
    request: Requestlike;
    parse: (response: Response, startTime: number) => AsyncGenerator<Message>;
  }>,
) => {
  return async function* (messages, options, auth, fetcher) {
    const { request, parse } = await formatRequest(messages, options, auth);
    const startTime = performance.now();

    const response = await fetcher(request);
    if (!response.ok) {
      throw new Error(`${response.status}ing: ${await response.text()}`);
    }

    yield* parse(response, startTime);
  } satisfies ProviderFunction;
};
