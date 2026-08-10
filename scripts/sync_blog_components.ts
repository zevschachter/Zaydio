#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Writes the shared post components (ES switcher + "this helped" button) and
 * the asset cache-bust versions into every blog post listed in `blog_posts.ts`.
 *
 * Posts are standalone HTML with no build step, so this script is the template
 * engine: edit `blog_components.ts`, run `deno task sync:posts`, and every post
 * — existing and future — ends up with identical, correct markup.
 *
 *   deno task sync:posts          # rewrite posts
 *   deno task sync:posts --check  # exit 1 if any post is out of date
 */

import { BLOG_POSTS, type BlogPost } from "../blog_posts.ts";
import {
  BEGIN_MARKER_PREFIX,
  BLOG_CSS_VERSION,
  END_MARKER,
  fileForPath,
  HELPFUL_JS_VERSION,
  POST_COMPONENTS,
  renderPostComponents,
  renderSchemaAbout,
} from "../blog_components.ts";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const GENERATED_REGION = new RegExp(
  `^[ \\t]*${escapeRegExp(BEGIN_MARKER_PREFIX)}[\\s\\S]*?${
    escapeRegExp(END_MARKER)
  }[ \\t]*$`,
  "m",
);

/** Pre-template markup: the hand-pasted helpful button and its guide comment. */
const LEGACY_HELPFUL_BLOCK =
  /^([ \t]*)<!-- HELPFUL-BUTTON:[^\n]*\n[\s\S]*?\n[ \t]*<\/div>[ \t]*$/m;

function legacyLangSwitch(altPath: string): RegExp {
  return new RegExp(
    `\\n[ \\t]*<p>[^<\\n]*&rarr;\\s*<a href="${altPath}">[^<\\n]*<\\/a>\\.?<\\/p>[ \\t]*\\n`,
    "g",
  );
}

function indentOf(line: string): string {
  return /^[ \t]*/.exec(line)?.[0] ?? "";
}

/**
 * Anchor for schema insertions. `inLanguage` may or may not be the last
 * property of the BlogPosting, so the trailing comma is optional and gets
 * carried through verbatim — inserted fields always go *before* it and so
 * always end with a comma of their own.
 */
const IN_LANGUAGE_LINE = /^([ \t]*)"inLanguage": "(en|es)"(,?)$/m;

/** Insert post-specific schema keywords next to the existing inLanguage field. */
function withKeywords(html: string, keywords: string): string {
  if (/^[ \t]*"keywords":/m.test(html)) return html;
  return html.replace(
    IN_LANGUAGE_LINE,
    (_m, indent: string, lang: string, comma: string) =>
      `${indent}"keywords": "${keywords}",\n${indent}"inLanguage": "${lang}"${comma}`,
  );
}

/**
 * Insert the schema `about` Things when a post lacks them. Posts written before
 * this was templated already carry an equivalent block after `inLanguage`;
 * those are left alone, and `blog_components_test.ts` checks their contents.
 */
function withAbout(html: string, about: string[]): string {
  if (/^[ \t]*"about":/m.test(html)) return html;
  return html.replace(
    IN_LANGUAGE_LINE,
    (_m, indent: string, lang: string, comma: string) =>
      `${renderSchemaAbout(about, indent)}\n${indent}"inLanguage": "${lang}"${comma}`,
  );
}

function withAssetVersions(html: string): string {
  return html
    .replace(
      /\/blog\/blog\.css\?v=[^"']+/g,
      `/blog/blog.css?v=${BLOG_CSS_VERSION}`,
    )
    .replace(
      /\/blog\/helpful\.js\?v=[^"']+/g,
      `/blog/helpful.js?v=${HELPFUL_JS_VERSION}`,
    );
}

export function syncPostHtml(post: BlogPost, html: string): string {
  const config = POST_COMPONENTS[post.path];
  if (!config) {
    throw new Error(`No blog_components.ts entry for ${post.path}`);
  }

  let next = html;

  // Retire any pre-template switcher paragraph; the generated block owns it now.
  if (config.altPath) {
    next = next.replace(legacyLangSwitch(config.altPath), "");
  }

  const existing = GENERATED_REGION.exec(next) ??
    LEGACY_HELPFUL_BLOCK.exec(next);
  if (!existing) {
    throw new Error(
      `${
        fileForPath(post.path)
      }: found neither a generated region nor a legacy helpful block`,
    );
  }

  const indent = indentOf(existing[0]);
  next = next.replace(existing[0], () => renderPostComponents(post, indent));

  next = withKeywords(next, config.keywords);
  next = withAbout(next, config.about);
  return withAssetVersions(next);
}

async function main() {
  const checkOnly = Deno.args.includes("--check");
  const stale: string[] = [];

  for (const post of BLOG_POSTS) {
    const file = fileForPath(post.path);
    const html = await Deno.readTextFile(file);
    const next = syncPostHtml(post, html);
    if (next === html) continue;
    stale.push(file);
    if (!checkOnly) await Deno.writeTextFile(file, next);
  }

  if (stale.length === 0) {
    console.log(`All ${BLOG_POSTS.length} posts are up to date.`);
    return;
  }

  if (checkOnly) {
    console.error("Posts out of date — run `deno task sync:posts`:");
    for (const file of stale) console.error(`  ${file}`);
    Deno.exit(1);
  }

  console.log(`Updated ${stale.length} of ${BLOG_POSTS.length} posts:`);
  for (const file of stale) console.log(`  ${file}`);
}

if (import.meta.main) {
  await main();
}
