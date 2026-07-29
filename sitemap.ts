export interface SitemapEntry {
  loc: string;
  changefreq: "weekly" | "monthly";
  priority: string;
}

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { loc: "https://www.zaydio.com/", changefreq: "weekly", priority: "1.0" },
  { loc: "https://www.zaydio.com/parents.html", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/privacy.html", changefreq: "monthly", priority: "0.7" },
  { loc: "https://www.zaydio.com/videos.html", changefreq: "weekly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/", changefreq: "weekly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/why-toddlers-want-the-same-song-on-repeat/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/teaching-toddlers-second-language-songs/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/do-animal-sounds-count-as-words/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/alphabet-songs-for-toddlers/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/bedtime-songs-for-toddlers/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/blog/songs-to-teach-toddlers-colors/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/es/blog/", changefreq: "weekly", priority: "0.7" },
  { loc: "https://www.zaydio.com/es/blog/por-que-mi-hijo-quiere-la-misma-cancion/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/es/blog/ensenar-ingles-a-ninos-con-canciones/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/es/blog/canciones-del-abecedario-para-ninos/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/es/blog/los-sonidos-de-animales-cuentan-como-palabras/", changefreq: "monthly", priority: "0.8" },
  { loc: "https://www.zaydio.com/albums/everybody-sing.html", changefreq: "monthly", priority: "0.9" },
  { loc: "https://www.zaydio.com/albums/the-new-abcs.html", changefreq: "monthly", priority: "0.9" },
  { loc: "https://www.zaydio.com/albums/sing-along-lullabies.html", changefreq: "monthly", priority: "0.9" },
  { loc: "https://www.zaydio.com/albums/island-vibes-lullabies.html", changefreq: "monthly", priority: "0.9" },
];

export function buildSitemapXml(lastmod: string): string {
  const urls = SITEMAP_ENTRIES.map((entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
