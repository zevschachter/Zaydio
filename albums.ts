export const ZAYDIO_APPLE_ARTIST_ID = "1868898316";

export interface ZaydioAlbum {
  name: string;
  spotifyId: string;
  trackCount: number;
  releaseDate: string;
  appleMusicUrl?: string;
  coverImage: string;
}

interface ITunesCollection {
  wrapperType?: string;
  collectionName?: string;
  collectionId?: number;
  trackCount?: number;
  releaseDate?: string;
  collectionViewUrl?: string;
}

// Spotify IDs keyed by normalized album title.
const SPOTIFY_ALBUM_IDS: Record<string, string> = {
  "the new abcs": "6rvUo2MgTdx0izM1WTOm3h",
  "everybody sing": "3FYu2RhdpG6Cf5FbckfJwp",
  "sing along lullabies": "3nq1lapyQTbLU5qoLcsebj",
  "island vibes lullabies": "1phCU3l6j5z0cujrT5Sqzo",
};

const ALBUM_COVER_IMAGES: Record<string, string> = {
  "the new abcs": "/album-the-new-abcs.webp",
  "everybody sing": "/album-everybody-sing.webp",
  "sing along lullabies": "/album-sing-along-lullabies.webp",
  "island vibes lullabies": "/album-island-vibes-lullabies.webp",
};

const FALLBACK_APPLE_MUSIC_URLS: Record<string, string> = {
  "the new abcs": "https://music.apple.com/us/album/the-new-abcs/1868899561",
  "everybody sing": "https://music.apple.com/us/album/everybody-sing/1874755937",
  "sing along lullabies": "https://music.apple.com/us/album/sing-along-lullabies/1886542245",
  "island vibes lullabies": "https://music.apple.com/us/album/island-vibes-lullabies/1895439243",
};

export function normalizeAlbumName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''']/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function spotifyIdForAlbum(name: string): string | undefined {
  return SPOTIFY_ALBUM_IDS[normalizeAlbumName(name)];
}

export function coverImageForAlbum(name: string): string {
  return ALBUM_COVER_IMAGES[normalizeAlbumName(name)] ?? "/ZAYDIOLOGO.webp";
}

function appleMusicUrlForAlbum(name: string, fromApi?: string): string | undefined {
  if (fromApi) return fromApi.split("?")[0];
  return FALLBACK_APPLE_MUSIC_URLS[normalizeAlbumName(name)];
}

export function albumsFromITunesResults(results: ITunesCollection[]): ZaydioAlbum[] {
  const albums: ZaydioAlbum[] = [];

  for (const item of results) {
    if (item.wrapperType !== "collection" || !item.collectionName) continue;

    const spotifyId = spotifyIdForAlbum(item.collectionName);
    if (!spotifyId) continue;

    albums.push({
      name: item.collectionName,
      spotifyId,
      trackCount: item.trackCount ?? 0,
      releaseDate: item.releaseDate ?? "",
      appleMusicUrl: appleMusicUrlForAlbum(item.collectionName, item.collectionViewUrl),
      coverImage: coverImageForAlbum(item.collectionName),
    });
  }

  return albums.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

export async function fetchZaydioAlbums(): Promise<ZaydioAlbum[]> {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${ZAYDIO_APPLE_ARTIST_ID}&entity=album`,
  );

  if (!response.ok) {
    throw new Error(`iTunes API returned ${response.status}`);
  }

  const payload = await response.json();
  const albums = albumsFromITunesResults(payload.results ?? []);

  if (albums.length === 0) {
    throw new Error("No Zaydio albums with Spotify previews found");
  }

  return albums;
}

export function fallbackAlbums(): ZaydioAlbum[] {
  return [
    {
      name: "The New Abc's",
      spotifyId: SPOTIFY_ALBUM_IDS["the new abcs"],
      trackCount: 14,
      releaseDate: "2026-01-07T08:00:00Z",
      appleMusicUrl: FALLBACK_APPLE_MUSIC_URLS["the new abcs"],
      coverImage: ALBUM_COVER_IMAGES["the new abcs"],
    },
    {
      name: "Everybody Sing",
      spotifyId: SPOTIFY_ALBUM_IDS["everybody sing"],
      trackCount: 12,
      releaseDate: "2026-01-29T08:00:00Z",
      appleMusicUrl: FALLBACK_APPLE_MUSIC_URLS["everybody sing"],
      coverImage: ALBUM_COVER_IMAGES["everybody sing"],
    },
    {
      name: "Sing Along Lullabies",
      spotifyId: SPOTIFY_ALBUM_IDS["sing along lullabies"],
      trackCount: 14,
      releaseDate: "2026-03-11T07:00:00Z",
      appleMusicUrl: FALLBACK_APPLE_MUSIC_URLS["sing along lullabies"],
      coverImage: ALBUM_COVER_IMAGES["sing along lullabies"],
    },
    {
      name: "Island Vibes Lullabies",
      spotifyId: SPOTIFY_ALBUM_IDS["island vibes lullabies"],
      trackCount: 12,
      releaseDate: "2026-04-19T07:00:00Z",
      appleMusicUrl: FALLBACK_APPLE_MUSIC_URLS["island vibes lullabies"],
      coverImage: ALBUM_COVER_IMAGES["island vibes lullabies"],
    },
  ];
}
