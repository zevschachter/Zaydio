import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  allowHelpfulPost,
  buildHelpfulStats,
  constantTimeEqual,
  extractBearerToken,
  getHelpfulCount,
  getHelpfulDailyCount,
  handleHelpfulPost,
  handleHelpfulStats,
  helpfulDailyKvKey,
  helpfulKvKey,
  incrementHelpfulCount,
  isAuthorizedStatsToken,
  isValidHelpfulSlug,
  lastNUtcDates,
  titleForHelpfulSlug,
  utcDateString,
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

Deno.test("utcDateString and lastNUtcDates use UTC calendar days", () => {
  const d = new Date("2026-08-10T23:30:00.000Z");
  assertEquals(utcDateString(d), "2026-08-10");
  assertEquals(lastNUtcDates(3, d), [
    "2026-08-08",
    "2026-08-09",
    "2026-08-10",
  ]);
});

Deno.test("helpfulDailyKvKey shape matches helpful:daily:<slug>:<date>", () => {
  assertEquals(
    helpfulDailyKvKey("blog/foo", "2026-08-10"),
    ["helpful:daily", "blog/foo", "2026-08-10"],
  );
  assertEquals(helpfulKvKey("blog/foo"), ["helpful", "blog/foo"]);
});

Deno.test("constantTimeEqual compares without === semantics leaks in result", () => {
  assertEquals(constantTimeEqual("abc", "abc"), true);
  assertEquals(constantTimeEqual("abc", "abd"), false);
  assertEquals(constantTimeEqual("abc", "ab"), false);
  assertEquals(constantTimeEqual("", ""), true);
  assertEquals(constantTimeEqual("token", "token"), true);
  // Must not use reference equality for truthiness of distinct equal strings
  assertEquals(constantTimeEqual("same", "same"), true);
});

Deno.test("isAuthorizedStatsToken rejects missing env, missing header, mismatch", () => {
  assertEquals(isAuthorizedStatsToken("secret", null), false);
  assertEquals(isAuthorizedStatsToken("secret", ""), false);
  assertEquals(isAuthorizedStatsToken("secret", undefined), false);
  assertEquals(isAuthorizedStatsToken(null, "secret"), false);
  assertEquals(isAuthorizedStatsToken("wrong", "secret"), false);
  assertEquals(isAuthorizedStatsToken("secret", "secret"), true);
});

Deno.test("extractBearerToken parses Authorization header", () => {
  assertEquals(
    extractBearerToken(
      new Request("https://example.com", {
        headers: { Authorization: "Bearer my-token" },
      }),
    ),
    "my-token",
  );
  assertEquals(
    extractBearerToken(new Request("https://example.com")),
    null,
  );
  assertEquals(
    extractBearerToken(
      new Request("https://example.com", {
        headers: { Authorization: "Basic x" },
      }),
    ),
    null,
  );
});

Deno.test("titleForHelpfulSlug matches blog_posts paths", () => {
  const title = titleForHelpfulSlug("blog/you-dont-have-to-sing-well");
  assertEquals(typeof title, "string");
  assertEquals(title!.includes("Sing"), true);
  assertEquals(titleForHelpfulSlug("blog/not-a-real-post"), null);
});

Deno.test({
  name: "incrementHelpfulCount updates total and daily bucket",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const kv = await Deno.openKv(":memory:");
    try {
      const slug = "blog/test-post";
      const now = new Date("2026-08-10T12:00:00.000Z");
      const count = await incrementHelpfulCount(kv, slug, now);
      assertEquals(count, 1);
      assertEquals(await getHelpfulCount(kv, slug), 1);
      assertEquals(await getHelpfulDailyCount(kv, slug, "2026-08-10"), 1);
      assertEquals(await getHelpfulDailyCount(kv, slug, "2026-08-09"), 0);

      await incrementHelpfulCount(kv, slug, now);
      assertEquals(await getHelpfulCount(kv, slug), 2);
      assertEquals(await getHelpfulDailyCount(kv, slug, "2026-08-10"), 2);
    } finally {
      kv.close();
    }
  },
});

Deno.test({
  name: "handleHelpfulPost increments daily key via helper path",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const kv = await Deno.openKv(":memory:");
    try {
      const slug = "blog/post-via-handler";
      const now = new Date("2026-07-01T01:00:00.000Z");
      const ip = `post-${crypto.randomUUID()}`;
      const req = new Request("https://example.com/api/helpful", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ slug }),
      });
      const res = await handleHelpfulPost(req, kv, now);
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.count, 1);
      assertEquals(await getHelpfulDailyCount(kv, slug, "2026-07-01"), 1);
    } finally {
      kv.close();
    }
  },
});

Deno.test({
  name: "handleHelpfulStats returns 401 without/wrong/empty token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const kv = await Deno.openKv(":memory:");
    try {
      const url = "https://example.com/api/helpful/stats";

      const noHeader = await handleHelpfulStats(
        new Request(url),
        kv,
        { token: "good-token" },
      );
      assertEquals(noHeader.status, 401);

      const wrong = await handleHelpfulStats(
        new Request(url, {
          headers: { Authorization: "Bearer nope" },
        }),
        kv,
        { token: "good-token" },
      );
      assertEquals(wrong.status, 401);

      const emptyEnv = await handleHelpfulStats(
        new Request(url, {
          headers: { Authorization: "Bearer anything" },
        }),
        kv,
        { token: "" },
      );
      assertEquals(emptyEnv.status, 401);

      const missingEnv = await handleHelpfulStats(
        new Request(url, {
          headers: { Authorization: "Bearer anything" },
        }),
        kv,
        { token: null },
      );
      assertEquals(missingEnv.status, 401);
    } finally {
      kv.close();
    }
  },
});

Deno.test({
  name: "handleHelpfulStats returns expected JSON shape",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const kv = await Deno.openKv(":memory:");
    try {
      const now = new Date("2026-08-10T15:00:00.000Z");
      await incrementHelpfulCount(kv, "blog/you-dont-have-to-sing-well", now);
      await incrementHelpfulCount(
        kv,
        "blog/you-dont-have-to-sing-well",
        new Date("2026-08-09T15:00:00.000Z"),
      );
      await incrementHelpfulCount(kv, "blog/bedtime-songs-for-toddlers", now);

      const stats = await buildHelpfulStats(kv, now);
      assertEquals(stats.grandTotal, 3);
      assertEquals(stats.posts.length, 2);
      assertEquals(stats.posts[0]!.total >= stats.posts[1]!.total, true);
      assertEquals(stats.posts[0]!.daily.length, 60);
      assertEquals(stats.posts[0]!.daily.at(-1)?.date, "2026-08-10");

      const res = await handleHelpfulStats(
        new Request("https://example.com/api/helpful/stats", {
          headers: { Authorization: "Bearer test-stats-token" },
        }),
        kv,
        { token: "test-stats-token", now },
      );
      assertEquals(res.status, 200);
      const json = await res.json();
      assertEquals(json.grandTotal, 3);
      assertEquals(Array.isArray(json.posts), true);
      assertEquals(typeof json.posts[0].slug, "string");
      assertEquals(typeof json.posts[0].total, "number");
      assertEquals(Array.isArray(json.posts[0].daily), true);
      assertEquals(json.posts[0].daily.length, 60);
      assertEquals(
        json.posts.find((p: { slug: string }) =>
          p.slug === "blog/you-dont-have-to-sing-well"
        )?.title?.includes("Sing"),
        true,
      );
    } finally {
      kv.close();
    }
  },
});
