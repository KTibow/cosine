import type { OpenAIMessage } from "/lib/types";

export type Requestlike = {
  url: string;
  method: "POST";
  body: string;
  headers: Record<string, string>;
};
export type Fetchlike = (request: Requestlike) => Promise<Response>;

export const constructBase = (
  formatRequest: (messages: OpenAIMessage[], model: string, auth: string) => Requestlike,
  parseResponse: (response: Response, startTime: number) => AsyncGenerator<OpenAIMessage>,
) => {
  return async function* (
    messages: OpenAIMessage[],
    model: string,
    auth: string,
    fetcher: Fetchlike,
  ): AsyncGenerator<OpenAIMessage> {
    const request = formatRequest(messages, model, auth);
    const startTime = performance.now();

    const response = await fetcher(request);
    if (!response.ok) {
      throw new Error(`${response.status}ing: ${await response.text()}`);
    }

    yield* parseResponse(response, startTime);
  };
};
