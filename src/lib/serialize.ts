import type { Message } from "./types";

export type SerializedMessage =
  | Exclude<Message, { role: "user"; imageURI: string }>
  | Omit<Extract<Message, { role: "user"; imageURI: string }>, "asBuffer">;

// TODO: blob storage primitive in monoidentity to let images sync?
export const preSerialize = async (message: Message): Promise<SerializedMessage> => {
  // if (message.role == "user" && "imageURI" in message) {
  //   let url = message.imageURI;
  //   if (!url.startsWith("data:")) {
  //     const buffer = await message.asBuffer();
  //     const arr = new Uint8Array(buffer);
  //     url = `data:image/png;base64,${arr.toBase64()}`;
  //   }
  //   return {
  //     role: "user",
  //     imageURI: url,
  //   };
  // }
  return message;
};

export const postDeserialize = (message: SerializedMessage): Message => {
  // if (message.role == "user" && "imageURI" in message) {
  //   return {
  //     role: "user",
  //     imageURI: message.imageURI,
  //     asBuffer: async () => {
  //       const response = await fetch(message.imageURI);
  //       return response.arrayBuffer();
  //     },
  //   };
  // }
  return message;
};
