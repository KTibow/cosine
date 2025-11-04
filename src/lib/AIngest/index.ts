import { getYTId } from "./youtube-id";
import youtubeLoad from "./youtube-load.remote";
import pdfLoad from "./pdf-load.remote";
import webLoad from "./web-load.remote";

// inputs:
// url -> html, youtube, pdf, maybe text and images
// file -> text, pdf
// text
//
// urls are just references to stuff, so load them first

export const plainMimes = ["text/plain", "text/markdown", "application/json"];
export const ingest = async (content: string | Blob, name: string, source: string) => {
  if (typeof content == "string" && content.startsWith("https:")) {
    const url = new URL(content);

    const derivedName = url.pathname.split("/").at(-1);
    if (derivedName) {
      name = derivedName;
    }

    source = url.hostname;
  }

  if (typeof content == "string" && content.startsWith("https:")) {
    const ytId = getYTId(content);
    if (ytId) {
      const video = await youtubeLoad(ytId);
      name = video.name;
      source = video.source;
      content = video.content;
    }
  }
  if (
    typeof content == "string" &&
    content.startsWith("https:") &&
    (content.startsWith("https://arxiv.org/pdf/") || content.endsWith(".pdf"))
  ) {
    content = await pdfLoad(content);
  }
  if (typeof content == "string" && content.startsWith("https:")) {
    const response = await webLoad(content);
    content = await response.blob();
  }

  if (typeof content == "object" && plainMimes.includes(content.type)) {
    content = await content.text();
  }
  if (typeof content == "object" && content.type == "text/html") {
    const { default: read } = await import("./read");
    const html = await content.text();
    ({ name, content } = read(html, source));
  }

  if (typeof content != "string") {
    throw new Error(`Can't ingest ${content.type}`);
  }
  return { name, source, text: content };
};
