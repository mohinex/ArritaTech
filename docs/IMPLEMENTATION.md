# Scope and verification

- Original file: `arrita-site/index.html` (one landing page), `arrita-symbol.png`, `arrita-wordmark.png`.
- Extracted **unchanged** original `<style>` into `frontend/src/original.css` and original `<body>` markup into `frontend/src/originalMarkup.js`.
- All new CSS is in `frontend/src/enhancements.css`, scoped to inquiry modal and admin dashboard.
- REST routes:
  - `GET /api/health`
  - `POST /api/inquiries`
  - `GET /api/admin/inquiries` (Bearer)
  - `PATCH /api/admin/inquiries/:id` (Bearer)
  - `DELETE /api/admin/inquiries/:id` (Bearer)
- SQLite tables created automatically, WAL enabled; PG table and optional pgvector table created automatically.
- UI semantics: Original example projects remain correctly marked **concept / not client work**.
- React frontend, NestJS backend, Electron shell source included.
- This environment did not complete dependency installation; no build/runtime or OS packaging success is claimed.
