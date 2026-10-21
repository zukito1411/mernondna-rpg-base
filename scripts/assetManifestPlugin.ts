import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import {imageAlternatives} from './lib/public-assets.mjs';

const virtualId = 'virtual:mernondna-art-packs', resolvedId = `\0${virtualId}`;
const imageId='virtual:mernondna-lossless-images',resolvedImageId=`\0${imageId}`;
const packIds = ['characters/leigneron','npcs/shrine_priestess',
  'enemies/gray_wolf','enemies/road_bandit','enemies/boarfiend','enemies/marsh_wraith','enemies/troll','enemies/dragon',
  'enemies/rindass_orc_raider','enemies/rindass_orc_range'];

// Public manifests remain the single source of truth. Vite cannot treat public
// files as ordinary JS imports in dev; embed their data through a virtual module
// shared by dev, production and Vitest, rather than maintaining duplicate JSON.
export function assetManifestPlugin():Plugin {
  let publicDir = resolve('public');
  return { name:'mernondna-art-manifests',
    configResolved(config) { publicDir = config.publicDir; },
    resolveId(id) { if (id === virtualId) return resolvedId;if(id===imageId)return resolvedImageId; },
    load(id) {
      if(id===resolvedImageId){
        const map=imageAlternatives(publicDir);
        this.addWatchFile(resolve('src/data/losslessImagePaths.json'));
        this.addWatchFile(resolve('docs/asset-compression-report.json'));
        for(const [png,webp] of Object.entries(map)){this.addWatchFile(resolve(publicDir,png));this.addWatchFile(resolve(publicDir,webp));}
        return `export default ${JSON.stringify(map)};`;
      }
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
