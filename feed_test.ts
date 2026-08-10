import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BLOG_POSTS, postsForLang } from "./blog_posts.ts";
import { buildBlogFeedXml } from "./feed.ts";
import { SITEMAP_ENTRIES } from "./sitemap.ts";

Deno.test("blog_posts drive EN and ES feeds", () => {
  const en = postsForLang("en");
  const es = postsForLang("es");
  assertEquals(en.length + es.length, BLOG_POSTS.length);
  assertEquals(en[0].path, "/blog/you-dont-have-to-sing-well/");
  assertEquals(es[0].path, "/es/blog/cantarle-a-mi-bebe-si-canto-mal/");
});

Deno.test("sitemap blog URLs match blog_posts registry", () => {
  const sitemapBlog = SITEMAP_ENTRIES
    .map((e) => e.loc)
    .filter((loc) => loc.includes("/blog/") && !loc.endsWith("/blog/"));
  const registry = BLOG_POSTS.map((p) => `https://www.zaydio.com${p.path}`);
  assertEquals(new Set(sitemapBlog), new Set(registry));
  assertEquals(SITEMAP_ENTRIES.length, 26);
});

Deno.test("buildBlogFeedXml EN is valid RSS 2.0", () => {
  const xml = buildBlogFeedXml("en", new Date("2026-08-17T12:00:00.000Z"));
  assertStringIncludes(xml, '<rss version="2.0">');
  assertStringIncludes(xml, "<language>en</language>");
  assertStringIncludes(xml, "<title>Zaydio Blog</title>");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/you-dont-have-to-sing-well/");
  assertStringIncludes(xml, "<guid isPermaLink=\"true\">https://www.zaydio.com/blog/you-dont-have-to-sing-well/</guid>");
  assertStringIncludes(xml, "Babies don&apos;t grade on pitch");
  assertEquals(xml.includes("/es/blog/"), false);
});

Deno.test("buildBlogFeedXml ES is valid RSS 2.0", () => {
  const xml = buildBlogFeedXml("es", new Date("2026-08-17T12:00:00.000Z"));
  assertStringIncludes(xml, "<language>es</language>");
  assertStringIncludes(xml, "<title>El Blog de Zaydio</title>");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/cantarle-a-mi-bebe-si-canto-mal/");
  assertEquals(xml.includes("/blog/you-dont-have-to-sing-well/"), false);
});
