export const INSTAGRAM_USERNAME = "zaydioandpals";
export const FALLBACK_REEL_SHORTCODE = "DZkN4AFDXzo";

export interface LatestReel {
  shortcode: string;
  permalink: string;
  embedUrl: string;
  videoUrl?: string;
  posterUrl?: string;
}

export interface InstagramTimelineNode {
  shortcode?: string;
  product_type?: string;
  video_url?: string;
  display_url?: string;
  thumbnail_src?: string;
}

interface InstagramProfileUser {
  edge_owner_to_timeline_media?: {
    edges?: Array<{ node?: InstagramTimelineNode }>;
  };
}

export function pickLatestReelNode(user: InstagramProfileUser): InstagramTimelineNode | null {
  const edges = user.edge_owner_to_timeline_media?.edges ?? [];
  for (const { node } of edges) {
    if (node?.product_type === "clips" && node.shortcode) {
      return node;
    }
  }
  return null;
}

export function reelFromNode(node: InstagramTimelineNode): LatestReel {
  const shortcode = node.shortcode!;
  return {
    shortcode,
    permalink: `https://www.instagram.com/reel/${shortcode}/`,
    embedUrl: `https://www.instagram.com/reel/${shortcode}/embed`,
    videoUrl: node.video_url,
    posterUrl: node.display_url || node.thumbnail_src,
  };
}

export function reelFromShortcode(shortcode: string): LatestReel {
  return {
    shortcode,
    permalink: `https://www.instagram.com/reel/${shortcode}/`,
    embedUrl: `https://www.instagram.com/reel/${shortcode}/embed`,
  };
}

export async function fetchLatestReel(): Promise<LatestReel> {
  const response = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZaydioSite/1.0)",
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Instagram API returned ${response.status}`);
  }

  const payload = await response.json();
  const node = pickLatestReelNode(payload.data.user);
  if (!node) {
    throw new Error("No Instagram reel found in profile timeline");
  }

  return reelFromNode(node);
}
