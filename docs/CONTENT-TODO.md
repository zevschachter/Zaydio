# Content TODO

Short queue of known content gaps. Not a spec — see [CONTENT-CHECKLIST.md](../CONTENT-CHECKLIST.md) for the per-post process.

## Images
- [ ] Custom 1200×630 `og:image` per post. No post has one yet: most reuse a YouTube `maxresdefault.jpg` or an album cover, and the screen-time pair (`/blog/toddler-screen-time-honest-take/`, `/es/blog/es-malo-youtube-para-ninos-pequenos/`) still points at the shared `og-image.jpg`.

## Video
- [ ] No Spanish colors video exists, so `/es/blog/canciones-de-colores-para-ninos/` embeds the EN video (`LOoweIO_NhA`). Swap in an ES video when one ships; leave the EN embed until then.

## Translations
- [ ] EN↔ES pairing is currently complete — all 8 EN posts have an ES counterpart and every `POST_COMPONENTS` entry has an `altPath`. Keep it 1:1 as new posts land; `postsMissingTranslation()` in `blog_components.ts` lists any that fall behind.
