import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { assetManifestPlugin } from './scripts/assetManifestPlugin';

export default defineConfig({
  plugins: [react(),assetManifestPlugin()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
