import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react()],
  build: { outDir: '../public', emptyOutDir: false, assetsDir: 'assets' },
  server: { proxy: { '/api': process.env.API_PROXY || 'http://127.0.0.1:8000' } },
});
