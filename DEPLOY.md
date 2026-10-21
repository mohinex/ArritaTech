# ArritaTech: GitHub → Vercel

1. Unzip and push the entire repository root to GitHub. Do not upload only `frontend/`.
2. Import the repository into Vercel. Root Directory: `./`. Framework Preset: `Other`. Node.js: `22.x`.
3. `vercel.json` specifies Build Command: `npm run build:vercel`, Output Directory: `frontend/dist`, and API Functions: `api/index.js`. Installation: `npm install`.
4. Add Vercel **server-only** secrets `DATABASE_URL` (hosted PostgreSQL) and `ADMIN_TOKEN` (generate `openssl rand -hex 32`). Set in Production, and Preview if required. Never use `VITE_` prefixes for secrets. Redeploy after configuring.
5. Optionally set `SITE_URL=https://your-real-domain` to generate a home-page sitemap; no domain is assumed.
6. On the live deployment verify `/`, `/admin`, `/admin/`, `/api/health`, submission from the contact modal, inquiry listing and browser refresh. `/api/health` is 503 until database is configured.

## Routes and security

- `/` is the landing page; `/admin` is the inquiry dashboard. Both support direct navigation and refresh through Vercel rewrites. `/api/*` requests go to `api/index.js` with the original route forwarded through the `route` query parameter; unknown API endpoints return JSON 404. Unsupported frontend paths use the SPA not-found UI; HTTP status for these SPA fallbacks is 200. No independent dynamic detail pages exist in this source.
- Static `/assets/*` has long immutable caching; public assets and `robots.txt` remain available. Admin page gets a client-side `noindex`.
- Contact submissions require a live Postgres database. `inquiries` table is created if the DB user has permission. Never use the local in-memory backend as production data storage.
- Admin endpoints require the strong `ADMIN_TOKEN` as a bearer token. The browser admin dashboard stores the token in sessionStorage; **not equivalent to managed authentication**, not recommended for a high-security enterprise dashboard. Use provider-based identity and secure server sessions if multiuser access is required.
- No OAuth, account sign-up, email service, or independent dynamic routes were included. Placeholder contact email in source must be replaced with a real address before launch.
- This package can be built and statically inspected offline, but zero live errors, availability, DB connection, or live Vercel runtime cannot be guaranteed without deployment and end-to-end tests.

## Local commands

```sh
npm install
npm run build:vercel
npm run check:deploy
node --check api/index.js
```
