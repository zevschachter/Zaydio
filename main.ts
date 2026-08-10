// Static file server for Deno Deploy
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";
import {
  FALLBACK_REEL_SHORTCODE,
  fetchLatestReel,
  reelFromShortcode,
  type LatestReel,
} from "./instagram.ts";
import { fallbackAlbums, fetchZaydioAlbums, type ZaydioAlbum } from "./albums.ts";
import { buildSitemapXml } from "./sitemap.ts";
import { buildBlogFeedXml } from "./feed.ts";
import { withSecurityHeaders } from "./security_headers.ts";
import { fallbackVideos, fetchChannelVideos, type YouTubeVideo } from "./youtube.ts";
import {
  handleHelpfulGet,
  handleHelpfulPost,
  handleHelpfulStats,
} from "./helpful.ts";

const REEL_CACHE_TTL_MS = 60 * 60 * 1000;
const ALBUM_CACHE_TTL_MS = 60 * 60 * 1000;
const YOUTUBE_CACHE_TTL_MS = 60 * 60 * 1000;
let reelCache: { data: LatestReel; expiresAt: number } | null = null;
let albumCache: { data: ZaydioAlbum[]; expiresAt: number } | null = null;
let youtubeCache: { data: YouTubeVideo[]; expiresAt: number } | null = null;

async function getLatestReel(): Promise<LatestReel> {
  const now = Date.now();
  if (reelCache && reelCache.expiresAt > now) {
    return reelCache.data;
  }

  try {
    const data = await fetchLatestReel();
    reelCache = { data, expiresAt: now + REEL_CACHE_TTL_MS };
    return data;
  } catch {
    return reelFromShortcode(FALLBACK_REEL_SHORTCODE);
  }
}

async function getAlbums() {
  const now = Date.now();
  if (albumCache && albumCache.expiresAt > now) {
    return albumCache.data;
  }

  try {
    const data = await fetchZaydioAlbums();
    albumCache = { data, expiresAt: now + ALBUM_CACHE_TTL_MS };
    return data;
  } catch {
    const data = fallbackAlbums();
    albumCache = { data, expiresAt: now + ALBUM_CACHE_TTL_MS };
    return data;
  }
}

async function getYouTubeVideos() {
  const now = Date.now();
  if (youtubeCache && youtubeCache.expiresAt > now) {
    return youtubeCache.data;
  }

  try {
    const data = await fetchChannelVideos();
    youtubeCache = { data, expiresAt: now + YOUTUBE_CACHE_TTL_MS };
    return data;
  } catch {
    const data = fallbackVideos();
    youtubeCache = { data, expiresAt: now + YOUTUBE_CACHE_TTL_MS };
    return data;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (
    url.pathname === "/api/helpful/stats" ||
    url.pathname === "/api/helpful/stats/"
  ) {
    if (req.method === "GET") {
      return withSecurityHeaders(await handleHelpfulStats(req));
    }
    return withSecurityHeaders(
      new Response("Method Not Allowed", { status: 405 }),
    );
  }

  if (url.pathname === "/api/helpful") {
    if (req.method === "GET") {
      return withSecurityHeaders(await handleHelpfulGet(req));
    }
    if (req.method === "POST") {
      return withSecurityHeaders(await handleHelpfulPost(req));
    }
    return withSecurityHeaders(new Response("Method Not Allowed", { status: 405 }));
  }

  if (url.pathname === "/api/albums") {
    const albums = await getAlbums();
    return Response.json(albums, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (url.pathname === "/api/youtube-videos") {
    const videos = await getYouTubeVideos();
    return Response.json(videos, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (url.pathname === "/api/latest-reel") {
    const reel = await getLatestReel();
    return Response.json({
      shortcode: reel.shortcode,
      permalink: reel.permalink,
      embedUrl: reel.embedUrl,
      posterUrl: reel.posterUrl,
      videoSrc: reel.videoUrl ? "/api/latest-reel/video" : undefined,
    }, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (url.pathname === "/api/latest-reel/video") {
    const reel = await getLatestReel();
    if (!reel.videoUrl) {
      return new Response("Video unavailable", { status: 404 });
    }

    const videoResponse = await fetch(reel.videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZaydioSite/1.0)",
        "Referer": "https://www.instagram.com/",
      },
    });

    if (!videoResponse.ok) {
      return new Response("Failed to fetch video", { status: 502 });
    }

    return new Response(videoResponse.body, {
      headers: {
        "Content-Type": videoResponse.headers.get("Content-Type") || "video/mp4",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (url.pathname === "/sitemap.xml") {
    const lastmod = new Date().toISOString().slice(0, 10);
    return withSecurityHeaders(new Response(buildSitemapXml(lastmod), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    }));
  }

  if (url.pathname === "/blog/feed.xml") {
    return withSecurityHeaders(new Response(buildBlogFeedXml("en"), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    }));
  }

  if (url.pathname === "/es/blog/feed.xml") {
    return withSecurityHeaders(new Response(buildBlogFeedXml("es"), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    }));
  }

  // Serve index.html for root path
  if (url.pathname === "/") {
    const file = await Deno.readFile("./index.html");
    return withSecurityHeaders(new Response(file, {
      headers: {
        "content-type": "text/html",
        "Cache-Control": "no-cache, must-revalidate",
      },
    }));
  }

  // Serve all other static files
  const response = await serveDir(req, {
    fsRoot: ".",
    showDirListing: false,
  });
  const secured = withSecurityHeaders(response);
  const contentType = secured.headers.get("content-type") || "";
  // Keep HTML fresh so blog/index and article pages don't stick in browser caches.
  if (contentType.includes("text/html")) {
    const headers = new Headers(secured.headers);
    headers.set("Cache-Control", "no-cache, must-revalidate");
    return new Response(secured.body, {
      status: secured.status,
      statusText: secured.statusText,
      headers,
    });
  }
  return secured;
});
