import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const memoryInquiries = new Map();

function localApiPlugin() {
  return {
    name: 'arrita-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        const send = (status, data) => {
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };
        const parseBody = () =>
          new Promise((resolve) => {
            let raw = '';
            req.on('data', (chunk) => { raw += chunk; });
            req.on('end', () => {
              try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
            });
          });
        const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
        const pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/api/, '') || '/';

        if (pathname === '/health' && req.method === 'GET') {
          return send(200, { ok: true, database: process.env.DATABASE_URL ? 'postgres' : 'memory', time: new Date().toISOString() });
        }
        if (pathname === '/inquiries' && req.method === 'POST') {
          const b = await parseBody();
          const name = clean(b.name, 120), email = clean(b.email, 254), company = clean(b.company, 150), service = clean(b.service, 150), message = clean(b.message, 5000), clientId = clean(b.clientId, 100) || crypto.randomUUID();
          if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10 || !/^[a-zA-Z0-9-]{8,100}$/.test(clientId)) {
            return send(400, { message: 'Invalid inquiry data' });
          }
          const exists = Array.from(memoryInquiries.values()).some((x) => x.client_id === clientId);
          if (!exists) {
            const id = crypto.randomUUID();
            memoryInquiries.set(id, { id, client_id: clientId, name, email, company, service, message, status: 'new', created_at: new Date().toISOString() });
          }
          return send(200, { ok: true, clientId });
        }
        if (pathname.startsWith('/admin/')) {
          const secret = process.env.ADMIN_TOKEN || 'admin';
          const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
          if (!supplied || supplied !== secret) return send(403, { message: 'Unauthorized' });
          if (pathname === '/admin/inquiries' && req.method === 'GET') {
            const items = Array.from(memoryInquiries.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
            return send(200, { items });
          }
          const match = pathname.match(/^\/admin\/inquiries\/([0-9a-f-]{36})$/i);
          if (match && req.method === 'PATCH') {
            const b = await parseBody();
            if (!['new', 'in_progress', 'closed'].includes(b?.status)) return send(400, { message: 'Invalid status' });
            const item = memoryInquiries.get(match[1]);
            if (!item) return send(404, { message: 'Not found' });
            memoryInquiries.set(match[1], { ...item, status: b.status });
            return send(200, { ok: true });
          }
          if (match && req.method === 'DELETE') {
            const deleted = memoryInquiries.delete(match[1]);
            return send(deleted ? 200 : 404, deleted ? { ok: true } : { message: 'Not found' });
          }
        }
        return send(404, { message: 'API endpoint not found' });
      });
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [localApiPlugin()],
  server: { host: '0.0.0.0', port: 3000, allowedHosts: true },
  build: { outDir: 'dist' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
});
