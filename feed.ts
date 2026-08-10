import {
  absolutePostUrl,
  postsForLang,
  type BlogPost,
} from "./blog_posts.ts";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(datePublished: string): string {
  // Noon UTC keeps calendar dates stable across timezones.
  return new Date(`${datePublished}T12:00:00.000Z`).toUTCString();
}

function itemXml(post: BlogPost): string {
  const link = absolutePostUrl(post.path);
  return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${toRfc822(post.datePublished)}</pubDate>
    <guid isPermaLink="true">${escapeXml(link)}</guid>
  </item>`;
}

export function buildBlogFeedXml(
  lang: "en" | "es",
  lastBuildDate: Date = new Date(),
): string {
  const posts = postsForLang(lang);
  const isEn = lang === "en";
  const channelTitle = isEn ? "Zaydio Blog" : "El Blog de Zaydio";
  const channelLink = isEn
    ? "https://www.zaydio.com/blog/"
    : "https://www.zaydio.com/es/blog/";
  const channelDescription = isEn
    ? "Practical songs, play ideas, and honest answers for parents of little kids — from the Zaydio team."
    : "Canciones, actividades y respuestas honestas para padres de niños pequeños — del equipo de Zaydio.";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>${lang}</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
${posts.map(itemXml).join("\n")}
  </channel>
</rss>
`;
}
