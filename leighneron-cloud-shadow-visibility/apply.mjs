import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// LEIGHNERON_CLOUD_SHADOW_VISIBILITY_V2
// Narrow compatibility update for the previously installed optimized clouds.
// Never builds, tests, commits, pushes, or modifies saves.
const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'..');
const changes=new Map();
const errors=[];

function patch(relative,replacements){
  const absolute=path.join(root,relative);
  try{
    if(!fs.existsSync(absolute))throw Error('File not found');
    const original=fs.readFileSync(absolute,'utf8');
    const bom=original.startsWith('\uFEFF')?'\uFEFF':'';
    const eol=original.includes('\r\n')?'\r\n':'\n';
    let src=original.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
    if(!src.includes('LEIGHNERON_CLOUD_SHADOW_OPTIMIZATION_V1')){
      throw Error('Optimized cloud shadow V1 not found. Install leighneron-cloud-shadows first.');
    }
    if(src.includes('LEIGHNERON_CLOUD_SHADOW_VISIBILITY_V2')){
      throw Error('Visibility V2 is already installed');
    }
    for(const [label,before,after] of replacements){
      const count=src.split(before).length-1;
      if(count!==1)throw Error(label+': expected exactly one source match, found '+count);
      src=src.replace(before,after);
    }
    changes.set(relative,{absolute,original,modified:bom+src.replace(/\n/g,eol)});
  }catch(e){errors.push(relative+': '+(e instanceof Error?e.message:String(e)));}
}

patch('src/game/systems/GroundShadowSystem.ts',[
 ['correct cloud draw order',
  "this.cloudLayer=makeLayer('passing-cloud-shadows','world-cloud-shadows',-985,this.cloudResolution);",
  "this.cloudLayer=makeLayer('passing-cloud-shadows','world-cloud-shadows',-945,this.cloudResolution);"],
 ['make cloud silhouettes visible under morning sun and weather',
  '  const cover=Math.min(1,Math.max(0,cloudCover)),strength=daylight*(.21+cover*.34);',
  `  // LEIGHNERON_CLOUD_SHADOW_VISIBILITY_V2
  // Template pixels already have alpha: do not multiply them by another tiny
  // early-morning factor. A softer daylight curve keeps clear cloud shapes
  // visible between sunrise and sunset without creating nighttime shadows.
  const cover=Math.min(1,Math.max(0,cloudCover));
  const strength=Math.min(.68,Math.pow(Math.max(0,daylight),.55)*(.44+cover*.22));`],
 ['denser world-space cloud coverage, first row',
  '  const firstX=Math.floor((left-driftX-1100)/1050),lastX=Math.ceil((right-driftX+1100)/1050);',
  '  const stepX=760,stepY=540;\n  const firstX=Math.floor((left-driftX-1100)/stepX),lastX=Math.ceil((right-driftX+1100)/stepX);'],
 ['denser world-space cloud coverage, second row',
  '  const firstY=Math.floor((top-driftY-1000)/760),lastY=Math.ceil((bottom-driftY+1000)/760);',
  '  const firstY=Math.floor((top-driftY-900)/stepY),lastY=Math.ceil((bottom-driftY+900)/stepY);'],
 ['position clouds in a stable world grid',
  '   const seed=random(gx,gy,1),x=(gx+.3+random(gx,gy,2)*.5)*1050+driftX;',
  '   const seed=random(gx,gy,1),x=(gx+.25+random(gx,gy,2)*.5)*stepX+driftX;'],
 ['position cloud rows in a stable world grid',
  '   const y=(gy+.3+random(gx,gy,3)*.5)*760+driftY;',
  '   const y=(gy+.25+random(gx,gy,3)*.5)*stepY+driftY;'],
 ['soft larger shadows between cloud cells',
  '   const stamp=this.clouds[Math.floor(random(gx,gy,4)*this.clouds.length)],w=(1000+seed*650)*zoom,h=(560+random(gx,gy,5)*420)*zoom;',
  '   const stamp=this.clouds[Math.floor(random(gx,gy,4)*this.clouds.length)],w=(980+seed*420)*zoom,h=(680+random(gx,gy,5)*280)*zoom;'],
]);

patch('src/game/systems/CloudShadowArt.ts',[
 ['more opaque but still soft shadows',
  '   const alpha=edge*soft*(.12+density*.6)*(broken?.72:1),i=(y*192+x)*4;',
  `   // LEIGHNERON_CLOUD_SHADOW_VISIBILITY_V2
   // Preserve feathered boundaries while allowing an actual shaded core.
   const alpha=Math.min(1,edge*soft*(.24+density*.92)*(broken?.82:1)),i=(y*192+x)*4;`],
 ['natural green-neutral shadow tint',
  '   pixels.data[i]=27;pixels.data[i+1]=36;pixels.data[i+2]=42;pixels.data[i+3]=Math.round(alpha*255);',
  '   pixels.data[i]=19;pixels.data[i+1]=26;pixels.data[i+2]=23;pixels.data[i+3]=Math.round(alpha*255);'],
]);

if(errors.length){
  const report='Cloud shadow visibility V2 preflight failed. No gameplay files were changed.\n\n'+errors.join('\n')+'\n';
  const output=path.join(root,'leighneron-cloud-shadow-visibility-preflight.txt');
  try{fs.writeFileSync(output,report,'utf8');}catch{}
  console.error(report);console.error('Details: '+output);process.exitCode=1;
}else{
  const backup=path.join(root,'.leighneron-cloud-shadow-visibility-backup',String(Date.now()));
  const written=[];
  try{
    for(const [relative,{original}] of changes){
      const b=path.join(backup,relative);
      fs.mkdirSync(path.dirname(b),{recursive:true});fs.writeFileSync(b,original,'utf8');
    }
    for(const [relative,{absolute,modified}] of changes){
      const temp=absolute+'.cloud-visibility.tmp';
      fs.writeFileSync(temp,modified,'utf8');fs.renameSync(temp,absolute);written.push(relative);
    }
    console.log('Cloud shadow visibility update installed. Modified: '+written.join(', '));
    console.log('Backups: '+backup);
    console.log('Restart Vite and view moving cloud shadows in daylight. No tests, builds, commits or pushes run.');
  }catch(e){
    for(const relative of written){const record=changes.get(relative);fs.writeFileSync(record.absolute,record.original,'utf8');}
    console.error('Installation stopped; written files restored. '+String(e));process.exitCode=1;
  }
}
