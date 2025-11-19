import type { Options } from "../../types";
import { constructBase, type Dict, type Headerslike, type Requestlike } from "./_base";
import receive from "./_chatcompletionsreceive";
import toChatCompletions from "./_chatcompletionssend";

export const constructChatCompletions = (
  base: string,
  tweakRequest?: (body: Dict, headers: Headerslike, options: Options) => void,
  inlineImages = false,
) =>
  constructBase(async (messages, options, auth) => {
    const serialized = await toChatCompletions(messages, inlineImages);

    const body: Dict = {
      messages: serialized,
      model: options.model,
      stream: true,
    };

    const headers: Headerslike = {
      authorization: `Bearer ${auth}`,
      "content-type": "application/json",
    };

    if (tweakRequest) tweakRequest(body, headers, options);

    const request: Requestlike = {
      url: `${base}/chat/completions`,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    return {
      request,
      parse: async function* (response: Response, startTime: number) {
        yield* receive(response, { url: request.url, startTime });
      },
    };
  });
