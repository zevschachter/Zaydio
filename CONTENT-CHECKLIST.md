# New Blog Post Checklist

## Build
- [ ] EN post created at /blog/<slug>/ with BlogPosting + FAQPage schema, publisher @id set
- [ ] ES version created at /es/blog/<slug-es>/ (translate or flip the frame — decide per post)
- [ ] hreflang pair added both directions
- [ ] Canonical uses https://www.zaydio.com (www)
- [ ] og:image + 1200/630 size tags, twitter:card summary_large_image — prefer a custom 1200×630 per post (not shared `og-image.jpg`)
- [ ] Image files named `zaydio-[subject]-[context].webp`; alt text describes the image (a11y = SEO)
- [ ] "This helped" button present
- [ ] Sources section follows site convention
- [ ] Answer-first first sentence under every body H2/H3 (FAQ already does this)
- [ ] Internal anchors ~60% descriptive / 40% conversational; no duplicate anchor text on one page
- [ ] `dateModified` updated when content changes; visible "Last updated" in byline
- [ ] BlogPosting has `inLanguage`, `publisher` @id, `about` Thing(s); keep FAQPage content even though FAQ rich results are gone

## Mesh
- [ ] Post added to blog_posts.ts — REQUIRED: this drives both the sitemap and RSS feeds. Missing this means the post is invisible to both.
- [ ] Added to /blog/ and /es/blog/ indexes (static entry, newest first)
- [ ] Added to sitemap (count incremented)
- [ ] Homepage "From the Blog" strip updated to 3 most recent
- [ ] Reciprocal links added FROM related existing posts TO this one
- [ ] Relevant album page "From the blog" section updated
- [ ] grep -rn "TODO: link" → resolve any that this post satisfies

## Verify (after push)
- [ ] curl the live EN + ES URLs — do NOT trust cached fetches
- [ ] Schema validates (Rich Results test)
- [ ] Share preview renders (Facebook Sharing Debugger, scrape again)
- [ ] Mobile check at 380px: no text touching edges, breadcrumb aligned with H1

## Distribute
- [ ] Google Search Console → URL Inspection → Request indexing (EN + ES)
- [ ] Social announcement scheduled (platform hashtag rules apply)
- [ ] Pinterest pin created (vertical graphic, links to post)
- [ ] Noted in content calendar / next-post queue
