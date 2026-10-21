import {readFileSync, existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const vercel=JSON.parse(readFileSync('vercel.json','utf8'));
assert.equal(vercel.outputDirectory,'frontend/dist');
assert(vercel.rewrites.some(x=>x.source==='/api/:path*'&&x.destination==='/api/index?route=:path*'));
assert(vercel.rewrites.some(x=>x.source==='/admin'&&x.destination==='/index.html'));
assert(existsSync('frontend/public/arrita-wordmark.png'));
assert(existsSync('frontend/public/arrita-symbol.png'));
assert(existsSync('api/index.js'));
assert(existsSync('.github/workflows/verify.yml'));
assert(existsSync('frontend/public/robots.txt'));
assert(existsSync('frontend/index.html'));
assert(readFileSync('api/index.js','utf8').includes('req.query?.route'),'API rewrite path forwarding missing');
if(existsSync('frontend/dist/index.html')) {
const html=readFileSync('frontend/dist/index.html','utf8');
assert(html.includes('assets/'),'Vite-generated assets missing');
assert(existsSync('frontend/dist/arrita-symbol.png'));
}
console.log('Deployment static checks passed');
