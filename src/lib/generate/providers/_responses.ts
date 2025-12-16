import { constructBase, type Dict, type Headerslike, type Requestlike } from "./_base";
import receive from "./_responsesreceive";
import type { Options } from "../../types";
import toResponses from "./_responsessend";

export const constructResponses = (
  base: string,
  tweakRequest?: (
    conf: { options: Options },
    request: { body: Dict; headers: Headerslike },
  ) => void,
  inlineImages = false,
) =>
  constructBase(async (messages, options, auth) => {
    const body: Dict = {
      ...(await toResponses(messages, inlineImages)),
      model: options.model,
      stream: true,
      reasoning: {
        summary: "auto",
      },
      include: ["reasoning.encrypted_content"],
    };

    if (options.tools.length > 0) {
      body.tools = options.tools.map((tool: any) =>
        "function" in tool ? { type: "function", ...tool.function } : tool,
      );
    }

    const headers: Headerslike = {
      authorization: `Bearer ${auth}`,
      "content-type": "application/json",
    };

    if (tweakRequest) tweakRequest({ options }, { body, headers });

    const request: Requestlike = {
      url: `${base}/responses`,
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
