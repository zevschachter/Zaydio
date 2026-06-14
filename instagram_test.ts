import {
  FALLBACK_REEL_SHORTCODE,
  pickLatestReelNode,
  reelFromNode,
  reelFromShortcode,
} from "./instagram.ts";

Deno.test("pickLatestReelNode returns first clips item", () => {
  const node = pickLatestReelNode({
    edge_owner_to_timeline_media: {
      edges: [
        { node: { shortcode: "photo123", product_type: "feed" } },
        {
          node: {
            shortcode: "reel456",
            product_type: "clips",
            video_url: "https://example.com/reel456.mp4",
            display_url: "https://example.com/reel456.jpg",
          },
        },
        { node: { shortcode: "reel789", product_type: "clips" } },
      ],
    },
  });

  if (node?.shortcode !== "reel456") {
    throw new Error(`Expected reel456, got ${node?.shortcode}`);
  }
});

Deno.test("pickLatestReelNode returns null when no clips exist", () => {
  const node = pickLatestReelNode({
    edge_owner_to_timeline_media: {
      edges: [{ node: { shortcode: "photo123", product_type: "feed" } }],
    },
  });

  if (node !== null) {
    throw new Error(`Expected null, got ${node?.shortcode}`);
  }
});

Deno.test("reelFromNode includes video and poster URLs", () => {
  const reel = reelFromNode({
    shortcode: "reel456",
    product_type: "clips",
    video_url: "https://example.com/reel456.mp4",
    display_url: "https://example.com/reel456.jpg",
  });

  if (reel.videoUrl !== "https://example.com/reel456.mp4") {
    throw new Error(`Unexpected video URL: ${reel.videoUrl}`);
  }
  if (reel.posterUrl !== "https://example.com/reel456.jpg") {
    throw new Error(`Unexpected poster URL: ${reel.posterUrl}`);
  }
});

Deno.test("reelFromShortcode builds embed URLs", () => {
  const reel = reelFromShortcode(FALLBACK_REEL_SHORTCODE);
  if (reel.embedUrl !== `https://www.instagram.com/reel/${FALLBACK_REEL_SHORTCODE}/embed`) {
    throw new Error(`Unexpected embed URL: ${reel.embedUrl}`);
  }
});
