import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {enemyAnimation,type SpriteAnimation} from '../../data/animationPacks';
import {DIRECTIONAL_ENEMY_ART,ACTOR_DIRECTIONS,enemyLocomotionKey} from '../../data/directionalEnemyArt';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';
/** Dedicated locomotion atlases keep combat UVs immutable. Size each family
 * against the original neutral profile, allowing room for wings and weapons. */
export function prepareDirectionalEnemyArt(scene:Phaser.Scene):SpriteAnimation[]{
 const animations:SpriteAnimation[]=[];
 const drawPose=createSpriteCropper();
 for(const art of DIRECTIONAL_ENEMY_ART){
  const sourceKey='directional-source:'+art.id,source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=source.width;sourceCanvas.height=source.height;
  const sourceCtx=sourceCanvas.getContext('2d',{willReadFrequently:true})!;sourceCtx.drawImage(source,0,0);
  const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
  const subjects=actorSpriteSubjects(pixels,source.width,source.height,5,4),regions=subjects.map(s=>s.region);
  const cells=Array.from({length:20},(_,i)=>{
   const x=Math.floor(i%5*source.width/5),y=Math.floor(Math.floor(i/5)*source.height/4);
   const w=Math.floor((i%5+1)*source.width/5)-x,h=Math.floor((Math.floor(i/5)+1)*source.height/4)-y;
   const region=regions[i];
   return {x,y,w,h,region};
  });
  const sheet=ART_BY_KEY[art.walkTexture],legacy=scene.textures.get(art.texture);
  const idle=legacy.get(enemyAnimation(art.species,'idle').frames[0]);
  const targetHeight=(idle.customData as {visibleBounds:{height:number}}).visibleBounds.height;
  const roots=ACTOR_DIRECTIONS.map((_,row)=>{
   const [x,y,w,h]=cells[row*5].region;let sum=0,weight=0;
   for(let py=y+Math.floor(h*.85);py<y+h;py++)for(let px=x;px<x+w;px++){
    const alpha=subjects[row*5].pixels[((py-y)*w+px-x)*4+3];if(alpha>128){sum+=(px-cells[row*5].x)*alpha;weight+=alpha;}
   }
   return weight?sum/weight:x-cells[row*5].x+w/2;
  });
  // One fixed scale per direction, calibrated by its complete standing pose.
  // Never let a reaching weapon or wing resize the character between frames.
  // Preserve the bandit's approved front/back sizing from before the side fix.
  const banditReach=Math.max(...cells.map((c,i)=>{
   const left=c.region[0]-c.x-roots[Math.floor(i/5)];return Math.max(Math.abs(left),Math.abs(left+c.region[2]));
  }));
  const banditVerticalFit=Math.min((sheet.frameWidth/2-4)/banditReach,
   (sheet.frameHeight-8)/Math.max(...cells.map(c=>c.region[3])),
   targetHeight/((cells[5].region[3]+cells[10].region[3])/2));
  const fits=ACTOR_DIRECTIONS.map((direction,row)=>art.species===1&&(direction==='down'||direction==='up')
   ?banditVerticalFit:targetHeight/cells[row*5].region[3]);
  // The bandit's authored side poses drift within their source cells. Register
  // each complete pose by its hood, keeping the torso steady as the boots move.
  // Only the side rows need this correction; front/back artwork stays approved.
  const sideHoods=cells.map((cell,i)=>{
   if(art.species!==1||i<5||i>=15)return 0;
   const [x,,w,h]=cell.region;let sum=0,weight=0;
   for(let y=0;y<Math.floor(h*.2);y++)for(let px=0;px<w;px++){
    const alpha=subjects[i].pixels[(y*w+px)*4+3];
    if(alpha>128){sum+=(x+px-cell.x)*alpha;weight+=alpha;}
   }
   return weight?sum/weight:0;
  });
  const columns=sheet.atlasColumns??sheet.columns,fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density;
  const texture=scene.textures.createCanvas(art.walkTexture,columns*fw,Math.ceil(20/columns)*fh)!;
  const ctx=texture.getContext();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  cells.forEach((cell,i)=>{
   const frame=i,x=frame%columns*fw,y=Math.floor(frame/columns)*fh,[rx,ry,w,h]=cell.region,fit=fits[Math.floor(i/5)];
   const sideOffset=sideHoods[Math.floor(i/5)*5]-sideHoods[i];
   const drawX=fw/2+(rx-cell.x-roots[Math.floor(i/5)]+sideOffset)*fit*sheet.density;
   const drawY=fh-(sheet.groundPadding??2)*sheet.density-h*fit*sheet.density;
   if(drawX<4||drawY<4||drawX+w*fit*sheet.density>fw-4)throw new Error('Complete directional pose needs more canvas room: '+art.id+'/'+i);
   ctx.save();ctx.beginPath();ctx.rect(x,y,fw,fh);ctx.clip();
   drawPose(ctx,spriteSubjectCanvas(subjects[i]),[0,0,w,h],x+drawX,y+drawY,w*fit*sheet.density,h*fit*sheet.density);ctx.restore();
   const prepared=texture.add(frame,0,x,y,fw,fh);
   if(prepared)prepared.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subjects[i].foreignProbes,visibleBounds:{left:drawX/sheet.density,top:drawY/sheet.density,width:w*fit,height:h*fit},
    sourcePath:'assets/enemies/directional/'+art.id+'.png',sourceImageSize:[source.width,source.height],sourceRegion:cell.region,sourceFit:fit};
  });
  ACTOR_DIRECTIONS.forEach((direction,row)=>{
   const base=row*5;
   // Keep contact/passing poses together. Returning to neutral after every
   // individual pose interrupts the foot's swing halfway through a stride.
   const banditSide=art.species===1&&(direction==='left'||direction==='right');
   const walk=banditSide?[base,base+1,base+2,base,base+3,base+4]:[base+1,base+2,base+3,base+4];
   animations.push({key:enemyLocomotionKey(art.species,'idle',direction),texture:art.walkTexture,frames:[base],frameRate:1,repeat:-1},
     {key:enemyLocomotionKey(art.species,'walk',direction),texture:art.walkTexture,frames:walk,frameRate:banditSide?9:8,repeat:-1,
      ...(banditSide?{frameDurations:[70,130,130,70,130,130]}:{})});
  });
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.textures.remove(sourceKey);
 }
 return animations;
}
