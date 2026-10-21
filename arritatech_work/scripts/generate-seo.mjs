import {writeFileSync, rmSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const out = resolve('frontend/dist');
const raw = process.env.SITE_URL?.trim();
if (!raw) { rmSync(resolve(out,'sitemap.xml'), {force:true}); process.exit(0); }
const url = new URL(raw);
if (url.protocol !== 'https:' && url.protocol !== 'http:') throw Error('SITE_URL must be an http(s) URL');
const base = url.origin;
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>\n`;
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'sitemap.xml'), xml);
