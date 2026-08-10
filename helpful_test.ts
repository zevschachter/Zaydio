import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  allowHelpfulPost,
  isValidHelpfulSlug,
} from "./helpful.ts";

Deno.test("isValidHelpfulSlug accepts blog paths", () => {
  assertEquals(isValidHelpfulSlug("blog/toddler-screen-time-honest-take"), true);
  assertEquals(
    isValidHelpfulSlug("es/blog/es-malo-youtube-para-ninos-pequenos"),
    true,
  );
});

Deno.test("isValidHelpfulSlug rejects unsafe or malformed slugs", () => {
  assertEquals(isValidHelpfulSlug(""), false);
  assertEquals(isValidHelpfulSlug("/blog/foo"), false);
  assertEquals(isValidHelpfulSlug("blog/foo/"), false);
  assertEquals(isValidHelpfulSlug("blog//foo"), false);
  assertEquals(isValidHelpfulSlug("Blog/Foo"), false);
  assertEquals(isValidHelpfulSlug("blog/foo.bar"), false);
  assertEquals(isValidHelpfulSlug("blog/../etc"), false);
  assertEquals(isValidHelpfulSlug("a".repeat(101)), false);
});

Deno.test("allowHelpfulPost rate-limits repeated posts from one IP", () => {
  const ip = `test-${crypto.randomUUID()}`;
  const start = 1_000_000;
  for (let i = 0; i < 10; i++) {
    assertEquals(allowHelpfulPost(ip, start + i), true);
  }
  assertEquals(allowHelpfulPost(ip, start + 11), false);
  assertEquals(allowHelpfulPost(ip, start + 60_001), true);
});
