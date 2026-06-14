// Static file server for Deno Deploy
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";
import {
  FALLBACK_REEL_SHORTCODE,
  fetchLatestReel,
  reelFromShortcode,
  type LatestReel,
} from "./instagram.ts";

const REEL_CACHE_TTL_MS = 60 * 60 * 1000;
let reelCache: { data: LatestReel; expiresAt: number } | null = null;

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

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/latest-reel") {
    const reel = await getLatestReel();
    return Response.json(reel, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Serve index.html for root path
  if (url.pathname === "/") {
    const file = await Deno.readFile("./index.html");
    return new Response(file, {
      headers: { "content-type": "text/html" },
    });
  }

  // Serve all other static files
  return serveDir(req, {
    fsRoot: ".",
    showDirListing: false,
  });
});
