// Mechanical offline packing only. Keeps complete VFX and transparent gutters.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
const sources=await Promise.all(['docs/art/boss-skills-padded-v1.png','docs/art/boss-skills-companion-padded-v2.png'].map(async path=>readRgbaPng(await readFile(path))));
const cell=256,content=208,width=cell*3,pixels=Buffer.alloc(width*cell*6*4);
for(let index=0;index<18;index++){
 const source=sources[Math.floor(index/9)],i=index%9;
 const left=Math.floor(i%3*source.width/3),top=Math.floor(Math.floor(i/3)*source.height/3);
 const right=Math.floor((i%3+1)*source.width/3),bottom=Math.floor((Math.floor(i/3)+1)*source.height/3);
 let x0=right,y0=bottom,x1=-1,y1=-1;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(source.pixels[(y*source.width+x)*4+3]>2){
  x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
 }
 if(x1<0)throw Error('Missing boss effect '+i);
 if(x0<=left||y0<=top||x1>=right-1||y1>=bottom-1)throw Error('Source effect touches a cell seam: '+index);
 const w=x1-x0+1,h=y1-y0+1,rgba=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)source.pixels.subarray(((y0+y)*source.width+x0)*4,((y0+y)*source.width+x0+w)*4).copy(rgba,y*w*4);
 const scale=content/Math.max(w,h);
 drawPackedPose(pixels,width,{region:[0,0,w,h],pixels:rgba},i%3*cell+(cell-w*scale)/2,
  Math.floor(index/3)*cell+(cell-h*scale)/2,scale);
}
await mkdir('public/assets/effects',{recursive:true});
await writeFile('public/assets/effects/boss-skills-v2.png',writeRgbaPng(width,cell*6,pixels));
console.log('Packed eighteen boss effects into one 768x1536 atlas with at least 23 transparent pixels per cell edge.');
