// Offline asset preparation only: no game, browser, tests or build launched.
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {spriteHeadCenter,spriteHeadWidth,drawPackedPose} from './lib/hero-sprite-packing.mjs';
import {registerHeroBodyFrames,HERO_BODY_REGISTRATION_VERSION} from '../src/data/heroBodyRegistration.ts';
registerHooks({resolve(specifier,context,next){
 try{return next(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')&&!specifier.endsWith('.ts'))return next(specifier+'.ts',context);
  throw error;
 }
}});
const {actorSpriteSubjects}=await import('../src/game/systems/spriteComponents.ts');
const mean=values=>values.reduce((sum,n)=>sum+n,0)/values.length;
const all=['varr','warden','stonejaw','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
const writes=[];
const baseLayout=JSON.parse(await readFile('docs/art/leigneron-run-side-v3.layout.json','utf8'));
const baseImage=readRgbaPng(await readFile('docs/art/leigneron-run-side-v3.png'));
const basePoses=actorSpriteSubjects(baseImage.pixels,baseImage.width,baseImage.height,3,2);
const walkImage=readRgbaPng(await readFile('public/assets/characters/leigneron/modular/walk-side-body-v1.png'));
const walkPoses=actorSpriteSubjects(walkImage.pixels,walkImage.width,walkImage.height,6,1);
const headWidth=mean(walkPoses.map(spriteHeadWidth)),fit=headWidth/mean(basePoses.map(spriteHeadWidth));
// Source-space fists follow the actual new complete poses, not old hand ratios.
const fists=baseLayout.grips;
if(baseImage.width!==1536||baseImage.height!==1024)throw Error('Update authored fist points for changed base illustration');
function postureGuard(label,poses,referenceHeight,referenceHead,sourceScale=1){
 const heights=poses.map(p=>p.region[3]*sourceScale),head=mean(poses.map(spriteHeadWidth))*sourceScale;
 const ratio=mean(heights)/head/(referenceHeight/referenceHead);
 // A supported upright run stays close to walking stature AT EQUAL HEAD SIZE.
 // Never compensate a failed drawing by inflating its head or stretching legs.
 if(ratio<.95||ratio>1.04)throw Error(`Run posture needs artwork correction: ${label} (${(ratio*100).toFixed(1)}% of walking stature at equal head size)`);
}
postureGuard('base',basePoses,mean(walkPoses.map(p=>p.region[3])),headWidth);
function sourceGuard(label,image,poses,grips){
 if(poses.length!==6||!Array.isArray(grips)||grips.length!==6||grips.some(g=>!Array.isArray(g)||g.length!==2||!g.every(Number.isFinite)))throw Error('Incomplete six-pose hand registration: '+label);
 if(poses.some(p=>p.region[0]<=1||p.region[1]<=1||p.region[0]+p.region[2]>=image.width-1||p.region[1]+p.region[3]>=image.height-1))throw Error('Run pose touches source edge: '+label);
 const heads=poses.map(spriteHeadWidth),heights=poses.map(p=>p.region[3]);
 if(Math.max(...heads)/Math.min(...heads)>1.08||Math.max(...heights)/Math.min(...heights)>1.08)throw Error('Run anatomy varies across its six complete poses: '+label);
 for(let i=0;i<6;i++){const p=poses[i],[x,y]=grips[i];if(x<p.region[0]||y<p.region[1]||x>=p.region[0]+p.region[2]||y>=p.region[1]+p.region[3])throw Error('Authored fist lies outside its pose: '+label+'/'+i);}
}
sourceGuard('base',baseImage,basePoses,fists);
const pad=12,sourceHeight=724,ground=559,headLead=10;
const left=Math.max(...basePoses.map(p=>spriteHeadCenter(p)*fit)),right=Math.max(...basePoses.map(p=>(p.region[2]-spriteHeadCenter(p))*fit));
const cellWidth=Math.max(384,Math.ceil(left+right+pad*2));
const sourceHead=(cellWidth+left-right)/2,sourceWidth=cellWidth*6,pixels=Buffer.alloc(sourceWidth*sourceHeight*4);
const groundAnchors=[],grips=[];
// Passing/push-off feet can lift slightly; contact poses remain grounded.
const footOffsets=[0,0,0,0,-4,0];
basePoses.forEach((p,i)=>{
 const dx=i*cellWidth+sourceHead-spriteHeadCenter(p)*fit,dy=ground+footOffsets[i]-p.region[3]*fit;
 if(dy<pad||dx<i*cellWidth+pad||dx+p.region[2]*fit>(i+1)*cellWidth-pad)throw Error('Base run source lacks transparent gutters');
 drawPackedPose(pixels,sourceWidth,p,dx,dy,fit);
 groundAnchors.push([i*cellWidth+sourceHead-headLead,ground]);
 grips.push([dx+(fists[i][0]-p.region[0])*fit,dy+(fists[i][1]-p.region[1])*fit]);
});
writes.push(['public/assets/characters/leigneron/modular/run-side-body-v3.png',writeRgbaPng(sourceWidth,sourceHeight,pixels)]);
writes.push(['src/data/heroRunRegistration.json',JSON.stringify({grips,groundAnchors,angle:130})]);
const manifestPath='public/assets/characters/leigneron/manifest.json',manifest=JSON.parse(await readFile(manifestPath,'utf8'));
Object.assign(manifest.animations.run_side,{frameWidth:cellWidth,frameHeight:sourceHeight,groundAnchors});
writes.push([manifestPath,JSON.stringify(manifest,null,2)+'\n']);
console.log('Prepared upright base sprint; shared side-walk source scale.');
const walkingScale=manifest.animations.walk_right.renderScale;
const requested=process.argv.slice(2),slugs=requested.includes('--base-only')?[]:requested.length?requested:all;
if(slugs.some(slug=>!all.includes(slug)))throw Error('Unknown outfit');
for(const slug of slugs){
 const root=`public/assets/characters/leigneron/awakened/${slug}/`,image=readRgbaPng(await readFile(`docs/art/awakening-source/${slug}/run-side-v3.png`));
 const layout=JSON.parse(await readFile(`docs/art/awakening-source/${slug}/run-side-v3.layout.json`,'utf8'));
 const poses=actorSpriteSubjects(image.pixels,image.width,image.height,3,2);
 if(image.width!==1536||image.height!==1024)throw Error('Update authored outfit fist coordinates for new illustration dimensions: '+slug);
 sourceGuard(slug,image,poses,layout.grips);
 const manifest=JSON.parse(await readFile(root+'manifest-v1.json','utf8')),walk=readRgbaPng(await readFile(root+'walk-side-atlas-v1.png'));
 const walkingHead=mean(manifest.states['walk-side'].frames.map(frame=>{
  const rgba=Buffer.alloc(frame.width*frame.height*4);
  for(let y=0;y<frame.height;y++)walk.pixels.subarray(((frame.y+y)*walk.width+frame.x)*4,((frame.y+y)*walk.width+frame.x+frame.width)*4).copy(rgba,y*frame.width*4);
  const pose=actorSpriteSubjects(rgba,frame.width,frame.height,1,1)[0];
  return spriteHeadWidth(pose)/3*(frame.bodyScale??1);
 }));
 const density=3,scale=walkingHead/mean(poses.map(spriteHeadWidth))*density;
 // The approved side walk has an upright 76-unit body registration.
 postureGuard(slug,poses,76,walkingHead,scale/density);
 const left=Math.max(...poses.map(p=>spriteHeadCenter(p)*scale)),right=Math.max(...poses.map(p=>(p.region[2]-spriteHeadCenter(p))*scale));
 const lead=headLead*walkingScale*density;
 const width=Math.ceil(Math.max(left-lead,right+lead)*2+pad*2),height=Math.ceil(Math.max(...poses.map(p=>p.region[3]*scale))+pad*2);
 const atlasWidth=width*3,atlasHeight=height*2,data=Buffer.alloc(atlasWidth*atlasHeight*4),bounds=[];
 if(atlasWidth>2048||atlasHeight>2048)throw Error('Sprint exceeds mobile atlas budget');
 let frames=poses.map((p,i)=>{
  const x=i%3*width,y=Math.floor(i/3)*height;
  const dx=width/2+lead-spriteHeadCenter(p)*scale;
  // Width includes head lead as well as the cloak's changing silhouette.
  if(dx<3||dx+p.region[2]*scale>width-3)throw Error('Sprint needs wider clear gutters: '+slug);
  drawPackedPose(data,atlasWidth,p,x+dx,y+pad,scale);
  const foot=footOffsets[i]*walkingScale,originY=(pad+p.region[3]*scale-foot*density)/height;
  return {x,y,width,height,originX:.5,originY,grip:{x:dx+(layout.grips[i][0]-p.region[0])*scale,
   y:pad+(layout.grips[i][1]-p.region[1])*scale,angle:130,behind:false}};
 });
 for(const f of frames){
  let top=height,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[((f.y+y)*atlasWidth+f.x+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  bounds.push({top,bottom});
 }
 frames=registerHeroBodyFrames('run-side',frames,bounds,3);
 const spec={width:atlasWidth,height:atlasHeight,frames,preparationVersion:2,bodyRegistrationVersion:HERO_BODY_REGISTRATION_VERSION,
  runAnatomyVersion:3,sourceVersion:3,locomotionScale:'side-walk-head',posture:'upright-supported-stride'};
 manifest.states['run-side']=spec;
 writes.push([root+'run-side-atlas-v1.png',writeRgbaPng(atlasWidth,atlasHeight,data)]);
 writes.push([root+'run-side-registration-v1.json',JSON.stringify(spec)]);
 writes.push([root+'manifest-v1.json',JSON.stringify(manifest)]);
 console.log('Prepared upright costume sprint:',slug,`${atlasWidth}x${atlasHeight}`);
}
// Publish only after every requested outfit has complete, correctly sized poses.
for(const [path,data] of writes)await writeFile(path,data);
