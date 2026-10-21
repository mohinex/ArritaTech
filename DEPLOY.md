# ArritaTech → GitHub → Vercel

## Vercel settings

- Repository: import the root of this repository (not `frontend/`).
- Framework Preset: **Other** (root `vercel.json` explicitly defines the Vite build and output).
- Root Directory: `./`.
- Install Command: `npm install` (leave default unless required).
- Build Command: `npm run build -w frontend` (in `vercel.json`).
- Output Directory: `frontend/dist` (in `vercel.json`).
- Node.js: 22.x.
- Production environment variables: `DATABASE_URL`, `ADMIN_TOKEN`. Optional: `PG_SSL=true` only when the provider's verified TLS configuration requires it.
- Generate secret: `openssl rand -hex 32`.
- Redeploy after adding or modifying environment variables.

## URLs / routes

- `/` → React landing page.
- `/admin` and `/admin/` → React inquiry dashboard.
- Other extensionless frontend URLs → `index.html`; unsupported paths display a client-side 404 page (HTTP status remains 200 due to SPA fallback).
- `/api/health` → PostgreSQL health check (503 if not configured).
- `POST /api/inquiries` → validated inquiry create with idempotency by clientId.
- `GET /api/admin/inquiries`, `PATCH /api/admin/inquiries/:id`, `DELETE /api/admin/inquiries/:id` → bearer-token protected.
- Unknown `/api/...` endpoints → JSON 404 (not HTML).
- `/assets/*` and files in `frontend/public` → static files; fingerprinted assets get immutable cache headers.

## Database setup

Use a reachable hosted PostgreSQL database (Neon, Supabase, etc.). Paste its **secret server-side** `DATABASE_URL` in Vercel environment variables. The serverless function automatically creates the `inquiries` table if the DB user has `CREATE TABLE` privilege. Data is not saved in local filesystem. Do not set `DATABASE_URL` in a `VITE_` variable; it must never reach the browser.

## Production notes

- No OAuth or user accounts were present; `/admin` uses a bearer token and browser sessionStorage. The token must be private and strong. For a public enterprise dashboard, replace with managed login and secure sessions before inviting untrusted users.
- `robots.txt` disallows `/admin` crawling; this is not authentication.
- SEO description / OG / favicon configured; canonical URL and sitemap depend on the **final domain** and must be added after the domain is known.
- No dynamic detail pages or external API integrations exist in the source. No imaginary routes were added.
- Email delivery is not implemented. Inquiry records are saved to PostgreSQL.
- Vercel deployment requires a live PostgreSQL service, Vercel account and connected GitHub repo; these external actions are not performed by this ZIP.
- Run `npm install`, `npm run build -w frontend`, `node --check api/index.js` after download and smoke-test `/`, `/admin`, `/api/health` and the contact form on your deployed domain. Vercel's serverless runtime must be checked live; static checks cannot guarantee error-free deployment.

## Verification limitation

- A production build and live Vercel smoke test must pass before claiming zero build/runtime errors.
- No independent dynamic detail routes were present in the uploaded source; `/` and `/admin` are the implemented pages.
- `GET /api/health` needs a live `DATABASE_URL`; PostgreSQL network connectivity cannot be validated offline.
