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

export const plainMimes = [
  "text/plain",
  "text/markdown",
  "text/css",
  "text/javascript",
  "text/csv",
  "application/json",
];
export const otherKnownMimes = ["application/pdf", "text/html"];
export const ingest = async (content: string | Blob, name: string, source: string) => {
  const githubFileMatch =
    typeof content == "string" &&
    content.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/);
  if (githubFileMatch) {
    const [, repoPath, filePath] = githubFileMatch;
    content = `https://raw.githubusercontent.com/${repoPath}/${filePath}`;
  }
  const githubPRDiffMatch =
    typeof content == "string" &&
    content.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)\/files$/);
  if (githubPRDiffMatch) {
    const [, repoPath, prNumber] = githubPRDiffMatch;
    content = `https://patch-diff.githubusercontent.com/raw/${repoPath}/pull/${prNumber}.diff`;
  }

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

  if (typeof content == "object" && content.type == "application/pdf") {
    const arrayBuffer = await content.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUri = `data:application/pdf;base64,${base64}`;
    content = await pdfLoad(dataUri);
  }
  if (typeof content == "object" && content.type == "text/html") {
    const { default: read } = await import("./read");
    const html = await content.text();
    ({ name, content } = read(html, source));
  }
  if (typeof content == "object" && plainMimes.includes(content.type)) {
    content = await content.text();
  }

  if (typeof content != "string") {
    throw new Error(`Can't ingest ${content.type}`);
  }
  return { name, source, text: content };
};
