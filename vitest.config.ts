import { defineConfig } from 'vitest/config';
import { assetManifestPlugin } from './scripts/assetManifestPlugin';
export default defineConfig({ plugins:[assetManifestPlugin()],test: { include: ['tests/*.test.ts'] } });
