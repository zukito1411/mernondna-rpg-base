import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {enemyAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

export const REFINED_ENEMY_ART=[
 {species:4,id:'cave-troll'}, {species:5,id:'ash-dragon'},
] as const;
export const REFINED_ENEMY_STATES=['attack','hurt','death'] as const;
export const refinedEnemyPath=(id:string,state:string)=>`assets/enemies/refined/${id}-${state}.png`;
export const REFINED_DRAGON_FLIGHT=refinedEnemyPath('ash-dragon','fly');

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
   const fit=neutralBounds.height/regions[0][3],density=sheet.density;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   clip.frames.forEach((index,i)=>{
    const region=regions[i],[rx,ry,w,h]=region,frame=texture.get(index);
    // Feet/body mass, excluding a troll's long club, registers the actor root.
    const footRight=rx+w*(art.species===4?.62:1);let weightedX=0,weight=0;
    for(let py=ry+Math.floor(h*.88);py<ry+h;py++)for(let px=rx;px<footRight;px++){
     const a=subjects[i].pixels[((py-ry)*w+px-rx)*4+3];if(a>128){weightedX+=px*a;weight+=a;}
    }
    const root=weight?weightedX/weight:rx+w/2;
    const left=sheet.frameWidth/2+(rx-root)*fit;
    const top=sheet.frameHeight-(sheet.groundPadding??2)-h*fit;
    if(left<2||top<2||left+w*fit>sheet.frameWidth-2)throw new Error(`Complete ${art.id}/${state}/${i} pose exceeds its padded cell`);
    ctx.clearRect(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight);
    drawPose(ctx,spriteSubjectCanvas(subjects[i]),[0,0,w,h],frame.cutX+left*density,frame.cutY+top*density,w*fit*density,h*fit*density);
    const mouth=art.species===5&&state==='attack'&&i<3?[
     [468,354],[943,228],[1483,373],
    ][i]:undefined;
    frame.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subjects[i].foreignProbes,sourcePath:refinedEnemyPath(art.id,state),sourceImageSize:[source.width,source.height],sourceRegion:region,sourceFit:fit,
     visibleBounds:{left,top,width:w*fit,height:h*fit},
     ...(mouth?{mouth:{x:sheet.frameWidth/2+(mouth[0]-root)*fit,y:sheet.frameHeight-(sheet.groundPadding??2)+(mouth[1]-ry-h)*fit}}:{})};
   });
   scene.textures.remove(key);
  }
  const prepared=scene.textures.get(neutral.texture) as Phaser.Textures.CanvasTexture;
  prepared.refresh();prepared.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 // Flight shares the restored ground model's head/body detail. Register the
 // body under the wings, using authored anchors rather than wing bounds.
 const key='refined-source:ash-dragon:fly',source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const subjects=actorSpriteSubjects(context.getImageData(0,0,source.width,source.height).data,source.width,source.height,3,2),regions=subjects.map(s=>s.region);
 const anchors=[[275,558],[670,547],[1080,543],[315,1078],[698,1104],[1115,1089]],fit=.65;
 const sheet=ART_BY_KEY.enemy_dragon_fly,density=sheet.density;
 const texture=scene.textures.get('enemy_dragon_fly') as Phaser.Textures.CanvasTexture,ctx=texture.getContext();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 regions.forEach((region,i)=>{
  const [rx,ry,w,h]=region,[rootX,rootY]=anchors[i],frame=texture.get(i);
  const left=sheet.frameWidth/2+(rx-rootX)*fit,top=sheet.frameHeight-(sheet.groundPadding??2)+(ry-rootY)*fit;
  if(left<2||top<2||left+w*fit>sheet.frameWidth-2||top+h*fit>sheet.frameHeight-2)throw new Error('Complete dragon flight pose exceeds padded cell: '+i);
  ctx.clearRect(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight);
  drawPose(ctx,spriteSubjectCanvas(subjects[i]),[0,0,w,h],frame.cutX+left*density,frame.cutY+top*density,w*fit*density,h*fit*density);
  frame.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subjects[i].foreignProbes,sourcePath:REFINED_DRAGON_FLIGHT,sourceImageSize:[source.width,source.height],sourceRegion:region,sourceFit:fit,
   visibleBounds:{left,top,width:w*fit,height:h*fit}};
 });
 texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.textures.remove(key);
}
