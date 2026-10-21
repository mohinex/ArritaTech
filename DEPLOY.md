# Vercel Services deployment

- Deploy repository root as ONE Vercel project. Leave the Vercel Project Root Directory at `./`.
- `backend` is the Node.js API handler from `api/index.js`, NOT the separate NestJS development server in `backend/src/main.ts`. The NestJS app starts a listening server and has not been adapted to Vercel Services. Do not treat the duplicate `arrita_vercel_ready` or `arritatech_work` folders as independent production apps.
- `frontend` is Vite in `frontend/`. Public `/*` routes to frontend. Public `/api/*` routes to backend, and the original `/api` prefix is preserved by Vercel.
- No service bindings: frontend `fetch('/api/...')` runs in the browser against the public domain. No server-side service-to-service calls exist in the active deployment components. Never inject backend URLs into Vite client code.
- Runtime environment variables in Vercel Project Settings: `DATABASE_URL`, `ADMIN_TOKEN`, optional `PG_SSL`. Build-time `SITE_URL` for sitemap/canonical.
- Vercel Services is in beta. Run `vercel dev -L` and `vercel deploy` once your account supports Services.
- Use `npm run check:deploy` to validate static config. Production build, database and cloud deployment require separate verification.
- **Confirm before production:** service names `backend`, `frontend`; public paths `/api/*`, `/*`; no internal-only deployed service and no bindings; unused standalone NestJS backend stays out of Vercel Services.
