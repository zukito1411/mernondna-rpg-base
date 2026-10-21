import {copyFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import type {Plugin} from 'vite';
import {publicAssetFiles} from './lib/public-assets.mjs';

/** Copy only the shared shipping inventory. Streaming/loading URLs otherwise
 * remain unchanged. copyFile avoids buffering the complete asset tree in Rollup. */
export function publicAssetsPlugin():Plugin {
 let publicDir='',outDir='';
 return {name:'mernondna-public-assets',apply:'build',
  config(){return {build:{copyPublicDir:false}};},
  configResolved(config){publicDir=config.publicDir;outDir=resolve(config.root,config.build.outDir);},
  writeBundle(options){
   const destination=options.dir?resolve(options.dir):outDir;
   for(const relative of publicAssetFiles(publicDir)){
    const target=resolve(destination,relative);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(publicDir,relative),target);
   }
  },
 };
}
