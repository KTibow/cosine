import type { Message } from "./types";

export type SerializedMessage =
  | Exclude<Message, { role: "user"; imageURI: string }>
  | Omit<Extract<Message, { role: "user"; imageURI: string }>, "deconstruct">;

// TODO: blob storage primitive in monoidentity to let images sync?
export const preSerialize = async (message: Message): Promise<SerializedMessage | undefined> => {
  if (message.role == "user" && "imageURI" in message) {
    // Can't serialize image messages without blob storage
    return undefined;
    // let url = message.imageURI;
    // if (!url.startsWith("data:")) {
    //   const { mimeType, base64 } = await message.deconstruct();
    //   url = `data:${mimeType};base64,${base64}`;
    // }
    // return {
    //   role: "user",
    //   imageURI: url,
    // };
  }
  return message;
};

export const postDeserialize = (message: SerializedMessage): Message | undefined => {
  if (message.role == "user" && "imageURI" in message) {
    // Can't deserialize image messages without deconstruct logic
    return undefined;
    // return {
    //   role: "user",
    //   imageURI: message.imageURI,
    //   deconstruct: async () => {
    //     const response = await fetch(message.imageURI);
    //     const buffer = await response.arrayBuffer();
    //     const mimeType = response.headers.get("content-type") || "image/png";
    //     return {
    //       mimeType,
    //       base64: new Uint8Array(buffer).toBase64(),
    //     };
    //   },
    // };
  }
  return message;
};
