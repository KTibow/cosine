import type { UserMessage } from "/lib/types";

export const convertUserMessage = async (message: UserMessage, inlineImages: boolean) => {
  if ("imageURI" in message) {
    let url = message.imageURI;
    const mustInline =
      inlineImages ||
      url.startsWith("blob:") ||
      (!url.startsWith("data:") && !url.startsWith("http://") && !url.startsWith("https://"));

    if (mustInline && !url.startsWith("data:")) {
      const buffer = await message.asBuffer();
      const arr = new Uint8Array(buffer);
      url = `data:image/png;base64,${arr.toBase64()}`;
    }

    return {
      role: "user" as const,
      content: [{ type: "image_url" as const, image_url: { url } }],
    };
  }

  return {
    role: "user" as const,
    content: message.content,
  };
};
