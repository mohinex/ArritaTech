import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({base:'/',server:{host:'0.0.0.0',port:3000,allowedHosts:true},build:{outDir:'dist'},resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}});
