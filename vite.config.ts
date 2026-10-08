import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { assetManifestPlugin } from './scripts/assetManifestPlugin';
import {offlineShellPlugin} from './scripts/offlineShellPlugin';

export default defineConfig({
  plugins: [react(),assetManifestPlugin(),offlineShellPlugin()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
