/// <reference lib="deno.unstable" />

/**
 * "This helped" anonymous aggregate counts in Deno KV.
 *
 * Privacy constraints:
 * - No IP addresses stored in KV (existing in-memory rate limit may key by IP
 *   briefly within an isolate; IPs are never persisted)
 * - No user identifiers, cookies, or fingerprinting
 * - No third-party requests from these endpoints
 * - Anonymous aggregates only (running totals + per-day UTC buckets for trends)
 */

import { BLOG_POSTS } from "./blog_posts.ts";

const SLUG_MAX = 100;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_POSTS = 10;
const STATS_DAILY_DAYS = 60;
const STATS_TOKEN_ENV = "ZAYDIO_STATS_TOKEN";

let kvPromise: Promise<Deno.Kv> | null = null;

export async function getHelpfulKv(): Promise<Deno.Kv> {
  if (!kvPromise) {
    kvPromise = Deno.openKv();
  }
  return kvPromise;
}

/** Lowercase letters, digits, hyphens, slashes only; no leading/trailing slash or `//`. */
export function isValidHelpfulSlug(slug: string): boolean {
  if (typeof slug !== "string") return false;
  if (slug.length < 1 || slug.length > SLUG_MAX) return false;
  if (!/^[a-z0-9/-]+$/.test(slug)) return false;
  if (
    slug.includes("//") ||
    slug.startsWith("/") ||
    slug.endsWith("/") ||
    slug.startsWith("-") ||
    slug.endsWith("-")
  ) {
    return false;
  }
  return true;
}

export function helpfulKvKey(slug: string): Deno.KvKey {
  return ["helpful", slug];
}

/** Per-day trend key: helpful:daily:<slug>:<YYYY-MM-DD> (UTC). */
export function helpfulDailyKvKey(slug: string, ymd: string): Deno.KvKey {
  return ["helpful:daily", slug, ymd];
}

