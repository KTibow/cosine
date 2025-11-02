import { constructBase, type Dict, type Headerslike, type Requestlike } from "./_base";
import receive from "./_responsesreceive";
import type { Options } from "../../types";

export const constructResponses = (
  base: string,
  tweakRequest?: (body: Dict, headers: Headerslike, options: Options) => void,
) =>
  constructBase((messages, options, auth) => {
    // Convert messages to input format
    const input = messages.map((msg) => (msg.role == "system" ? null : msg)).filter(Boolean);

    const systemMsg = messages.find((m) => m.role == "system");

    const body: Dict = {
      input,
      instructions: systemMsg?.content,
      model: options.model,
      stream: true,
      reasoning: {
        summary: "auto",
      },
      include: ["reasoning.encrypted_content"],
    };

    const headers: Headerslike = {
      authorization: `Bearer ${auth}`,
      "content-type": "application/json",
    };

    if (tweakRequest) tweakRequest(body, headers, options);

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
