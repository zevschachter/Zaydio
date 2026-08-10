import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BLOG_POSTS } from "./blog_posts.ts";
import {
  BEGIN_MARKER,
  BLOG_CSS_VERSION,
  BLOG_INDEX_PAGES,
  END_MARKER,
  fileForPath,
  HELPFUL_JS_VERSION,
  helpfulSlugForPath,
  POST_COMPONENTS,
  postsMissingTranslation,
  renderHelpfulWidget,
  renderLangSwitch,
  renderSchemaAbout,
} from "./blog_components.ts";
import { syncPostHtml } from "./scripts/sync_blog_components.ts";

const postHtml = new Map<string, string>();
for (const post of BLOG_POSTS) {
  postHtml.set(post.path, await Deno.readTextFile(fileForPath(post.path)));
}

Deno.test("every post in blog_posts.ts has a components entry", () => {
  for (const post of BLOG_POSTS) {
    assert(
      POST_COMPONENTS[post.path],
      `${post.path} is missing from POST_COMPONENTS`,
    );
  }
  assertEquals(
    Object.keys(POST_COMPONENTS).length,
    BLOG_POSTS.length,
    "POST_COMPONENTS has entries for posts that are not in blog_posts.ts",
  );
});

Deno.test("posts are in sync with the generated components", () => {
  for (const post of BLOG_POSTS) {
    const html = postHtml.get(post.path)!;
    assertEquals(
      syncPostHtml(post, html),
      html,
      `${fileForPath(post.path)} is out of date — run \`deno task sync:posts\``,
    );
  }
});

Deno.test("every post renders the like button wired to its own slug", () => {
  for (const post of BLOG_POSTS) {
    const html = postHtml.get(post.path)!;
    // Posts indent the generated block, so compare line by line.
    for (const line of renderHelpfulWidget(post).split("\n")) {
      assertStringIncludes(html, line.trim());
    }
    assertStringIncludes(
      html,
      `data-slug="${helpfulSlugForPath(post.path)}"`,
    );
    assertStringIncludes(html, "zaydio-thumbs-up-256.png");
    assertStringIncludes(html, 'class="blog-helpful-confetti"');
  }
});

Deno.test("EN<->ES switchers link both directions from one position", () => {
  for (const post of BLOG_POSTS) {
    const config = POST_COMPONENTS[post.path]!;
    const html = postHtml.get(post.path)!;
    if (!config.altPath) {
      assertEquals(
        renderLangSwitch(post),
        "",
        `${post.path} has no counterpart but renders a switcher`,
      );
      continue;
    }

    assertStringIncludes(html, renderLangSwitch(post));

    const counterpart = BLOG_POSTS.find((p) => p.path === config.altPath);
    assert(
      counterpart,
      `${post.path} links to ${config.altPath}, which is not a published post`,
    );
    assertEquals(
      POST_COMPONENTS[config.altPath]?.altPath,
      post.path,
      `${config.altPath} does not link back to ${post.path}`,
    );

    // The switcher sits in the generated block, above the signup box and Sources.
    const switchAt = html.indexOf('class="blog-lang-switch"');
    const buttonAt = html.indexOf('class="blog-helpful"');
    assert(
      switchAt > 0 && switchAt < buttonAt,
      `${post.path}: switcher is not immediately above the like button`,
    );
  }
});

Deno.test("paired posts declare hreflang in both directions", () => {
  const base = "https://www.zaydio.com";
  for (const post of BLOG_POSTS) {
    const config = POST_COMPONENTS[post.path]!;
    const html = postHtml.get(post.path)!;

    if (!config.altPath) {
      // Untranslated posts must not advertise an alternate that doesn't exist.
      assert(
        !html.includes('hreflang="es"') && !html.includes('hreflang="en"'),
        `${post.path} has no counterpart but declares hreflang alternates`,
      );
      continue;
    }

    const altLang = post.lang === "en" ? "es" : "en";
    assertStringIncludes(
      html,
      `hreflang="${post.lang}" href="${base}${post.path}"`,
    );
    assertStringIncludes(
      html,
      `hreflang="${altLang}" href="${base}${config.altPath}"`,
    );
    // x-default points at the English original for every pair.
    const enPath = post.lang === "en" ? post.path : config.altPath;
    assertStringIncludes(
      html,
      `hreflang="x-default" href="${base}${enPath}"`,
    );
  }
});

