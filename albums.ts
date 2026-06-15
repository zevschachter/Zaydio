export const ZAYDIO_APPLE_ARTIST_ID = "1868898316";

export interface ZaydioAlbum {
  name: string;
  spotifyId: string;
  trackCount: number;
  releaseDate: string;
  appleMusicUrl?: string;
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
      appleMusicUrl: item.collectionViewUrl,
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
    },
    {
      name: "Everybody Sing",
      spotifyId: SPOTIFY_ALBUM_IDS["everybody sing"],
      trackCount: 12,
      releaseDate: "2026-01-29T08:00:00Z",
    },
    {
      name: "Sing Along Lullabies",
      spotifyId: SPOTIFY_ALBUM_IDS["sing along lullabies"],
      trackCount: 14,
      releaseDate: "2026-03-11T07:00:00Z",
    },
    {
      name: "Island Vibes Lullabies",
      spotifyId: SPOTIFY_ALBUM_IDS["island vibes lullabies"],
      trackCount: 12,
      releaseDate: "2026-04-19T07:00:00Z",
    },
  ];
}
