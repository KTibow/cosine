import type { Message, OptionsInference } from "../../types";
import { constructBase, type Dict, type Headerslike, type Requestlike } from "./_base";
import receive from "./_chatcompletionsreceive";
import toChatCompletions from "./_chatcompletionssend";

export const constructChatCompletions = (
  base: string,
  tweakRequest?: (
    conf: { options: OptionsInference },
    request: { body: Dict; headers: Headerslike },
  ) => void,
  inlineImages = false,
) =>
  constructBase(async (messages, options, auth) => {
    const url = `${base}/chat/completions`;

    const serialized = await toChatCompletions(messages, inlineImages, url);

    const body: Dict = {
      messages: serialized,
      model: options.model,
      stream: true,
    };
    if (options.tools.length > 0) {
      body.tools = options.tools;
    }

    const headers: Headerslike = {
      authorization: `Bearer ${auth}`,
      "content-type": "application/json",
    };

    if (tweakRequest) tweakRequest({ options }, { body, headers });

    const request: Requestlike = {
      url,
      headers,
      method: "POST",
      body: JSON.stringify(body),
    };

    return {
      request,
      parse: async function* (response: Response, startTime: number) {
        yield* receive(response, { url: request.url, startTime });
      },
    };
  });
