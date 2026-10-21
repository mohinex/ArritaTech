import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({base:'/',server:{port:5173,proxy:{'/api':'http://127.0.0.1:3001'}},build:{outDir:'dist'},resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}});
