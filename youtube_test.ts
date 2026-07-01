import {
  fallbackVideos,
  parseYouTubeFeedXml,
  sortVideosChronologically,
} from "./youtube.ts";

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <entry>
  <yt:videoId>NEWEST</yt:videoId>
  <title>Newest Video</title>
  <published>2026-06-14T17:47:48+00:00</published>
  <link rel="alternate" href="https://www.youtube.com/shorts/NEWEST"/>
  <media:group><media:thumbnail url="https://i.ytimg.com/vi/NEWEST/hqdefault.jpg"/></media:group>
 </entry>
 <entry>
  <yt:videoId>OLDEST</yt:videoId>
  <title>Oldest Video</title>
  <published>2026-03-31T00:00:00+00:00</published>
  <link rel="alternate" href="https://www.youtube.com/watch?v=OLDEST"/>
  <media:group><media:thumbnail url="https://i.ytimg.com/vi/OLDEST/hqdefault.jpg"/></media:group>
 </entry>
</feed>`;

Deno.test("parseYouTubeFeedXml sorts videos oldest first", () => {
  const videos = parseYouTubeFeedXml(SAMPLE_FEED);
  if (videos.length !== 2) {
    throw new Error(`Expected 2 videos, got ${videos.length}`);
  }
  if (videos[0].id !== "OLDEST" || videos[1].id !== "NEWEST") {
    throw new Error(`Expected oldest first, got ${videos.map((v) => v.id).join(", ")}`);
  }
});

Deno.test("parseYouTubeFeedXml decodes entities and detects shorts", () => {
  const feed = SAMPLE_FEED.replace("Newest Video", "Colors &amp; Shapes");
  const video = parseYouTubeFeedXml(feed).find((item) => item.id === "NEWEST");
  if (!video || video.title !== "Colors & Shapes" || !video.isShort) {
    throw new Error("Expected decoded title and short flag");
  }
});

Deno.test("fallbackVideos returns chronological list", () => {
  const videos = fallbackVideos();
  if (videos.length < 10) {
    throw new Error(`Expected fallback videos, got ${videos.length}`);
  }
  const sorted = sortVideosChronologically(videos);
  if (sorted[0].id !== videos[0].id) {
    throw new Error("Fallback videos should already be chronological");
  }
  if (videos[0].id !== "9THE3AafK7w") {
    throw new Error(`Expected The New ABCs first, got ${videos[0].id}`);
  }
});
