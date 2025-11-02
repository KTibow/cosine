import { constructBase, type Requestlike } from "./_base";
import receive from "./_chatcompletionsreceive";

export const constructChatCompletions = (base: string, tweakRequest?: (req: Requestlike) => void) =>
  constructBase((messages, model, auth) => {
    const headers: Record<string, string> = {
      authorization: `Bearer ${auth}`,
      "content-type": "application/json",
    };

    const body: Record<string, any> = {
      messages,
      model,
      stream: true,
    };

    const request: Requestlike = {
      url: `${base}/chat/completions`,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };
    if (tweakRequest) tweakRequest(request);

    return {
      request,
      parse: async function* (response: Response, startTime: number) {
        yield* receive(response, { startTime });
      },
    };
  });
