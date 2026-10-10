import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {GUARD_MARCH_ART,guardMarchFrameOrigin} from '../../data/guardMarchArt';
import {NPC_IDLE_ART,npcIdleSources} from '../../data/npcIdleArt';
import {actorSpriteGridSubjects,actorSpriteSubjects} from './spriteComponents';
import {spriteSubjectCanvas} from './spriteArt';
import type {SpriteAnimation} from '../../data/animationPacks';

/** Complete marching poses with one family scale, padded GPU frames, and
 * source-authored body roots. Never overlay new legs on an existing torso. */
export function prepareGuardMarchArt(scene:Phaser.Scene):SpriteAnimation[]{
 const animations:SpriteAnimation[]=[];
 for(const art of GUARD_MARCH_ART){
  const source=scene.textures.get('guard-march-source:'+art.walk).getSourceImage() as HTMLImageElement;
  const native=document.createElement('canvas');native.width=source.width;native.height=source.height;
  const sourceCtx=native.getContext('2d')!;sourceCtx.drawImage(source,0,0);
  const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
  const grid='grid' in art?art.grid:undefined;
  const subjects=grid?actorSpriteGridSubjects(pixels,source.width,source.height,grid.columns,grid.rows)
   :actorSpriteSubjects(pixels,source.width,source.height,6,4);
  const idle=NPC_IDLE_ART.find(a=>a.walk===art.walk)!,bodyHeight=npcIdleSources(idle)[0].renderScale!*idle.bodyHeight;
  const sheet=ART_BY_KEY[art.texture],fw=sheet.frameWidth*2,fh=sheet.frameHeight*2,ground=fh-4;
  const gutter='frameGutter' in art?art.frameGutter:0;
  const texture=scene.textures.createCanvas(art.texture,(fw+gutter*2)*6,(fh+gutter*2)*4)!,ctx=texture.getContext();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const fit=subjects.reduce((scale,subject,frame)=>{
   const [left,,width,height]=subject.region,rootX=(frame%6+.5)*source.width/6;
   const leftOffset=rootX-left,rightOffset=left+width-rootX;
   const horizontalFit=Math.min(
    leftOffset>0?(fw/2-4)/(leftOffset*2):Infinity,
    rightOffset>0?(fw/2-4)/(rightOffset*2):Infinity,
   );
   const verticalFit=(ground-4)/(height*2);
   return Math.min(scale,horizontalFit,verticalFit);
  },bodyHeight/art.bodyHeight);
  subjects.forEach((subject,frame)=>{
   const [left,top,width,height]=subject.region,rootX=(frame%6+.5)*source.width/6,rootY=top+height;
   const {x:cellX,y:cellY}=gutter?guardMarchFrameOrigin(frame,fw,fh):{x:frame%6*fw,y:Math.floor(frame/6)*fh};
   const x=cellX+fw/2+(left-rootX)*fit*2,y=cellY+ground-height*fit*2;
   if(x<cellX+4||x+width*fit*2>cellX+fw-4||y<cellY+4)
    throw new Error('Guard march pose exceeds its padded frame: '+art.walk+'/'+frame);
   ctx.save();ctx.beginPath();ctx.rect(cellX,cellY,fw,fh);ctx.clip();
   ctx.drawImage(spriteSubjectCanvas(subject),x,y,width*fit*2,height*fit*2);
   ctx.restore();
   const prepared=texture.add(frame,0,cellX,cellY,fw,fh)!;
   prepared.customData={fullSprite:true,isolatedSubject:true,sourceRegion:[...subject.region],sourceFit:fit,
    sourceRoot:{x:rootX,y:rootY},sourcePath:art.path,foreignProbes:subject.foreignProbes,
    visibleBounds:{left:(x-cellX)/2,top:(y-cellY)/2,width:width*fit,height:height*fit}};
  });
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  ['down','left','right','up'].forEach((direction,row)=>animations.push({key:art.walk+'-'+direction,texture:art.texture,
   frames:[0,1,2,3,4,5].map(i=>row*6+i),frameRate:8,repeat:-1}));
  scene.textures.remove('guard-march-source:'+art.walk);
 }
 return animations;
}

export function guardMarchScale(scene:Phaser.Scene,texture:string,idle:typeof NPC_IDLE_ART[number]){
 const idleHeight=Math.max(...idle.regions.map(([, , ,height])=>height))*npcIdleSources(idle)[0].renderScale!;
 const marchHeight=Math.max(...Array.from({length:24},(_,frame)=>{
  const sprite=scene.textures.getFrame(texture,frame);
  if(!sprite)throw new Error(`Missing guard march frame ${texture}/${frame}`);
  const bounds=(sprite.customData as {visibleBounds?:{height?:number}}).visibleBounds;
  if(typeof bounds?.height!=='number')throw new Error(`Missing guard march bounds for ${texture}/${frame}`);
  return bounds.height*2;
 }));
 return idleHeight/marchHeight;
}
