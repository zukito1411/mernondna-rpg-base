import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import type {Plugin} from 'vite';

export function offlineShellPlugin():Plugin {
  let publicDir='public';
  return {name:'mernondna-offline-shell',enforce:'post',configResolved(config){publicDir=config.publicDir;},generateBundle(_options,bundle){
    const files=Object.keys(bundle).filter(name=>/\.(js|css|html)$/.test(name)).sort();
    const version=createHash('sha256');
    for(const name of files){const item=bundle[name];version.update(name);version.update(item.type==='chunk'?item.code:String(item.source));}
    const publicFiles:string[]=[];
    const survey=(directory:string)=>{for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);
      if(entry.isDirectory())survey(path);else{const info=statSync(path);version.update(path.slice(publicDir.length)+':'+info.size+':'+info.mtimeMs);
        if(entry.name!=='sw.js')publicFiles.push(path.slice(publicDir.length+1).replace(/\\/g,'/'));}}};
    survey(publicDir);
    const id=version.digest('hex').slice(0,20);
    this.emitFile({type:'asset',fileName:'sw.js',source:`const BUILD_VERSION = '${id}';\n`+readFileSync(join(publicDir,'sw.js'),'utf8')});
    this.emitFile({type:'asset',fileName:'offline-shell.json',source:JSON.stringify({version:id,
      files:[...new Set(['./','index.html',...publicFiles,...files])]})});
  }};
}
