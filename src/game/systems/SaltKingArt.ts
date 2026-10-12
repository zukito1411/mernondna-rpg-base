import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {SALT_KING_STATES,SALT_KING_TEXTURE,SALT_KING_WALK_TEXTURE,SALT_KING_SIDE_PATH,SALT_KING_GAIT_PATH,saltKingArtPath} from '../../data/saltKingArt';
import {PIRATE_GAIT_ORDER,CAPTAIN_GAIT_DURATIONS} from '../../data/pirateMotion';
import {ACTOR_DIRECTIONS,enemyLocomotionKey} from '../../data/directionalEnemyArt';
import type {SpriteAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects,type ActorSpriteSubject} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

/** Full authored pirate poses. Each board uses its neutral standing body to
 * calibrate every frame, including raised swords and the fallen corpse. */
export function prepareSaltKingArt(scene:Phaser.Scene):SpriteAnimation[]{
 const read=(state:'walk'|'side'|'gait'|typeof SALT_KING_STATES[number],columns:number,rows:number)=>{
  const source=scene.textures.get('salt-king-source:'+state).getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const subjects=actorSpriteSubjects(ctx.getImageData(0,0,source.width,source.height).data,source.width,source.height,columns,rows);
  canvas.width=canvas.height=1;
  return {source,subjects};
 };
 const draw=createSpriteCropper();
 const atlas=(key:ArtTextureKey,frames:number)=>{
  const sheet=ART_BY_KEY[key],fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density,columns=sheet.atlasColumns??sheet.columns;
  const texture=scene.textures.createCanvas(key,fw*columns,fh*Math.ceil(frames/columns))!,ctx=texture.getContext();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  return {sheet,fw,fh,columns,texture,ctx};
 };
 const weightedRoot=(subject:ActorSpriteSubject,head:boolean)=>{
  const [rx,,w,h]=subject.region;let sum=0,weight=0;
  for(let y=head?0:Math.floor(h*.84);y<(head?Math.ceil(h*.2):h);y++)for(let x=0;x<w;x++){
   const alpha=subject.pixels[(y*w+x)*4+3];if(alpha>128){sum+=(rx+x)*alpha;weight+=alpha;}
  }
  return weight?sum/weight:rx+w/2;
 };
 const place=(target:ReturnType<typeof atlas>,subject:ActorSpriteSubject,frame:number,fit:number,root:number,state:'walk'|'side'|'gait'|typeof SALT_KING_STATES[number],source:HTMLImageElement)=>{
  const {sheet,fw,fh,columns,texture,ctx}=target,[rx,,w,h]=subject.region;
  const left=sheet.frameWidth/2+(rx-root)*fit,top=sheet.frameHeight-2-h*fit;
  if(left<3||top<3||left+w*fit>sheet.frameWidth-3)throw new Error('Salt King complete pose exceeds atlas: '+state+'/'+frame);
  const x=frame%columns*fw,y=Math.floor(frame/columns)*fh;
  // Crop isolation and empty gutters keep adjacent poses out of the GPU UVs.
  draw(ctx,spriteSubjectCanvas(subject),[0,0,w,h],x+left*sheet.density,y+top*sheet.density,w*fit*sheet.density,h*fit*sheet.density);
  const prepared=texture.add(frame,0,x,y,fw,fh)!;
  prepared.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subject.foreignProbes,sourcePath:state==='side'?SALT_KING_SIDE_PATH:state==='gait'?SALT_KING_GAIT_PATH:saltKingArtPath(state),
   sourceRegion:subject.region,sourceImageSize:[source.width,source.height],sourceFit:fit,sourceRoot:root,
   visibleBounds:{left,top,width:w*fit,height:h*fit}};
 };
 const walking=read('walk',5,4),neutral=read('side',3,3),gait=read('gait',2,3),walk=atlas(SALT_KING_WALK_TEXTURE,27),animations:SpriteAnimation[]=[];
 const idle=neutral.subjects[0];
 place(walk,idle,20,76/idle.region[3],weightedRoot(idle,true),'side',neutral.source);
 // One standing-height calibration for the whole cycle; never resize lifted legs.
 const gaitFit=76/gait.subjects[0].region[3];
 gait.subjects.forEach((subject,i)=>place(walk,subject,21+i,gaitFit,weightedRoot(subject,true),'gait',gait.source));
 ACTOR_DIRECTIONS.forEach((direction,row)=>{
  const base=row*5,fit=76/walking.subjects[base].region[3];
  for(let i=0;i<5;i++)place(walk,walking.subjects[base+i],base+i,fit,weightedRoot(walking.subjects[base+i],true),'walk',walking.source);
  const side=direction==='left'||direction==='right';
  animations.push({key:enemyLocomotionKey(6,'idle',direction),texture:SALT_KING_WALK_TEXTURE,frames:[side?20:base],frameRate:1,repeat:-1},
   {key:enemyLocomotionKey(6,'walk',direction),texture:SALT_KING_WALK_TEXTURE,
    frames:side?PIRATE_GAIT_ORDER.map(i=>21+i):[base+1,base+2,base+3,base+4],frameRate:side?1000/120:8,repeat:-1,
    ...(side?{frameDurations:CAPTAIN_GAIT_DURATIONS}:{})});
 });
 const combat=atlas(SALT_KING_TEXTURE,18);
 SALT_KING_STATES.forEach((state,row)=>{
  const board=read(state,3,2),fit=76/board.subjects[0].region[3];
  board.subjects.forEach((subject,i)=>place(combat,subject,row*6+i,fit,weightedRoot(subject,false),state,board.source));
 });
 for(const target of [walk,combat]){target.texture.refresh();target.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);}
 for(const state of ['walk','side','gait',...SALT_KING_STATES])scene.textures.remove('salt-king-source:'+state);
 return animations;
}
