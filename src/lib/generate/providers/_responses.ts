import { constructBase, type Requestlike } from "./_base";
import receive from "./_responsesreceive";

export const constructResponses = (base: string, tweakRequest?: (req: Requestlike) => void) =>
  constructBase(
    (messages, model, auth) => {
      const headers: Record<string, string> = {
        authorization: `Bearer ${auth}`,
        "content-type": "application/json",
      };

      // Convert messages to input format
      const input = messages.map((msg) => (msg.role == "system" ? null : msg)).filter(Boolean);

      const systemMsg = messages.find((m) => m.role == "system");

      const body: Record<string, any> = {
        model,
        input,
        stream: true,
        reasoning: {
          summary: "auto",
        },
        include: ["reasoning.encrypted_content"],
      };
      if (systemMsg) body.instructions = systemMsg?.content;

      const request: Requestlike = {
        url: `${base}/responses`,
        method: "POST",
        headers,
        body: JSON.stringify(body),
      };
      if (tweakRequest) tweakRequest(request);

      return request;
    },
    async function* (response: Response, startTime: number) {
      yield* receive(response, { startTime });
    },
  );
