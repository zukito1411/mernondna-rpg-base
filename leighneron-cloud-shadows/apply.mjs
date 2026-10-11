import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// LEIGHNERON_CLOUD_SHADOW_OPTIMIZATION_V1: two-file, all-or-nothing source patch.
// No tests, builds, commits or pushes are performed by this installer.
const patchDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(patchDir,'..');
const changes=new Map();
const problems=[];
function edit(relative,transform){
  const absolute=path.join(root,relative);
  try{
    if(!fs.existsSync(absolute))throw Error('Source file not found');
    const original=fs.readFileSync(absolute,'utf8');
    const bom=original.startsWith('\uFEFF')?'\uFEFF':'';
    const eol=original.includes('\r\n')?'\r\n':'\n';
    let content=original.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
    if(content.includes('LEIGHNERON_CLOUD_SHADOW_OPTIMIZATION_V1'))throw Error('Patch already applied; nothing was changed');
    function replaceOnce(before,after,description){
      const occurrences=content.split(before).length-1;
      if(occurrences!==1)throw Error(`${description}: expected one match, found ${occurrences}`);
      content=content.replace(before,after);
    }
    transform(replaceOnce);
    changes.set(relative,{absolute,original,modified:bom+content.replace(/\n/g,eol)});
  }catch(error){problems.push(`${relative}: ${error instanceof Error?error.message:String(error)}`);}
}

edit('src/game/systems/GroundShadowSystem.ts',(rep)=>{
  rep("import {cloudShadowStamps} from './CloudShadowArt';", 
      "import {cloudShadowStamps} from './CloudShadowArt';\nimport {getEffectsQuality,EFFECTS_QUALITY_EVENT} from './effectsQuality';",'effects quality import');
  rep(' private readonly clouds=cloudShadowStamps();',
      " private readonly clouds=cloudShadowStamps(getEffectsQuality()==='low'?3:5);",'cloud stamp count');
  rep(" private cloudLightKey='';",
` // LEIGHNERON_CLOUD_SHADOW_OPTIMIZATION_V1
 // Keep clouds anchored to world coordinates, but translate their cached canvas
 // as wind blows. Canvas texture uploads happen only on occasional recaptures.
 private lightweight=getEffectsQuality()==='low';
 private cloudResolution=this.lightweight?.42:.66;
 private readonly onQualityChange=()=>{
  const next=getEffectsQuality()==='low';
  if(next===this.lightweight)return;
  this.lightweight=next;this.cloudResolution=next?.42:.66;
  this.cloudLightKey='';this.cloudDrawMs=10000;
 };
 private cloudPaintElapsed=0;
 private cloudLightKey='';`,'quality and cloud offset state');
  rep(' private drawMs=100;private staticScanMs=250;private cloudDrawMs=125;private cloudElapsed=0;private staticDirty=true;',
      ' private drawMs=100;private staticScanMs=250;private cloudDrawMs=2000;private cloudElapsed=0;private staticDirty=true;', 'initial update cadence');
  rep(`  const makeLayer=(key:string,name:string,depth:number):Layer=>{
   const texture=scene.textures.createCanvas(key,viewport.width+OVERSCAN*2,viewport.height+OVERSCAN*2)!;
   return {texture,image:scene.add.image(0,0,key).setOrigin(0).setDepth(depth).setName(name)};
  };`,
`  const makeLayer=(key:string,name:string,depth:number,resolution=1):Layer=>{
   const texture=scene.textures.createCanvas(key,
    Math.max(1,Math.round((viewport.width+OVERSCAN*2)*resolution)),
    Math.max(1,Math.round((viewport.height+OVERSCAN*2)*resolution)))!;
   // Cloud shadows are soft; LINEAR filtering avoids blocky edges at low DPI.
   texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
   return {texture,image:scene.add.image(0,0,key).setOrigin(0).setDepth(depth).setName(name)};
  };`, 'cloud texture sizing');
  rep("  this.cloudLayer=makeLayer('passing-cloud-shadows','world-cloud-shadows',-985);",
      "  this.cloudLayer=makeLayer('passing-cloud-shadows','world-cloud-shadows',-985,this.cloudResolution);\n  window.addEventListener(EFFECTS_QUALITY_EVENT,this.onQualityChange);",'quality listener');
  rep(`  const shifted=this.base.zoom!==zoom||this.staticLayer.texture.width!==width||this.staticLayer.texture.height!==height
   ||Math.abs((view.x-this.base.x)*zoom-OVERSCAN)>OVERSCAN/2
   ||Math.abs((view.y-this.base.y)*zoom-OVERSCAN)>OVERSCAN/2;`,
`  const shifted=this.base.zoom!==zoom||this.staticLayer.texture.width!==width||this.staticLayer.texture.height!==height
   ||this.cloudLayer.texture.width!==Math.max(1,Math.round(width*this.cloudResolution))
   ||this.cloudLayer.texture.height!==Math.max(1,Math.round(height*this.cloudResolution))
   ||Math.abs((view.x-this.base.x)*zoom-OVERSCAN)>OVERSCAN/2
   ||Math.abs((view.y-this.base.y)*zoom-OVERSCAN)>OVERSCAN/2;`, 'cloud quality / viewport resize check');
  rep(`   for(const layer of [this.cloudLayer,this.staticLayer,this.actorLayer]){
    if(layer.texture.width!==width||layer.texture.height!==height)layer.texture.setSize(width,height);
    layer.image.setPosition(this.base.x,this.base.y).setDisplaySize(width/zoom,height/zoom);
   }`,
`   for(const layer of [this.cloudLayer,this.staticLayer,this.actorLayer]){
    const resolution=layer===this.cloudLayer?this.cloudResolution:1;
    const tw=Math.max(1,Math.round(width*resolution)),th=Math.max(1,Math.round(height*resolution));
    if(layer.texture.width!==tw||layer.texture.height!==th)layer.texture.setSize(tw,th);
    layer.image.setPosition(this.base.x,this.base.y).setDisplaySize(width/zoom,height/zoom);
   }`, 'viewport update');
  rep(`  if(shifted||cloudKey!==this.cloudLightKey||daylight>.02&&!this.reducedMotion.matches&&this.cloudDrawMs>=125){
   this.cloudDrawMs=0;this.cloudLightKey=cloudKey;this.paintClouds(daylight,cloud);
  }`,
`  // Cloud movement is a cheap image transform on every frame; only repaint
  // when lighting/viewport changes, the buffer nears its overscan edge, or
  // the weather needs an occasional refreshed cloud pattern.
  const driftPx=Math.abs(this.cloudElapsed-this.cloudPaintElapsed)*zoom;
  const cloudInterval=this.lightweight?1400:850;
  if(shifted||cloudKey!==this.cloudLightKey||driftPx>OVERSCAN*.4
    ||daylight>.02&&!this.reducedMotion.matches&&this.cloudDrawMs>=cloudInterval){
   this.cloudDrawMs=0;this.cloudLightKey=cloudKey;
   this.cloudPaintElapsed=this.cloudElapsed;
   this.paintClouds(daylight,cloud);
  }
  const cloudShift=this.cloudElapsed-this.cloudPaintElapsed;
  this.cloudLayer.image.setPosition(this.base.x+cloudShift,this.base.y-cloudShift*.24);`, 'cloud motion and upload schedule');
  rep('  const layer=this.cloudLayer,ctx=layer.texture.getContext(),zoom=this.base.zoom;',
      '  const layer=this.cloudLayer,ctx=layer.texture.getContext(),zoom=this.base.zoom*this.cloudResolution;', 'cloud-only resolution');
  rep('  const cover=Math.min(1,Math.max(0,cloudCover)),strength=daylight*(.16+cover*.25);',
      '  const cover=Math.min(1,Math.max(0,cloudCover)),strength=daylight*(.21+cover*.34);', 'subtle but visible daylight contrast');
  rep(` destroy(){
  this.casters.clear();`,
` destroy(){
  window.removeEventListener(EFFECTS_QUALITY_EVENT,this.onQualityChange);
  this.casters.clear();`, 'cleanup quality listener');
});

