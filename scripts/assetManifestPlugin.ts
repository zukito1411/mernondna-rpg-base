import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const virtualId = 'virtual:mernondna-art-packs', resolvedId = `\0${virtualId}`;
const packIds = ['characters/leigneron','npcs/trandum_guard','npcs/shrine_priestess',
  'enemies/gray_wolf','enemies/road_bandit','enemies/boarfiend','enemies/marsh_wraith','enemies/troll','enemies/dragon'];

// Public manifests remain the single source of truth. Vite cannot treat public
// files as ordinary JS imports in dev; embed their data through a virtual module
// shared by dev, production and Vitest, rather than maintaining duplicate JSON.
export function assetManifestPlugin():Plugin {
  let publicDir = resolve('public');
  return { name:'mernondna-art-manifests',
    configResolved(config) { publicDir = config.publicDir; },
    resolveId(id) { if (id === virtualId) return resolvedId; },
    load(id) {
      if (id !== resolvedId) return;
      const manifests = Object.fromEntries(packIds.map(packId => {
        const file = resolve(publicDir,'assets',packId,'manifest.json');
        this.addWatchFile(file);
        return [packId,JSON.parse(readFileSync(file,'utf8'))];
      }));
      return `export default ${JSON.stringify(manifests)};`;
    },
  };
}
