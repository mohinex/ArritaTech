# Arrita Digital — Full Stack

Preserves the supplied original landing-page HTML structure, original CSS and brand images. New UI is limited to a project inquiry dialog and separate `/admin` route.

## Requirements
- Node.js >=20, npm
- Native build toolchain for `better-sqlite3` (if prebuilt binaries unavailable)
- PostgreSQL + pgvector extension for online/vector mode (optional)

## Run
```bash
npm install
cp backend/.env.example backend/.env
# Edit backend/.env and set ADMIN_TOKEN to a strong random secret.
npm run dev
```
Website: http://127.0.0.1:5173
Dashboard: http://127.0.0.1:5173/admin
API health: http://127.0.0.1:3001/api/health

### Desktop dev
```bash
npm run desktop:dev
```

### Production web
```bash
npm run build
npm start
```
Website: http://127.0.0.1:3001; `/admin` for admin dashboard.
Set `HOST=0.0.0.0` only behind a reverse proxy with TLS. Set `DATABASE_URL` to use PostgreSQL rather than SQLite.

### Desktop packaged build
```bash
npm run desktop:build
```
Note: Electron installer packaging and bundling of native `better-sqlite3` must be verified per OS. Packaging is a build configuration, not a verified installer. App startup uses SQLite in the Electron user-data directory.

## Features
- Original home sections, anchors, menus, responsive behavior, animations unchanged.
- Project inquiry form sends POST `/api/inquiries` with validation and UUID deduplication.
- Web offline queue stored in localStorage, re-sent on reconnect. No guaranteed persistence in private browsing or after clearing browser storage.
- SQLite offline backend; PostgreSQL online backend via `DATABASE_URL`.
- Database automatically creates `inquiries`; PostgreSQL attempts `CREATE EXTENSION vector` and a 1536-dimensional `knowledge_vectors` table if available. No embedding model/search API is implemented.
- Admin `/admin`: bearer-token sign-in, list, status update and delete.

## Limits
- Original ZIP only contained a single landing page with illustrative projects and placeholder email. No source designs for login, settings, user-management screens, additional pages or business workflows.
- Placeholder footer email `hello@example.com` remains unchanged to preserve supplied design/content; replace only with a confirmed address.
- The dashboard is functional for inquiry management, not an invented full business management system.
- Admin token is stored in sessionStorage, suitable only for internal testing. For public internet deployment, implement server-managed admin accounts/sessions, login rate-limits, CSRF protection, audit logging, mail delivery and hardened permissions.
- Desktop online synchronization from local SQLite to hosted PostgreSQL is **not implemented**. Browser offline submissions will sync to the same configured backend when reconnecting.
- Accessibility/usability test and cross-platform packaged build have not been performed unless separately documented.
# ArritaTech