Deno.test("schema keywords are present, post-specific, and 5-8 terms", () => {
  const seen = new Set<string>();
  for (const post of BLOG_POSTS) {
    const config = POST_COMPONENTS[post.path]!;
    const terms = config.keywords.split(",").map((t) => t.trim());
    assert(
      terms.length >= 5 && terms.length <= 8,
      `${post.path} has ${terms.length} keywords, expected 5-8`,
    );
    assert(
      terms.every((t) => t.length > 0),
      `${post.path} has an empty keyword`,
    );
    assert(
      !seen.has(config.keywords),
      `${post.path} reuses another post's keyword list`,
    );
    seen.add(config.keywords);

    assertStringIncludes(
      postHtml.get(post.path)!,
      `"keywords": "${config.keywords}"`,
    );
  }
});

Deno.test("schema about Things are configured and rendered on every post", () => {
  for (const post of BLOG_POSTS) {
    const config = POST_COMPONENTS[post.path]!;
    const html = postHtml.get(post.path)!;
    assert(
      config.about.length >= 2,
      `${post.path} needs at least 2 schema about Things`,
    );
    assertStringIncludes(html, '"about": [');
    for (const name of config.about) {
      assertStringIncludes(html, `"name": "${name}"`);
    }
  }
});

Deno.test("renderSchemaAbout emits the JSON-LD shape posts already use", () => {
  assertEquals(
    renderSchemaAbout(["Sleep", "Bedtime routines"], "    "),
    [
      '    "about": [',
      "        {",
      '            "@type": "Thing",',
      '            "name": "Sleep"',
      "        },",
      "        {",
      '            "@type": "Thing",',
      '            "name": "Bedtime routines"',
      "        }",
      "    ],",
    ].join("\n"),
  );
});

Deno.test("a brand-new post gets every component from one sync run", () => {
  // A future post only has to carry the markers and a BlogPosting node. Here
  // `inLanguage` is the final property, so schema inserts must not strand a
  // trailing comma.
  const post = BLOG_POSTS[0]!;
  const config = POST_COMPONENTS[post.path]!;
  const skeleton = [
    '<html lang="en">',
    '<link rel="stylesheet" href="/blog/blog.css?v=1">',
    '<script type="application/ld+json">',
    "{",
    '    "@context": "https://schema.org",',
    '    "@graph": [',
    "        {",
    '            "@type": "BlogPosting",',
    '            "headline": "Draft",',
    '            "inLanguage": "en"',
    "        }",
    "    ]",
    "}",
    "</script>",
    `                ${BEGIN_MARKER}`,
    `                ${END_MARKER}`,
    '<script src="/blog/helpful.js?v=1"></script>',
    "</html>",
  ].join("\n");

  const synced = syncPostHtml(post, skeleton);

  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    .exec(synced)![1];
  const blogPosting = (JSON.parse(json)["@graph"] as Array<
    Record<string, unknown>
  >).find((node) => node["@type"] === "BlogPosting")!;

  assertEquals(blogPosting.keywords, config.keywords);
  assertEquals(
    blogPosting.about,
    config.about.map((name) => ({ "@type": "Thing", name })),
  );
  assertEquals(blogPosting.inLanguage, "en");

  assertStringIncludes(synced, `data-slug="${helpfulSlugForPath(post.path)}"`);
  assertStringIncludes(synced, renderLangSwitch(post));
  assertStringIncludes(synced, `/blog/blog.css?v=${BLOG_CSS_VERSION}`);
  assertStringIncludes(synced, `/blog/helpful.js?v=${HELPFUL_JS_VERSION}`);
});

Deno.test("posts load the current blog.css and helpful.js versions", () => {
  for (const post of BLOG_POSTS) {
    const html = postHtml.get(post.path)!;
    assertStringIncludes(html, `/blog/blog.css?v=${BLOG_CSS_VERSION}`);
    assertStringIncludes(html, `/blog/helpful.js?v=${HELPFUL_JS_VERSION}`);
  }
});

Deno.test("blog indexes load the current blog.css version", async () => {
  for (const path of BLOG_INDEX_PAGES) {
    const html = await Deno.readTextFile(fileForPath(path));
    assertStringIncludes(html, `/blog/blog.css?v=${BLOG_CSS_VERSION}`);
  }
});

Deno.test("posts without a translation are reported, never invented", () => {
  // Every published post is currently paired; a new untranslated post shows up
  // here until its counterpart lands, and this list is what the checklist reads.
  assertEquals(postsMissingTranslation().map((p) => p.path), []);
});
