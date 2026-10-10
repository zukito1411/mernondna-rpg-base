import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {NPC_IDLE_ART,npcDirectionalIdleTexture} from '../../data/npcIdleArt';
import type {SpriteAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects} from './spriteComponents';
import {spriteSubjectCanvas} from './spriteArt';

/** Reuse each complete side/back pose with a small, ground-anchored breath.
 * Bake once: idle never runs a walking cycle or changes the physics body's size. */
export function prepareNpcDirectionalIdleArt(scene:Phaser.Scene):SpriteAnimation[]{
 const animations:SpriteAnimation[]=[];
 for(const entry of NPC_IDLE_ART){
  const key=npcDirectionalIdleTexture(entry.walk),sheet=ART_BY_KEY[key];
  const fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density,ground=fh-2*sheet.density;
  const texture=scene.textures.createCanvas(key,fw*4,fh*3)!,ctx=texture.getContext();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ['left','right','up'].forEach((direction,row)=>{
   const sourceFrame=(row+1)*6,source=scene.textures.getFrame(entry.walk,sourceFrame)!;
   const pose=document.createElement('canvas');pose.width=fw;pose.height=fh;
   const poseCtx=pose.getContext('2d')!;
   poseCtx.drawImage(source.source.image as CanvasImageSource,source.cutX,source.cutY,fw,fh,0,0,fw,fh);
   // Preserve the whole actor and attached weapon; discard source-row debris
   // such as a neighboring boot above the royal guard's back-facing head.
   const subject=actorSpriteSubjects(poseCtx.getImageData(0,0,fw,fh).data,fw,fh,1,1)[0];
   const clean=spriteSubjectCanvas(subject),[left,top,width,height]=subject.region;
   const bounds={left:left/sheet.density,top:top/sheet.density,width:width/sheet.density,height:height/sheet.density};
   // Reuse the four breath poses on the exhale instead of storing duplicates.
   [1,.998,.994,.992].forEach((breath,i)=>{
    ctx.save();ctx.beginPath();ctx.rect(i*fw,row*fh,fw,fh);ctx.clip();
    ctx.translate(i*fw,row*fh+ground*(1-breath));ctx.scale(1,breath);
    ctx.drawImage(clean,left,top,width,height);ctx.restore();
    const frame=texture.add(row*4+i,0,i*fw,row*fh,fw,fh)!;
    frame.customData={...source.customData,idleDirection:direction,sourcePose:sourceFrame,isolatedSubject:true,
     visibleBounds:{...bounds,top:ground/sheet.density+(bounds.top-ground/sheet.density)*breath,height:bounds.height*breath}};
   });
   animations.push({key:entry.walk+'-idle-'+direction,texture:key,frames:[0,1,2,3,2,1].map(i=>row*4+i),frameRate:2.5,repeat:-1});
  });
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
 }
 return animations;
}
