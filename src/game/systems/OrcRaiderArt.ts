import Phaser from 'phaser';
import {ART_BY_KEY,HERO_VISIBLE_HEIGHT} from '../../data/art';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';
import {fitAtlasPoses} from './atlasPoseFit';

const COMBAT_SOURCE='rindass-orc-raider:actions';
const COMBAT_TEXTURE='enemy_orc_raider';
const WALK_SOURCE='directional-source:rindass-orc-raider';

/** Pack the authored 6x3 attack/hurt/death board at the exact scale of the
 * neutral down-facing walk pose. Body/feet remain complete; nothing is stitched. */
export function prepareOrcRaiderCombatArt(scene:Phaser.Scene){
 const walk=scene.textures.get(WALK_SOURCE).getSourceImage() as HTMLImageElement;
 const walkCanvas=document.createElement('canvas');walkCanvas.width=walk.width;walkCanvas.height=walk.height;
 const walkContext=walkCanvas.getContext('2d',{willReadFrequently:true})!;walkContext.drawImage(walk,0,0);
 const walkSubjects=actorSpriteSubjects(walkContext.getImageData(0,0,walk.width,walk.height).data,walk.width,walk.height,7,4);
 const desiredFit=HERO_VISIBLE_HEIGHT/walkSubjects[0].region[3];
 const source=scene.textures.get(COMBAT_SOURCE).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const subjects=actorSpriteSubjects(context.getImageData(0,0,source.width,source.height).data,source.width,source.height,6,3);
 const sheet=ART_BY_KEY[COMBAT_TEXTURE],columns=sheet.atlasColumns??sheet.columns;
 const fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density;
 const texture=scene.textures.createCanvas(COMBAT_TEXTURE,columns*fw,Math.ceil(subjects.length/columns)*fh)!;
 const ctx=texture.getContext(),drawPose=createSpriteCropper();
 const roots=subjects.map(subject=>{
  const [rx,,w,h]=subject.region;let sum=0,weight=0;
  for(let py=Math.floor(h*.84);py<h;py++)for(let px=0;px<w;px++){
   const alpha=subject.pixels[(py*w+px)*4+3];if(alpha>128){sum+=px*alpha;weight+=alpha;}
  }
  return rx+(weight?sum/weight:w/2);
 });
 const fit=fitAtlasPoses(desiredFit,sheet.frameWidth,sheet.frameHeight,sheet.frameHeight-(sheet.groundPadding??2),
  subjects.map((subject,i)=>({region:subject.region,rootX:roots[i],rootY:subject.region[1]+subject.region[3]})));
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 subjects.forEach((subject,index)=>{
  const [rx,ry,w,h]=subject.region,root=roots[index]-rx;
  const frameX=index%columns*fw,frameY=Math.floor(index/columns)*fh;
  const drawX=fw/2-root*fit*sheet.density,drawY=fh-(sheet.groundPadding??2)*sheet.density-h*fit*sheet.density;
  // One uniform safe fit retains the full motion, including the longest weapon reach.
  ctx.save();ctx.beginPath();ctx.rect(frameX,frameY,fw,fh);ctx.clip();
  drawPose(ctx,spriteSubjectCanvas(subject),[0,0,w,h],frameX+drawX,frameY+drawY,w*fit*sheet.density,h*fit*sheet.density);ctx.restore();
  const frame=texture.add(index,0,frameX,frameY,fw,fh);
  if(frame)frame.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subject.foreignProbes,
   sourcePath:'assets/enemies/rindass_orc_raider/actions.png',sourceImageSize:[source.width,source.height],
   sourceRegion:subject.region,sourceFit:fit,visibleBounds:{left:drawX/sheet.density,top:drawY/sheet.density,width:w*fit,height:h*fit}};
 });
 texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.textures.remove(COMBAT_SOURCE);
}
