export const ZAYDIO_YOUTUBE_CHANNEL_ID = "UC4p-Lx9r0WZ3AGI7tRuWOYA";
export const ZAYDIO_YOUTUBE_HANDLE = "zaydioandpals";
export const ZAYDIO_YOUTUBE_FEED_URL =
  `https://www.youtube.com/feeds/videos.xml?channel_id=${ZAYDIO_YOUTUBE_CHANNEL_ID}`;

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  url: string;
  thumbnailUrl: string;
  isShort: boolean;
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim();
}

export function sortVideosChronologically(videos: YouTubeVideo[]): YouTubeVideo[] {
  return [...videos].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

export function parseYouTubeFeedXml(xml: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  for (const chunk of xml.split("<entry>").slice(1)) {
    const entry = chunk.split("</entry>")[0] ?? "";
    const id = extractTag(entry, "yt:videoId");
    const title = extractTag(entry, "title");
    const publishedAt = extractTag(entry, "published");
    if (!id || !title || !publishedAt) continue;

    const linkMatch = entry.match(/<link rel="alternate" href="([^"]+)"/);
    const thumbMatch = entry.match(/<media:thumbnail url="([^"]+)"/);
    const url = linkMatch?.[1] ?? `https://www.youtube.com/watch?v=${id}`;

    videos.push({
      id,
      title: decodeXml(title),
      publishedAt,
      url,
      thumbnailUrl: thumbMatch?.[1] ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      isShort: url.includes("/shorts/"),
    });
  }

  return sortVideosChronologically(videos);
}

export async function fetchChannelVideos(): Promise<YouTubeVideo[]> {
  const response = await fetch(ZAYDIO_YOUTUBE_FEED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ZaydioSite/1.0)",
      "Accept": "application/atom+xml, application/xml, text/xml, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube feed returned ${response.status}`);
  }

  const videos = parseYouTubeFeedXml(await response.text());
  if (videos.length === 0) {
    throw new Error("YouTube feed contained no videos");
  }

  return videos;
}

export function fallbackVideos(): YouTubeVideo[] {
  return sortVideosChronologically([
    {
      id: "9THE3AafK7w",
      title: "The New ABCs | ZAYDIO",
      publishedAt: "2026-03-31T00:00:00+00:00",
      url: "https://www.youtube.com/watch?v=9THE3AafK7w",
      thumbnailUrl: "https://i.ytimg.com/vi/9THE3AafK7w/hqdefault.jpg",
      isShort: false,
    },
    {
      id: "LOzbUdVu-6M",
      title: "4 seasons",
      publishedAt: "2026-03-31T01:00:00+00:00",
      url: "https://www.youtube.com/shorts/LOzbUdVu-6M",
      thumbnailUrl: "https://i.ytimg.com/vi/LOzbUdVu-6M/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "MvTdeHemgkk",
      title: "Cloudy with a Chance of ZAYDIO",
      publishedAt: "2026-03-31T02:00:00+00:00",
      url: "https://www.youtube.com/shorts/MvTdeHemgkk",
      thumbnailUrl: "https://i.ytimg.com/vi/MvTdeHemgkk/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "dNK0g_pzFN8",
      title: "Farm Animals Sounds | ZAYDIO",
      publishedAt: "2026-03-31T03:00:00+00:00",
      url: "https://www.youtube.com/watch?v=dNK0g_pzFN8",
      thumbnailUrl: "https://i.ytimg.com/vi/dNK0g_pzFN8/hqdefault.jpg",
      isShort: false,
    },
    {
      id: "Ke5tVja1XN4",
      title: "Let's Learn Colors!",
      publishedAt: "2026-04-01T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/Ke5tVja1XN4",
      thumbnailUrl: "https://i.ytimg.com/vi/Ke5tVja1XN4/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "XdQSkly2NGc",
      title: "We Count | ZAYDIO",
      publishedAt: "2026-04-14T00:00:00+00:00",
      url: "https://www.youtube.com/watch?v=XdQSkly2NGc",
      thumbnailUrl: "https://i.ytimg.com/vi/XdQSkly2NGc/hqdefault.jpg",
      isShort: false,
    },
    {
      id: "mrQrvtM9SZ0",
      title: "The Nursery Rhyme Medley | ZAYDIO",
      publishedAt: "2026-04-23T00:00:00+00:00",
      url: "https://www.youtube.com/watch?v=mrQrvtM9SZ0",
      thumbnailUrl: "https://i.ytimg.com/vi/mrQrvtM9SZ0/hqdefault.jpg",
      isShort: false,
    },
    {
      id: "lqYquU6T0dw",
      title: "birds eat worms",
      publishedAt: "2026-04-30T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/lqYquU6T0dw",
      thumbnailUrl: "https://i.ytimg.com/vi/lqYquU6T0dw/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "r-OMWIJDBPA",
      title: "Grow Flower Grow!",
      publishedAt: "2026-05-27T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/r-OMWIJDBPA",
      thumbnailUrl: "https://i.ytimg.com/vi/r-OMWIJDBPA/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "m5PDUSBkiPQ",
      title: "Farm Animal Sounds",
      publishedAt: "2026-05-31T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/m5PDUSBkiPQ",
      thumbnailUrl: "https://i.ytimg.com/vi/m5PDUSBkiPQ/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "XvPTSOPO52c",
      title: "Burbles",
      publishedAt: "2026-06-05T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/XvPTSOPO52c",
      thumbnailUrl: "https://i.ytimg.com/vi/XvPTSOPO52c/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "MN8Oa6baxIE",
      title: "Colors Make Colours!",
      publishedAt: "2026-06-13T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/MN8Oa6baxIE",
      thumbnailUrl: "https://i.ytimg.com/vi/MN8Oa6baxIE/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "3p6lZV-THvY",
      title: "Cloudy With a Chance of Zaydio",
      publishedAt: "2026-06-14T00:00:00+00:00",
      url: "https://www.youtube.com/shorts/3p6lZV-THvY",
      thumbnailUrl: "https://i.ytimg.com/vi/3p6lZV-THvY/hqdefault.jpg",
      isShort: true,
    },
    {
      id: "LOoweIO_NhA",
      title: "Red, Yellow, and Blue | ZAYDIO",
      publishedAt: "2026-07-05T14:11:16+00:00",
      url: "https://www.youtube.com/watch?v=LOoweIO_NhA",
      thumbnailUrl: "https://i.ytimg.com/vi/LOoweIO_NhA/hqdefault.jpg",
      isShort: false,
    },
    {
      id: "MMKuqS7pXcQ",
      title: "Humpty Dumpty, Twinkle Twinkle + 13 MORE!",
      publishedAt: "2026-07-07T21:39:44+00:00",
      url: "https://www.youtube.com/shorts/MMKuqS7pXcQ",
      thumbnailUrl: "https://i.ytimg.com/vi/MMKuqS7pXcQ/hqdefault.jpg",
      isShort: true,
    },
  ]);
}
