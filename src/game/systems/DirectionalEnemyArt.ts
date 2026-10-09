import type Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {enemyAnimation,type SpriteAnimation} from '../../data/animationPacks';
import {DIRECTIONAL_ENEMY_ART,ACTOR_DIRECTIONS,enemyLocomotionKey} from '../../data/directionalEnemyArt';
import {alphaFrameBounds} from './spriteArt';
/** Append prepared frames to existing atlases, preserving combat frames,
 * collision geometry, save IDs and the actor's scale across texture changes. */
export function prepareDirectionalEnemyArt(scene:Phaser.Scene):SpriteAnimation[]{
 const animations:SpriteAnimation[]=[];
 const nextFrame=new Map<string,number>();
 for(const art of DIRECTIONAL_ENEMY_ART){
  const sourceKey='directional-source:'+art.id,source=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const sourceCanvas=document.createElement('canvas');sourceCanvas.width=source.width;sourceCanvas.height=source.height;
  const sourceCtx=sourceCanvas.getContext('2d',{willReadFrequently:true})!;sourceCtx.drawImage(source,0,0);
  const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
  const cells=Array.from({length:20},(_,i)=>{
   const x=Math.floor(i%5*source.width/5),y=Math.floor(Math.floor(i/5)*source.height/4);
   const w=Math.floor((i%5+1)*source.width/5)-x,h=Math.floor((Math.floor(i/5)+1)*source.height/4)-y;
   const region=alphaFrameBounds(pixels,source.width,[x,y,w,h]);
   if(!region)throw new Error(`Empty directional sprite: ${art.id}/${i}`);
   return {x,y,w,h,region};
  });
  const sheet=ART_BY_KEY[art.texture],texture=scene.textures.get(art.texture) as Phaser.Textures.CanvasTexture;
  const idle=texture.get(enemyAnimation(art.species,'idle').frames[0]);
  const targetHeight=(idle.customData as {visibleBounds:{height:number}}).visibleBounds.height;
  const roots=ACTOR_DIRECTIONS.map((_,row)=>{
   const [x,y,w,h]=cells[row*5].region;let sum=0,weight=0;
   for(let py=y+Math.floor(h*.85);py<y+h;py++)for(let px=x;px<x+w;px++){
    const alpha=pixels[(py*source.width+px)*4+3];if(alpha>128){sum+=(px-cells[row*5].x)*alpha;weight+=alpha;}
   }
   return weight?sum/weight:x-cells[row*5].x+w/2;
  });
  const reach=Math.max(...cells.map((c,i)=>{
   const left=c.region[0]-c.x-roots[Math.floor(i/5)];return Math.max(Math.abs(left),Math.abs(left+c.region[2]));
  }));
  const fit=Math.min((sheet.frameWidth/2-4)/reach,
    (sheet.frameHeight-8)/Math.max(...cells.map(c=>c.region[3])),targetHeight/Math.max(...cells.map(c=>c.region[3])));
  const start=nextFrame.get(art.texture)??sheet.columns;nextFrame.set(art.texture,start+20);
  const columns=sheet.atlasColumns??sheet.columns,fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density;
  const needed=Math.ceil((start+20)/columns)*fh;
  if(needed>texture.height){
   const backup=document.createElement('canvas');backup.width=texture.width;backup.height=texture.height;
   backup.getContext('2d')!.drawImage(texture.getSourceImage() as HTMLCanvasElement,0,0);
   texture.setSize(texture.width,needed);texture.getContext().drawImage(backup,0,0);
  }
  const ctx=texture.getContext();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  cells.forEach((cell,i)=>{
   const frame=start+i,x=frame%columns*fw,y=Math.floor(frame/columns)*fh,[rx,ry,w,h]=cell.region;
   const drawX=fw/2+(rx-cell.x-roots[Math.floor(i/5)])*fit*sheet.density;
   const drawY=fh-(sheet.groundPadding??2)*sheet.density-h*fit*sheet.density;
   ctx.save();ctx.beginPath();ctx.rect(x,y,fw,fh);ctx.clip();
   ctx.drawImage(source,rx,ry,w,h,x+drawX,y+drawY,w*fit*sheet.density,h*fit*sheet.density);ctx.restore();
   const prepared=texture.add(frame,0,x,y,fw,fh);
   if(prepared)prepared.customData={visibleBounds:{left:drawX/sheet.density,top:drawY/sheet.density,width:w*fit,height:h*fit},sourceRegion:cell.region,sourceFit:fit};
  });
  ACTOR_DIRECTIONS.forEach((direction,row)=>{
   const base=start+row*5;
   animations.push({key:enemyLocomotionKey(art.species,'idle',direction),texture:art.texture,frames:[base],frameRate:1,repeat:-1},
     {key:enemyLocomotionKey(art.species,'walk',direction),texture:art.texture,frames:[base+1,base+2,base+3,base+4],frameRate:8,repeat:-1});
  });
  texture.refresh();scene.textures.remove(sourceKey);
 }
 return animations;
}