edit('src/game/systems/CloudShadowArt.ts',(rep)=>{
  rep('export function cloudShadowStamps(){\n return Array.from({length:8},(_,shape)=>{',
`// LEIGHNERON_CLOUD_SHADOW_OPTIMIZATION_V1
const stampsByCount=new Map<number,HTMLCanvasElement[]>();
/** Reuse soft cloud templates and make them smaller than the camera buffer. */
export function cloudShadowStamps(requestedCount=8){
 const count=Math.max(2,Math.min(8,Math.round(requestedCount)));
 const cached=stampsByCount.get(count);if(cached)return cached;
 const stamps=Array.from({length:count},(_,shape)=>{`, 'cached smaller collection');
  rep('  canvas.width=256;canvas.height=160;const ctx=canvas.getContext(\'2d\')!,pixels=ctx.createImageData(256,160);',
      "  canvas.width=192;canvas.height=120;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(192,120);", 'template canvas sizes');
  rep('  for(let y=0;y<160;y++)for(let x=0;x<256;x++){\n   const nx=(x-128)/128,ny=(y-80)/80;let density=0;',
      '  for(let y=0;y<120;y++)for(let x=0;x<192;x++){\n   const nx=(x-96)/96,ny=(y-60)/60;let density=0;', 'template density sample scale');
  rep('   const alpha=edge*soft*(.12+density*.6)*(broken?.72:1),i=(y*256+x)*4;',
      '   const alpha=edge*soft*(.12+density*.6)*(broken?.72:1),i=(y*192+x)*4;', 'template image stride');
  rep('  const blurred=document.createElement(\'canvas\');blurred.width=256;blurred.height=160;',
      "  const blurred=document.createElement('canvas');blurred.width=192;blurred.height=120;", 'blur canvas size');
  rep('  return blurred;\n });\n}',
      '  return blurred;\n });\n stampsByCount.set(count,stamps);\n return stamps;\n}', 'template cache completion');
});

if(problems.length){
 const report='Cloud shadow patch preflight failed. No files were changed.\n\n'+problems.join('\n')+'\n';
 const out=path.join(root,'leighneron-cloud-shadows-preflight.txt');
 try{fs.writeFileSync(out,report);}catch{}
 console.error(report);process.exitCode=1;
}else{
 const stamp=Date.now().toString();
 const backup=path.join(root,'.leighneron-cloud-shadows-backup',stamp);
 fs.mkdirSync(backup,{recursive:true});
 for(const [relative,{original}] of changes){const target=path.join(backup,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,original);}
 const written=[];
 try{
  for(const [relative,{absolute,modified}] of changes){
   const temp=absolute+'.cloud-shadow-patch.tmp';
   fs.writeFileSync(temp,modified);fs.renameSync(temp,absolute);written.push(relative);
  }
  console.log('Moving cloud-shadow update installed. Modified: '+written.join(', '));
  console.log('Backups: '+backup);
  console.log('No game tests, builds, commits or pushes were run.');
 }catch(error){
  for(const relative of written){const original=changes.get(relative);fs.writeFileSync(original.absolute,original.original);}
  console.error('Installation interrupted; restored original game files. '+String(error));
  process.exitCode=1;
 }
}
