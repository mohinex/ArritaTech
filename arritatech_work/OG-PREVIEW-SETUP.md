# Social sharing preview setup

The uploaded brand artwork is included as `frontend/public/og-preview.png` (1200×630).

1. In Vercel Production environment variables set `SITE_URL=https://YOUR-ACTUAL-DOMAIN` (no trailing slash).
2. Redeploy with the build command `npm run build` / `npm run build:vercel`. The script writes absolute URLs for `og:image`, `twitter:image`, `og:url` and `canonical` into the output HTML.
3. Confirm that `https://YOUR-ACTUAL-DOMAIN/og-preview.png` serves the image publicly and that the server-rendered HTML has OG tags.
4. Test the URL in Facebook Sharing Debugger or LinkedIn Post Inspector. Cached previews may need to be refreshed.

Without `SITE_URL`, the source HTML uses a relative image path, which is not reliably supported by all social crawlers.
