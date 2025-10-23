import { fn } from "monoserve";
import { string } from "valibot";

export const loadVideo = async (id: string) => {
  const r1 = await fetch(
    "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240422.01.00",
          },
        },
        videoId: id,
      }),
    },
  );
  if (!r1.ok) throw new Response(`YT formats are ${r1.status}ing`, { status: 500 });
  const {
    videoDetails,
    captions: { playerCaptionsTracklistRenderer },
  }: {
    videoDetails: any;
    captions: { playerCaptionsTracklistRenderer: { captionTracks: any[] } };
  } = await r1.json();
  if (!videoDetails) throw new Response("YT formats have no details", { status: 500 });
  if (!playerCaptionsTracklistRenderer)
    throw new Response("YT captions have no tracks", { status: 500 });
  const caption = playerCaptionsTracklistRenderer.captionTracks.find((c) => c.languageCode == "en");
  if (!caption) throw new Response("YT formats have no captions", { status: 500 });

  const r2 = await fetch(caption.baseUrl);
  if (!r2.ok) throw new Response(`YT captions are ${r2.status}ing`, { status: 500 });
  const captionXML = await r2.text();
  const lines = captionXML
    .split("<transcript>")[1]
    .split("</transcript>")[0]
    .split("</text>")
    .map((line) => line.split(">")[1])
    .filter(Boolean)
    .map((line) =>
      line
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"')
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll("&#39;", "'"),
    );
  return {
    name: videoDetails.title,
    source: `${videoDetails.author} (YouTube)`,
    content: lines.join("\n"),
  };
};
export default fn(string(), loadVideo);
