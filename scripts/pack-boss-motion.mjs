// Offline atlas preparation only. Preserve the four-frame row registration:
// never enlarge a small gathering/fading pose to match its peak frame.
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {actorSpriteGridSubjects}=await import('../src/game/systems/spriteComponents.ts');
const cell=256,content=208,columns=8,width=cell*columns,height=cell*5;
const pixels=Buffer.alloc(width*height*4);
const boards=['melee','ground','magic'];
for(const [board,name] of boards.entries()){
 const source=readRgbaPng(await readFile(`docs/art/boss-motion-${name}-source-v1.png`));
 const poses=actorSpriteGridSubjects(source.pixels,source.width,source.height,4,3,{rejectEdgeFragments:true,keepDetachedDetails:true});
 for(let row=0;row<3;row++){
  const top=Math.floor(row*source.height/3),bottom=Math.floor((row+1)*source.height/3);
  const h=bottom-top,maxWidth=Math.ceil(source.width/4),scale=content/Math.max(maxWidth,h);
  for(let stage=0;stage<4;stage++){
   const left=Math.floor(stage*source.width/4),right=Math.floor((stage+1)*source.width/4),w=right-left;
   const pose=poses[row*4+stage];
   const frame=board*12+row*4+stage;
   // Isolate edge-cut foreign fragments, preserving own detached details.
   // Original cell coordinates, not individual pose crops, own registration.
   // At least 23 transparent pixels separate sampled content from each seam.
   drawPackedPose(pixels,width,pose,frame%columns*cell+(cell-w*scale)/2+(pose.region[0]-left)*scale,
    Math.floor(frame/columns)*cell+(cell-h*scale)/2+(pose.region[1]-top)*scale,scale);
  }
 }
}
// The separate saber board has more empty headroom. One union crop for ALL
// four stages removes that padding without independently resizing any stage.
const sea=readRgbaPng(await readFile('docs/art/boss-motion-sea-sweep-source-v1.png'));
const seaPoses=actorSpriteGridSubjects(sea.pixels,sea.width,sea.height,4,1,{rejectEdgeFragments:true,keepDetachedDetails:true});
const sw=sea.width/4;
if(!Number.isInteger(sw))throw Error('Sea sweep board must have four equal cells');
let x0=sw,y0=sea.height,x1=0,y1=0;
for(const [i,pose] of seaPoses.entries()){
 const [x,y,w,h]=pose.region,localX=x-i*sw;
 x0=Math.min(x0,localX);x1=Math.max(x1,localX+w-1);y0=Math.min(y0,y);y1=Math.max(y1,y+h-1);
}
const w=x1-x0+1,h=y1-y0+1,scale=content/Math.max(w,h);
for(let stage=0;stage<4;stage++){
 const pose=seaPoses[stage],frame=36+stage;
 drawPackedPose(pixels,width,pose,frame%columns*cell+(cell-w*scale)/2+(pose.region[0]-stage*sw-x0)*scale,
  Math.floor(frame/columns)*cell+(cell-h*scale)/2+(pose.region[1]-y0)*scale,scale);
}
await writeFile('public/assets/effects/boss-motion-v1.png',writeRgbaPng(width,height,pixels));
console.log('Prepared ten four-stage boss effects, 2048x1280, 10 MiB RGBA, shared row scale and transparent gutters.');
