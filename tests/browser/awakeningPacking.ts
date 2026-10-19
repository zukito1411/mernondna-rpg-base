import Phaser from 'phaser';
import {ART_BY_KEY,actorArtLayout,type ArtTextureKey} from '../../src/data/art';
import {AWAKENED_HERO_STATES,AWAKENED_HERO_DENSITY,type AwakenedPoseFrame} from '../../src/data/awakenedHero';
import {AWAKENING_BY_WEAPON} from '../../src/data/awakening';
import {actorSpriteSubjects} from '../../src/game/systems/spriteComponents';
import {spriteSubjectCanvas} from '../../src/game/systems/spriteArt';
import {heroFrameData} from '../../src/game/systems/heroFrameData';
import {registerHeroBodyFrames,HERO_BODY_REGISTRATION_VERSION,type HeroAlphaBounds} from '../../src/data/heroBodyRegistration';
import {skillBodyGuard} from '../../src/game/systems/WeaponSkillPalette';
import type {ActorSpriteSubject} from '../../src/game/systems/spriteComponents';

/** Offline art preparation only. Source illustrations remain full-resolution,
 * one animation per file. Production downloads compact, pre-registered states. */
export async function packAwakeningState(scene:Phaser.Scene,weaponId:string,state:string,sourceUrl?:string,sourceGrid?:{columns:number;rows:number}){
 const profile=AWAKENING_BY_WEAPON[weaponId],mapping=AWAKENED_HERO_STATES.find(s=>s.state===state)!;
 if(!profile||!mapping)throw new Error('Unknown awakening art state');
 const source=new Image();source.src=sourceUrl??`/assets/characters/leigneron/awakened/${profile.slug}/${state}-v1.png`;await source.decode();
 const read=document.createElement('canvas');read.width=source.width;read.height=source.height;
 const context=read.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const pixels=context.getImageData(0,0,source.width,source.height).data;
 if(pixels[3]>16||pixels[(source.width-1)*4+3]>16)throw new Error('Opaque cosmetic background: '+profile.slug+'/'+state);
 const key=mapping.key as ArtTextureKey,sheet=ART_BY_KEY[key],template=scene.textures.get(key);
 if(sourceGrid&&(!Number.isInteger(sourceGrid.columns)||!Number.isInteger(sourceGrid.rows)||sourceGrid.columns<1||sourceGrid.rows<1||sourceGrid.columns*sourceGrid.rows!==mapping.frames))
  throw new Error('Source grid does not match the complete animation');
 // These clips now have complete masters, explicit pivots and authored fists.
 // Never reintroduce base-outfit clipping masks through this legacy tool.
 if(skillBodyGuard(key,0))throw new Error('Prepare complete skill poses with scripts/pack-cosmetic-skills.mjs');
 const subjects:ActorSpriteSubject[]=actorSpriteSubjects(pixels,source.width,source.height,sourceGrid?.columns??6,sourceGrid?.rows??(state==='attack'?4:1));
 if(subjects.length!==mapping.frames)throw new Error('Wrong cosmetic frame count');
 if(subjects.some(({region:[x,y,w,h]})=>x<=1||y<=1||x+w>=source.width-1||y+h>=source.height-1))
  throw new Error(`Complete cosmetic pose touches its source image edge: ${profile.slug}/${state}`);
 const heights=subjects.map(s=>s.region[3]),heightRatio=Math.max(...heights)/Math.min(...heights);
 if((state.startsWith('walk-')||state.startsWith('idle-'))&&heightRatio>1.12)
  throw new Error(`Inconsistent locomotion body scale: ${profile.slug}/${state} (${heightRatio.toFixed(3)})`);
 const first=heroFrameData(template.get(mapping.offset)).visibleBounds!;
 const fit=first.height/subjects[0].region[3],density=AWAKENED_HERO_DENSITY,pad=12;
 const headCenter=(rgba:Uint8ClampedArray,w:number,top:number,bottom:number)=>{
  let sum=0,weight=0;
  for(let y=top;y<bottom;y++)for(let x=0;x<w;x++){
   const a=rgba[(y*w+x)*4+3];if(a>128){sum+=x*a;weight+=a;}
  }
  if(!weight)throw new Error('Missing complete rear head silhouette');
  return sum/weight;
 };
 const poses=subjects.map((subject,i)=>{
  const frame=template.get(mapping.offset+i),meta=heroFrameData(frame),b=meta.visibleBounds!;
  const originY=key.startsWith('skill_') ? .5 : actorArtLayout(key).originY;
  let center=b.left+b.width/2-frame.width/sheet.density/2;
  const bottom=b.top+b.height-frame.height/sheet.density*originY;
  const width=subject.region[2]*fit,height=subject.region[3]*fit;
  let left=center-width/2;
  if(state==='walk-up'&&sourceGrid){
   // Register the stable head, not the changing cape silhouette. Otherwise
   // a swaying asymmetric cloak drags the whole torso sideways every step.
   const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   ctx.drawImage(frame.source.image as CanvasImageSource,frame.cutX,frame.cutY,frame.width,frame.height,0,0,frame.width,frame.height);
   const rgba=ctx.getImageData(0,0,frame.width,frame.height).data;
   center=(headCenter(rgba,frame.width,Math.max(0,Math.floor(b.top*sheet.density)),Math.min(frame.height,Math.ceil((b.top+b.height*.26)*sheet.density)))-frame.width/2)/sheet.density;
   left=center-headCenter(subject.pixels,subject.region[2],0,Math.max(1,Math.floor(subject.region[3]*.26)))*fit;
  }
  return {subject,meta,frame,b,width,height,left,top:bottom-height};
 });
 const width=Math.ceil(Math.max(...poses.map(p=>Math.max(Math.abs(p.left),Math.abs(p.left+p.width))))*density*2+pad*2);
 const height=Math.ceil(Math.max(...poses.map(p=>p.height))*density+pad*2),columns=state==='attack'?4:3,rows=Math.ceil(mapping.frames/columns);
 if(width*columns>2048||height*rows>2048)throw new Error('Cosmetic state exceeds mobile texture budget');
 const textureKey='offline-awakening:'+profile.slug+':'+state;
 if(scene.textures.exists(textureKey))scene.textures.remove(textureKey);
 const atlas=scene.textures.createCanvas(textureKey,width*columns,height*rows)!;
 const draw=atlas.getContext();draw.imageSmoothingEnabled=true;draw.imageSmoothingQuality='high';
 let frames:AwakenedPoseFrame[]=[];
 const bodyBounds:HeroAlphaBounds[]=[],report={frames:mapping.frames,border:0,gripCorrections:0,maxGripCorrection:0,heightRatio};
 poses.forEach((p,i)=>{
  const x=i%columns*width,y=Math.floor(i/columns)*height,dx=width/2+p.left*density;
  draw.drawImage(spriteSubjectCanvas(p.subject),x+dx,y+pad,p.width*density,p.height*density);
  const grip=p.meta.weaponGrip?{
   ...p.meta.weaponGrip,
   x:dx+(p.meta.weaponGrip.x/sheet.density-p.b.left)/p.b.width*p.width*density,
   y:pad+(p.meta.weaponGrip.y/sheet.density-p.b.top)/p.b.height*p.height*density,
  }:undefined;
  const registered={x,y,width,height,originX:.5,originY:(pad-p.top*density)/height,grip};frames.push(registered);
  const f=atlas.add(i,0,x,y,width,height)!;
  f.customData={weaponGrip:grip,heroDensity:density,visibleBounds:{left:dx/density,top:pad/density,width:p.width,height:p.height},
   sourceRegion:p.meta.sourceRegion,sourceFit:p.width/Math.max(1,p.meta.sourceRegion?.[2]??p.width)};
 });
 for(const f of frames){
  const data=draw.getImageData(f.x,f.y,width,height).data;
  let top=height,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  bodyBounds.push({top,bottom});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if((x<3||y<3||x>=width-3||y>=height-3)&&data[(y*width+x)*4+3]>32)report.border++;
  if(f.grip){
   let best:{x:number;y:number;distance:number}|null=null;
   for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){
    const x=Math.round(f.grip.x)+dx,y=Math.round(f.grip.y)+dy,distance=dx*dx+dy*dy;
    if(x>=0&&y>=0&&x<width&&y<height&&data[(y*width+x)*4+3]>128&&(!best||distance<best.distance))best={x,y,distance};
   }
   if(!best)throw new Error(`Unregistered gripping fist: ${profile.slug}/${state}/${frames.indexOf(f)}`);
   if(best.distance>0){f.grip.x=best.x;f.grip.y=best.y;report.gripCorrections++;report.maxGripCorrection=Math.max(report.maxGripCorrection,Math.sqrt(best.distance)/density);}
  }
 }
 if(report.border)throw new Error('Cosmetic pixels touch a GPU frame gutter');
 frames=registerHeroBodyFrames(state,frames,bodyBounds,density);
 const png=(atlas.getSourceImage() as HTMLCanvasElement).toDataURL();scene.textures.remove(textureKey);
 read.width=read.height=1;
 return {png,spec:{width:width*columns,height:height*rows,frames,preparationVersion:1,bodyRegistrationVersion:HERO_BODY_REGISTRATION_VERSION},report};
}

export async function packAwakeningItem(slug:string,kind:'weapon'|'heart',sourceUrl?:string){
 const image=new Image();image.src=sourceUrl??`/assets/characters/leigneron/awakened/${slug}/${kind}-source-v1.png`;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const read=canvas.getContext('2d',{willReadFrequently:true})!;read.drawImage(image,0,0);
 const data=read.getImageData(0,0,image.width,image.height).data;
 let left=image.width,top=image.height,right=0,bottom=0;
 for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(data[(y*image.width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 if(left>=right||top>=bottom||data[3]>16)throw new Error('Empty or opaque awakening item');
 const output=document.createElement('canvas');output.width=kind==='weapon'?256:128;output.height=kind==='weapon'?320:128;
 const width=right-left+1,height=bottom-top+1,fit=Math.min((output.width-16)/width,(output.height-16)/height);
 output.getContext('2d')!.drawImage(image,left,top,width,height,(output.width-width*fit)/2,(output.height-height*fit)/2,width*fit,height*fit);
 return {png:output.toDataURL()};
}
