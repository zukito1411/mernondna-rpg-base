import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import type {Plugin} from 'vite';
import {publicAssetFiles} from './lib/public-assets.mjs';

export function offlineShellPlugin():Plugin {
  let publicDir='public';
  return {name:'mernondna-offline-shell',enforce:'post',configResolved(config){publicDir=config.publicDir;},generateBundle(_options,bundle){
    const files=Object.keys(bundle).filter(name=>/\.(js|css|html)$/.test(name)).sort();
    const version=createHash('sha256');
    for(const name of files){const item=bundle[name];version.update(name);version.update(item.type==='chunk'?item.code:String(item.source));}
    const publicFiles=publicAssetFiles(publicDir);
    for(const relative of publicFiles){const info=statSync(join(publicDir,relative));version.update(relative+':'+info.size+':'+info.mtimeMs);}
    // Worker changes must invalidate its own cache too, even though the worker
    // is generated rather than copied as a public asset.
    version.update(readFileSync(join(publicDir,'sw.js')));
    const id=version.digest('hex').slice(0,20);
    this.emitFile({type:'asset',fileName:'sw.js',source:`const BUILD_VERSION = '${id}';\n`+readFileSync(join(publicDir,'sw.js'),'utf8')});
    this.emitFile({type:'asset',fileName:'offline-shell.json',source:JSON.stringify({version:id,
      files:[...new Set(['./','index.html',...publicFiles,...files])]})});
  }};
}
