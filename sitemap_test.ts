import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { buildSitemapXml, SITEMAP_ENTRIES } from "./sitemap.ts";

Deno.test("sitemap includes all SEO pages", () => {
  assertEquals(SITEMAP_ENTRIES.length, 20);
});

Deno.test("buildSitemapXml renders valid urls", () => {
  const xml = buildSitemapXml("2026-06-24");
  assertStringIncludes(xml, "https://www.zaydio.com/parents.html");
  assertStringIncludes(xml, "https://www.zaydio.com/albums/everybody-sing.html");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/why-toddlers-want-the-same-song-on-repeat/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/teaching-toddlers-second-language-songs/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/do-animal-sounds-count-as-words/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/alphabet-songs-for-toddlers/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/bedtime-songs-for-toddlers/");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/por-que-mi-hijo-quiere-la-misma-cancion/");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/ensenar-ingles-a-ninos-con-canciones/");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/canciones-del-abecedario-para-ninos/");
  assertStringIncludes(xml, "https://www.zaydio.com/es/blog/los-sonidos-de-animales-cuentan-como-palabras/");
  assertStringIncludes(xml, "https://www.zaydio.com/blog/songs-to-teach-toddlers-colors/");
  assertStringIncludes(xml, "<lastmod>2026-06-24</lastmod>");
});
