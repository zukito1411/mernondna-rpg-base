// Offline mechanical extraction of approved furniture; no new artwork or game launch.
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {actorSpriteGridSubjects}=await import('../src/game/systems/spriteComponents.ts');
const {HOME_KITS,HOME_FURNITURE}=await import('../src/data/housing.ts');
const {INTERIOR_ART,INTERIOR_FLOORS}=await import('../src/data/interiorArt.ts');
const frames={},cell=192,cols=10,rows=6;
const rack=readRgbaPng(await readFile('docs/art/housing-weapon-rack-v1.png'));
const rackPose=actorSpriteGridSubjects(rack.pixels,rack.width,rack.height,1,1)[0];
for(let group=0;group<3;group++){
 const pixels=Buffer.alloc(cols*cell*rows*cell*4);
 let index=0;
 for(const kit of HOME_KITS.slice(group*3,group*3+3)){
  const source=readRgbaPng(await readFile(`public/assets/interiors/${kit}/kit.png`));
  for(const {art} of HOME_FURNITURE){
   let pose=rackPose;
   if(art!=='weaponRack'){
    const [left,top,w,h]=INTERIOR_ART[art],rgba=Buffer.alloc(w*h*4);
    for(let y=0;y<h;y++)source.pixels.subarray(((top+y)*source.width+left)*4,((top+y)*source.width+left+w)*4).copy(rgba,y*w*4);
    pose=actorSpriteGridSubjects(rgba,w,h,1,1,{rejectEdgeFragments:true})[0];
   }
   if(!pose)throw Error('Missing furniture '+kit+'/'+art);
   const scale=(cell-12)/Math.max(pose.region[2],pose.region[3]),width=pose.region[2]*scale,height=pose.region[3]*scale;
   const x=index%cols*cell,y=Math.floor(index/cols)*cell;index++;
   drawPackedPose(pixels,cols*cell,pose,x+(cell-width)/2,y+cell-6-height,scale);
   frames[kit+':'+art]={atlas:group,x,y,width:cell,height:cell,visibleWidth:width,visibleHeight:height};
  }
  if(kit==='trandum_rustic'){
   const [x,y,w,h]=INTERIOR_FLOORS[0],floor=Buffer.alloc(w*h*4);
   for(let row=0;row<h;row++)source.pixels.subarray(((y+row)*source.width+x)*4,((y+row)*source.width+x+w)*4).copy(floor,row*w*4);
   await writeFile('public/assets/interiors/housing-floor-v1.png',writeRgbaPng(w,h,floor));
  }
 }
 await writeFile(`public/assets/interiors/housing-furniture-${group}-v1.png`,writeRgbaPng(cols*cell,rows*cell,pixels));
}
await writeFile('src/data/housingArt.json',JSON.stringify({width:cols*cell,height:rows*cell,frames}));
console.log('Prepared 171 regional furnishings plus nine catalogue entries for the shared weapon rack in three bounded atlases.');
