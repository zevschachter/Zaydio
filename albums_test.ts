import {
  albumsFromITunesResults,
  normalizeAlbumName,
  spotifyIdForAlbum,
} from "./albums.ts";

Deno.test("normalizeAlbumName handles curly apostrophes", () => {
  const normalized = normalizeAlbumName("The New Abc’s");
  if (normalized !== "the new abcs") {
    throw new Error(`Expected the new abcs, got ${normalized}`);
  }
});

Deno.test("spotifyIdForAlbum returns mapped album id", () => {
  const id = spotifyIdForAlbum("Island Vibes Lullabies");
  if (id !== "1phCU3l6j5z0cujrT5Sqzo") {
    throw new Error(`Unexpected spotify id: ${id}`);
  }
});

Deno.test("albumsFromITunesResults sorts albums by release date", () => {
  const albums = albumsFromITunesResults([
    {
      wrapperType: "collection",
      collectionName: "Island Vibes Lullabies",
      trackCount: 12,
      releaseDate: "2026-04-19T07:00:00Z",
    },
    {
      wrapperType: "collection",
      collectionName: "Everybody Sing",
      trackCount: 12,
      releaseDate: "2026-01-29T08:00:00Z",
    },
    {
      wrapperType: "artist",
      collectionName: "Zaydio",
    },
  ]);

  if (albums.length !== 2) {
    throw new Error(`Expected 2 albums, got ${albums.length}`);
  }
  if (albums[0].name !== "Everybody Sing") {
    throw new Error(`Expected Everybody Sing first, got ${albums[0].name}`);
  }
});
