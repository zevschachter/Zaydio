/// <reference lib="deno.unstable" />

/** "This helped" vote counts stored in Deno KV. */

const SLUG_MAX = 100;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_POSTS = 10;

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

export async function getHelpfulCount(
  kv: Deno.Kv,
  slug: string,
): Promise<number> {
  const entry = await kv.get<Deno.KvU64>(helpfulKvKey(slug));
  if (!entry.value) return 0;
  return Number(entry.value.value);
}

export async function incrementHelpfulCount(
  kv: Deno.Kv,
  slug: string,
): Promise<number> {
  const key = helpfulKvKey(slug);
  const result = await kv.atomic().sum(key, 1n).commit();
  if (!result.ok) {
    throw new Error("Failed to increment helpful count");
  }
  return getHelpfulCount(kv, slug);
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
    const count = await incrementHelpfulCount(store, slug);
    return Response.json({ count }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
}
