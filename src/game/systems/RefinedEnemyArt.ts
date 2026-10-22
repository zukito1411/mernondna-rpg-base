import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {enemyAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';
import {fitAtlasPoses} from './atlasPoseFit';

export const REFINED_ENEMY_ART=[
 {species:4,id:'cave-troll'},
] as const;
export const REFINED_ENEMY_STATES=['attack','hurt','death'] as const;
export const refinedEnemyPath=(id:string,state:string)=>`assets/enemies/refined/${id}-${state}.png`;

/** Replace whole action poses at one species scale. Never stitch body parts or
 * resize a live atlas: all cells/UVs are allocated once by the boot pipeline. */
export function prepareRefinedEnemyArt(scene:Phaser.Scene){
 const drawPose=createSpriteCropper();
 for(const art of REFINED_ENEMY_ART){
  const neutral=enemyAnimation(art.species,'idle');
  const neutralBounds=(scene.textures.get(neutral.texture).get(neutral.frames[0]).customData as {visibleBounds:{height:number}}).visibleBounds;
  for(const state of REFINED_ENEMY_STATES){
   const key=`refined-source:${art.id}:${state}`,source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
   const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
   const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
   const pixels=context.getImageData(0,0,source.width,source.height).data;
   const subjects=actorSpriteSubjects(pixels,source.width,source.height,3,2),regions=subjects.map(s=>s.region);
   const clip=enemyAnimation(art.species,state),sheet=ART_BY_KEY[clip.texture as ArtTextureKey];
   const texture=scene.textures.get(clip.texture) as Phaser.Textures.CanvasTexture,ctx=texture.getContext();
   const roots=regions.map(([rx,ry,w,h],i)=>{
    const footRight=rx+w*.62;let weightedX=0,weight=0;
    for(let py=ry+Math.floor(h*.88);py<ry+h;py++)for(let px=rx;px<footRight;px++){
     const a=subjects[i].pixels[((py-ry)*w+px-rx)*4+3];if(a>128){weightedX+=px*a;weight+=a;}
    }
    return weight?weightedX/weight:rx+w/2;
   });
   const fit=fitAtlasPoses(neutralBounds.height/regions[0][3],sheet.frameWidth,sheet.frameHeight,
    sheet.frameHeight-(sheet.groundPadding??2),
    regions.map((region,i)=>({region,rootX:roots[i],rootY:region[1]+region[3]}))),density=sheet.density;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   clip.frames.forEach((index,i)=>{
    const region=regions[i],[rx,ry,w,h]=region,frame=texture.get(index);
    const root=roots[i];
    const left=sheet.frameWidth/2+(rx-root)*fit;
    const top=sheet.frameHeight-(sheet.groundPadding??2)-h*fit;
    // The group uses one bounded scale; a long club cannot overrun its frame.
    ctx.clearRect(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight);
    drawPose(ctx,spriteSubjectCanvas(subjects[i]),[0,0,w,h],frame.cutX+left*density,frame.cutY+top*density,w*fit*density,h*fit*density);
    frame.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subjects[i].foreignProbes,sourcePath:refinedEnemyPath(art.id,state),sourceImageSize:[source.width,source.height],sourceRegion:region,sourceFit:fit,
     visibleBounds:{left,top,width:w*fit,height:h*fit}};
   });
   scene.textures.remove(key);
  }
  const prepared=scene.textures.get(neutral.texture) as Phaser.Textures.CanvasTexture;
  prepared.refresh();prepared.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
}
