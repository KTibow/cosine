import type { Message, OptionsInference } from "../../types";

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
  options: OptionsInference,
  auth: string,
  fetcher: Fetchlike,
) => AsyncGenerator<Message>;

type MaybePromise<T> = T | Promise<T>;
export const constructBase = (
  formatRequest: (
    messages: Message[],
    options: OptionsInference,
    auth: string,
  ) => MaybePromise<{
    request: Requestlike;
    parse: (response: Response, startTime: number) => AsyncGenerator<Message>;
  }>,
) => {
  return async function* (
    messages: Message[],
    options: OptionsInference,
    auth: string,
    fetcher: Fetchlike,
  ) {
    const { request, parse } = await formatRequest(messages, options, auth);
    const startTime = performance.now();

    const response = await fetcher(request);
    if (!response.ok) {
      throw new Error(`${response.status}ing: ${await response.text()}`);
    }

    yield* parse(response, startTime);
  } satisfies ProviderFunction;
};
