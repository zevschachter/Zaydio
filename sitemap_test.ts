import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { buildSitemapXml, SITEMAP_ENTRIES } from "./sitemap.ts";

Deno.test("sitemap includes all SEO pages", () => {
  assertEquals(SITEMAP_ENTRIES.length, 8);
});

Deno.test("buildSitemapXml renders valid urls", () => {
  const xml = buildSitemapXml("2026-06-24");
  assertStringIncludes(xml, "https://www.zaydio.com/parents.html");
  assertStringIncludes(xml, "https://www.zaydio.com/albums/everybody-sing.html");
  assertStringIncludes(xml, "<lastmod>2026-06-24</lastmod>");
});
