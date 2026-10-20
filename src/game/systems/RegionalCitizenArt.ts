import type Phaser from 'phaser';
import {NPC_IDLE_ART} from '../../data/npcIdleArt';
import {alphaFrameBounds,spriteSubjectCanvas,createSpriteCropper} from './spriteArt';
import {actorSpriteGridSubjects} from './spriteComponents';
import type {SpriteRegion} from '../../data/art';

import {BASE_FAMILIES,CITIZEN_SOURCES,citizenHeight} from '../../data/regionalCitizenArt';
export {CITIZEN_SOURCES,citizenModel,citizenHeight} from '../../data/regionalCitizenArt';
const texture='regional-citizens-v2',FRAME=160,GROUND=156;

export function prepareCitizenArt(scene:Phaser.Scene){
  for(const _culture of citizenArtBatches(scene)){/* Synchronous preview callers. */}
}
export function* citizenArtBatches(scene:Phaser.Scene):Generator<string>{
  const atlas=scene.textures.createCanvas(texture,FRAME*12,FRAME*12)!,ctx=atlas.getContext();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const warnings:string[]=[],draw=createSpriteCropper();
  for(const [culture,spec] of CITIZEN_SOURCES.entries()){
    const image=scene.textures.get(spec.key).getSourceImage() as HTMLImageElement;
    const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
    const sourceCtx=source.getContext('2d')!;sourceCtx.drawImage(image,0,0);
    // Measured complete outlines, not the nominal 512px cells: the Frostlands
    // herbalist and Rindass smith cross a column seam. Each crop has its own
    // transparent gutter and subject mask, so no boots or tools get cut off.
    const subjects=spec.regions.map(([x,y,w,h])=>{
      const left=Math.max(0,x-8),top=Math.max(0,y-8);
      const width=Math.min(image.width,x+w+8)-left,height=Math.min(image.height,y+h+8)-top;
      return {subject:actorSpriteGridSubjects(sourceCtx.getImageData(left,top,width,height).data,width,height,1,1)[0],width,height};
    });
    for(let slot=0;slot<6;slot++){
      const model=culture*6+slot,{subject,width:cw,height:ch}=subjects[slot];
      const [sx,sy,sw,sh]=subject.region;
      let pose=spriteSubjectCanvas(subject),height=sh,width=sw;
      const complete=sx>2&&sy>2&&sx+sw<cw-2&&sy+sh<ch-2;
      if(!complete){
        // Never turn an edge-cut source into a clipped/bleeding actor. Retain
        // the approved complete body and expose the failed source in registry.
        const reference=NPC_IDLE_ART.find(a=>a.walk===BASE_FAMILIES[slot])!;
        const original=scene.textures.get(`source:${reference.path}`).getSourceImage() as HTMLImageElement;
        const originalCanvas=document.createElement('canvas');originalCanvas.width=original.width;originalCanvas.height=original.height;
        const originalCtx=originalCanvas.getContext('2d')!;originalCtx.drawImage(original,0,0);
        const bounds=alphaFrameBounds(originalCtx.getImageData(0,0,original.width,original.height).data,original.width,reference.regions[0])!;
        width=bounds[2];height=bounds[3];pose=document.createElement('canvas');pose.width=width;pose.height=height;
        draw(pose.getContext('2d')!,original,bounds,0,0,width,height);
        warnings.push(`${spec.region} slot ${slot}: incomplete source; approved ${reference.walk} retained`);
      }
      // Remove mask padding before measuring apparent height and setting the
      // boot baseline. Clothing changes do not change world height or feet.
      const bounds=alphaFrameBounds(pose.getContext('2d')!.getImageData(0,0,width,height).data,width,[0,0,width,height]) as SpriteRegion;
      const trimmed=document.createElement('canvas');trimmed.width=bounds[2];trimmed.height=bounds[3];
      draw(trimmed.getContext('2d')!,pose,bounds,0,0,trimmed.width,trimmed.height);
      pose=trimmed;width=pose.width;height=pose.height;
      const fit=Math.min((FRAME-8)/height,(FRAME-8)/width),scale=citizenHeight(model)/(height*fit);
      // Existing grounded idle breathing, baked from one complete pose. No
      // independently regenerated limbs, face drift or size pumping.
      [1,.994,.984,.978].forEach((breath,beat)=>{
        const index=model*4+beat,x=index%12*FRAME,y=Math.floor(index/12)*FRAME,w=width*fit,h=height*fit*breath;
        ctx.drawImage(pose,x+(FRAME-w)/2,y+GROUND-h,w,h);
        atlas.add(index,0,x,y,FRAME,FRAME)!.customData={citizenScale:scale,groundY:GROUND,
          baseFamily:BASE_FAMILIES[slot],region:spec.region,isolatedSubject:true};
      });
      scene.anims.create({key:`citizen-idle-v2:${model}`,frames:[0,1,2,3,2,1].map(beat=>({key:texture,frame:model*4+beat})),
        frameRate:3,repeat:-1});
    }
    scene.textures.remove(spec.key);
    source.width=source.height=1;
    subjects.length=0;
    yield spec.region;
  }
  atlas.refresh();scene.registry.set('citizenArtWarnings',warnings);
  for(const warning of warnings)console.warn(warning);
}
export function presentCitizen(actor:Phaser.Physics.Arcade.Sprite,model:number){
  if(actor.texture.key===texture){
    if(!actor.anims.isPlaying&&!actor.anims.isPaused)actor.play(`citizen-idle-v2:${model}`);
    return;
  }
  actor.anims.stop();actor.setTexture(texture,model*4);
  const scale=Number((actor.frame.customData as {citizenScale:number}).citizenScale);
  actor.setScale(scale).setOrigin(.5,GROUND/FRAME).setFlipX(false);
  const body=actor.body as Phaser.Physics.Arcade.Body;
  body.setSize(18/scale,22/scale).setOffset(FRAME/2-9/scale,GROUND-22/scale).setImmovable(true);
  body.pushable=false;body.updateFromGameObject();
  let phase=0;for(const c of actor.name)phase=(phase*31+c.charCodeAt(0))>>>0;
  actor.play(`citizen-idle-v2:${model}`);actor.anims.setProgress((phase%997)/997);
}
