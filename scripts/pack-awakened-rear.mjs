// Asset preparation, NOT a gameplay/browser test. No game/dev server is opened.
// Only walk-up is replaced; all front, side, idle and combat states are retained.
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {registerHeroBodyFrames,HERO_BODY_HEIGHT,HERO_BODY_REGISTRATION_VERSION} from '../src/data/heroBodyRegistration.ts';
// Reuse production whole-subject isolation without bundling/starting Phaser.
// Its runtime dependency is the pure pixel helper; type-only imports are erased.
registerHooks({resolve(specifier,context,next){
 try{return next(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')&&!specifier.endsWith('.ts'))return next(specifier+'.ts',context);
  throw error;
 }
}});
const {actorSpriteSubjects}=await import('../src/game/systems/spriteComponents.ts');
const {heroGrip}=await import('../src/data/modularHero.ts');
const all=['varr','warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
const slugs=process.argv.length>2?process.argv.slice(2):all;
if(slugs.some(slug=>!all.includes(slug)))throw Error('Unknown outfit');
const base=readRgbaPng(await readFile('public/assets/characters/leigneron/walk_up.png'));
const basePoses=actorSpriteSubjects(base.pixels,base.width,base.height,6,1);
const baseGround=Math.max(...basePoses.map(p=>p.region[1]+p.region[3]));
const baseFit=HERO_BODY_HEIGHT/(basePoses.reduce((sum,p)=>sum+p.region[3],0)/6),density=3,pad=12;
function headX(pose){
 const [,,w,h]=pose.region;let sum=0,weight=0;
 for(let y=0;y<Math.ceil(h*.26);y++)for(let x=0;x<w;x++){
  const alpha=pose.pixels[(y*w+x)*4+3];if(alpha>128){sum+=x*alpha;weight+=alpha;}
 }
 if(!weight)throw Error('Missing rear head');return sum/weight;
}
// Mechanical atlas downsampling only. Premultiplied-alpha filtering preserves
// clean colored contours; no body/outfit pixels are painted or stitched here.
function drawPose(target,atlasWidth,pose,dx,dy,scale){
 const [,,w,h]=pose.region,outWidth=w*scale,outHeight=h*scale;
 for(let y=Math.floor(dy);y<Math.ceil(dy+outHeight);y++)for(let x=Math.floor(dx);x<Math.ceil(dx+outWidth);x++){
  const sx=(x+.5-dx)/scale-.5,sy=(y+.5-dy)/scale-.5,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
  let alpha=0;const rgb=[0,0,0];
  for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++){
   const px=x0+ox,py=y0+oy;if(px<0||py<0||px>=w||py>=h)continue;
   const index=(py*w+px)*4,weight=(ox?fx:1-fx)*(oy?fy:1-fy),a=pose.pixels[index+3]*weight;
   alpha+=a;for(let c=0;c<3;c++)rgb[c]+=pose.pixels[index+c]*a;
  }
  if(alpha>0){const at=(y*atlasWidth+x)*4;for(let c=0;c<3;c++)target[at+c]=Math.round(rgb[c]/alpha);target[at+3]=Math.round(alpha);}
 }
}
for(const slug of slugs){
 const root=`public/assets/characters/leigneron/awakened/${slug}/`,source=`docs/art/awakening-source/${slug}/walk-up-v4.png`;
 const image=readRgbaPng(await readFile(source)),poses=actorSpriteSubjects(image.pixels,image.width,image.height,3,2);
 if(poses.some(p=>p.region[0]<=1||p.region[1]<=1||p.region[0]+p.region[2]>=image.width-1||p.region[1]+p.region[3]>=image.height-1))throw Error('Source pose touches outer image edge: '+slug);
 const heights=poses.map(p=>p.region[3]);
 if(Math.max(...heights)/Math.min(...heights)>1.12)throw Error('Inconsistent rear body height: '+slug);
 const fit=HERO_BODY_HEIGHT/(heights.reduce((sum,h)=>sum+h,0)/6),scale=fit*density;
 const width=Math.ceil(Math.max(...poses.map(p=>Math.max(headX(p),p.region[2]-headX(p))))*scale*2+pad*2);
 const height=Math.ceil(Math.max(...heights)*scale+pad*2),atlasWidth=width*3,atlasHeight=height*2;
 if(atlasWidth>2048||atlasHeight>2048)throw Error('Rear atlas exceeds texture budget: '+slug);
 const pixels=Buffer.alloc(atlasWidth*atlasHeight*4),bounds=[];
 let frames=poses.map((pose,i)=>{
  const x=i%3*width,y=Math.floor(i/3)*height,reference=basePoses[i],referenceHead=reference.region[0]+headX(reference);
  const dx=width/2-headX(pose)*scale,foot=(reference.region[1]+reference.region[3]-baseGround)*baseFit;
  drawPose(pixels,atlasWidth,pose,x+dx,y+pad,scale);
  const originY=(pad+pose.region[3]*scale-foot*density)/height;
  // The fist is deliberately beneath the cape. Its original authored point
  // still carries the held weapon BEHIND cloth; never add a visible glove patch.
  const grip=heroGrip('assets/characters/leigneron/walk_up.png',i,base.width,base.height);
  return {x,y,width,height,originX:.5,originY,grip:{x:width/2+(grip.x-referenceHead)*baseFit*density,
   y:originY*height+(grip.y-baseGround)*baseFit*density,angle:grip.angle,behind:true}};
 });
 for(const frame of frames){
  let top=height,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[((frame.y+y)*atlasWidth+frame.x+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  bounds.push({top,bottom});
 }
 frames=registerHeroBodyFrames('walk-up',frames,bounds,density);
 const spec={width:atlasWidth,height:atlasHeight,frames,preparationVersion:1,bodyRegistrationVersion:HERO_BODY_REGISTRATION_VERSION,
  sourceVersion:4,rearPoseReference:'assets/characters/leigneron/walk_up.png',coveredArms:true};
 const manifest=JSON.parse(await readFile(root+'manifest-v1.json','utf8'));manifest.states['walk-up']=spec;
 await writeFile(root+'walk-up-atlas-v1.png',writeRgbaPng(atlasWidth,atlasHeight,pixels));
 await writeFile(root+'walk-up-registration-v1.json',JSON.stringify(spec));
 await writeFile(root+'manifest-v1.json',JSON.stringify(manifest));
 console.log('Prepared cape-covered rear walk:',slug,`${atlasWidth}x${atlasHeight}`);
}
