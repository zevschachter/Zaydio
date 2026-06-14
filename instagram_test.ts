import {
  FALLBACK_REEL_SHORTCODE,
  pickLatestReelShortcode,
  reelFromShortcode,
} from "./instagram.ts";

Deno.test("pickLatestReelShortcode returns first clips item", () => {
  const shortcode = pickLatestReelShortcode({
    edge_owner_to_timeline_media: {
      edges: [
        { node: { shortcode: "photo123", product_type: "feed" } },
        { node: { shortcode: "reel456", product_type: "clips" } },
        { node: { shortcode: "reel789", product_type: "clips" } },
      ],
    },
  });

  if (shortcode !== "reel456") {
    throw new Error(`Expected reel456, got ${shortcode}`);
  }
});

Deno.test("pickLatestReelShortcode returns null when no clips exist", () => {
  const shortcode = pickLatestReelShortcode({
    edge_owner_to_timeline_media: {
      edges: [{ node: { shortcode: "photo123", product_type: "feed" } }],
    },
  });

  if (shortcode !== null) {
    throw new Error(`Expected null, got ${shortcode}`);
  }
});

Deno.test("reelFromShortcode builds embed URLs", () => {
  const reel = reelFromShortcode(FALLBACK_REEL_SHORTCODE);
  if (reel.embedUrl !== `https://www.instagram.com/reel/${FALLBACK_REEL_SHORTCODE}/embed`) {
    throw new Error(`Unexpected embed URL: ${reel.embedUrl}`);
  }
});
