import {readFileSync, existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const vercel=JSON.parse(readFileSync('vercel.json','utf8'));
assert.equal(vercel.outputDirectory,'frontend/dist');
assert(vercel.rewrites.some(x=>x.source==='/api/:path*'&&x.destination==='/api/index'));
assert(vercel.rewrites.some(x=>x.source==='/admin'&&x.destination==='/index.html'));
assert(existsSync('frontend/public/arrita-wordmark.png'));
assert(existsSync('frontend/public/arrita-symbol.png'));
assert(existsSync('api/index.js'));
if(existsSync('frontend/dist/index.html')) {
const html=readFileSync('frontend/dist/index.html','utf8');
assert(html.includes('assets/'),'Vite-generated assets missing');
assert(existsSync('frontend/dist/arrita-symbol.png'));
}
console.log('Deployment static checks passed');