/** UTC calendar date as YYYY-MM-DD. */
export function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Last `n` UTC dates ending at `end` (inclusive), oldest first. */
export function lastNUtcDates(n: number, end = new Date()): string[] {
  const dates: string[] = [];
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  for (let i = n - 1; i >= 0; i--) {
    dates.push(new Date(endUtc - i * 86_400_000).toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Constant-time string compare (does not short-circuit on first differing byte).
 * Length mismatches still scan the longer buffer before returning false.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let mismatch = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const x = i < aBytes.length ? aBytes[i]! : 0;
    const y = i < bBytes.length ? bBytes[i]! : 0;
    mismatch |= x ^ y;
  }
  return mismatch === 0;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (header == null || header === "") return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return m ? m[1]! : null;
}

/** True only when expected token is non-empty and matches provided via constant-time compare. */
export function isAuthorizedStatsToken(
  provided: string | null,
  expected: string | undefined | null,
): boolean {
  if (expected == null || expected === "") return false;
  if (provided == null) return false;
  return constantTimeEqual(provided, expected);
}

export function titleForHelpfulSlug(slug: string): string | null {
  const path = `/${slug}/`;
  const post = BLOG_POSTS.find((p) => p.path === path);
  return post?.title ?? null;
}

export async function getHelpfulCount(
  kv: Deno.Kv,
  slug: string,
): Promise<number> {
  const entry = await kv.get<Deno.KvU64>(helpfulKvKey(slug));
  if (!entry.value) return 0;
  return Number(entry.value.value);
}

/**
 * Atomically increment running total and today's UTC daily bucket.
 * Daily keys are for trends only and never replace the public total.
 */
export async function incrementHelpfulCount(
  kv: Deno.Kv,
  slug: string,
  now = new Date(),
): Promise<number> {
  const totalKey = helpfulKvKey(slug);
  const dailyKey = helpfulDailyKvKey(slug, utcDateString(now));
  const result = await kv.atomic()
    .sum(totalKey, 1n)
    .sum(dailyKey, 1n)
    .commit();
  if (!result.ok) {
    throw new Error("Failed to increment helpful count");
  }
  return getHelpfulCount(kv, slug);
}

export async function getHelpfulDailyCount(
  kv: Deno.Kv,
  slug: string,
  ymd: string,
): Promise<number> {
  const entry = await kv.get<Deno.KvU64>(helpfulDailyKvKey(slug, ymd));
  if (!entry.value) return 0;
  return Number(entry.value.value);
}

export interface HelpfulStatsDaily {
  date: string;
  count: number;
}

export interface HelpfulStatsPost {
  slug: string;
  title: string | null;
  total: number;
  daily: HelpfulStatsDaily[];
}

export interface HelpfulStatsResponse {
  grandTotal: number;
  posts: HelpfulStatsPost[];
}

export async function buildHelpfulStats(
  kv: Deno.Kv,
  now = new Date(),
): Promise<HelpfulStatsResponse> {
  const dates = lastNUtcDates(STATS_DAILY_DAYS, now);
  const dateSet = new Set(dates);

  const totals = new Map<string, number>();
  for await (const entry of kv.list<Deno.KvU64>({ prefix: ["helpful"] })) {
    if (entry.key.length !== 2) continue;
    const slug = String(entry.key[1]);
    if (!isValidHelpfulSlug(slug)) continue;
    totals.set(slug, entry.value ? Number(entry.value.value) : 0);
  }

  const dailyBySlug = new Map<string, Map<string, number>>();
  for await (
    const entry of kv.list<Deno.KvU64>({ prefix: ["helpful:daily"] })
  ) {
    if (entry.key.length !== 3) continue;
    const slug = String(entry.key[1]);
    const ymd = String(entry.key[2]);
    if (!isValidHelpfulSlug(slug) || !dateSet.has(ymd)) continue;
    let byDate = dailyBySlug.get(slug);
    if (!byDate) {
      byDate = new Map();
      dailyBySlug.set(slug, byDate);
    }
    byDate.set(ymd, entry.value ? Number(entry.value.value) : 0);
    if (!totals.has(slug)) totals.set(slug, 0);
  }

  const posts: HelpfulStatsPost[] = [...totals.entries()]
    .map(([slug, total]) => {
      const byDate = dailyBySlug.get(slug);
      const daily = dates.map((date) => ({
        date,
        count: byDate?.get(date) ?? 0,
      }));
      return {
        slug,
        title: titleForHelpfulSlug(slug),
        total,
        daily,
      };
    })
    .sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug));

  const grandTotal = posts.reduce((sum, p) => sum + p.total, 0);
  return { grandTotal, posts };
}

/** Best-effort in-memory rate limit (per isolate; IP not persisted). */
const rateBuckets = new Map<string, number[]>();

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

export function allowHelpfulPost(ip: string, now = Date.now()): boolean {
  const cutoff = now - RATE_WINDOW_MS;
  const prev = rateBuckets.get(ip) ?? [];
  const recent = prev.filter((t) => t > cutoff);
  if (recent.length >= RATE_MAX_POSTS) {
    rateBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(ip, recent);
  return true;
}

export async function handleHelpfulGet(
  req: Request,
  kv?: Deno.Kv,
): Promise<Response> {
  const store = kv ?? await getHelpfulKv();
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  if (!isValidHelpfulSlug(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 });
  }
  const count = await getHelpfulCount(store, slug);
  return Response.json({ count }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function handleHelpfulPost(
  req: Request,
  kv?: Deno.Kv,
  now = new Date(),
): Promise<Response> {
  const store = kv ?? await getHelpfulKv();
  const ip = clientIpFromRequest(req);
  if (!allowHelpfulPost(ip)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    typeof body === "object" && body !== null && "slug" in body
      ? String((body as { slug: unknown }).slug)
      : "";

  if (!isValidHelpfulSlug(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const count = await incrementHelpfulCount(store, slug, now);
    return Response.json({ count }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
}

export async function handleHelpfulStats(
  req: Request,
  kv?: Deno.Kv,
  options?: { token?: string | null; now?: Date },
): Promise<Response> {
  const expected = options?.token !== undefined
    ? options.token
    : Deno.env.get(STATS_TOKEN_ENV);
  const provided = extractBearerToken(req);
  if (!isAuthorizedStatsToken(provided, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = kv ?? await getHelpfulKv();
  const stats = await buildHelpfulStats(store, options?.now ?? new Date());
  return Response.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}
