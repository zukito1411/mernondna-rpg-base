import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {PIRATE_TEXTURE,PIRATE_SPECIES,PIRATE_PATH,PIRATE_SIDE_PATH,PIRATE_GAIT_PATH} from '../../data/pirateArt';
import {PIRATE_GAIT_ORDER,CREW_GAIT_DURATIONS} from '../../data/pirateMotion';
import {ACTOR_DIRECTIONS,enemyLocomotionKey} from '../../data/directionalEnemyArt';
import type {SpriteAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

/** Isolated complete poses; a fixed neutral-body calibration per facing keeps
 * swords, recoil and fallen bodies from rescaling the character. */
export function preparePirateArt(scene:Phaser.Scene):SpriteAnimation[]{
  const source=scene.textures.get('pirate-source').getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const read=canvas.getContext('2d',{willReadFrequently:true})!;read.drawImage(source,0,0);
  const subjects=actorSpriteSubjects(read.getImageData(0,0,source.width,source.height).data,source.width,source.height,6,7);
  const sideSource=scene.textures.get('pirate-side-source').getSourceImage() as HTMLImageElement;
  canvas.width=sideSource.width;canvas.height=sideSource.height;read.drawImage(sideSource,0,0);
  const sideSubjects=actorSpriteSubjects(read.getImageData(0,0,sideSource.width,sideSource.height).data,sideSource.width,sideSource.height,3,3);
  const gaitSource=scene.textures.get('pirate-gait-source').getSourceImage() as HTMLImageElement;
  canvas.width=gaitSource.width;canvas.height=gaitSource.height;read.drawImage(gaitSource,0,0);
  const gaitSubjects=actorSpriteSubjects(read.getImageData(0,0,gaitSource.width,gaitSource.height).data,gaitSource.width,gaitSource.height,2,3);
  canvas.width=canvas.height=1;
  const sheet=ART_BY_KEY[PIRATE_TEXTURE],fw=sheet.frameWidth*2,fh=sheet.frameHeight*2;
  const texture=scene.textures.createCanvas(PIRATE_TEXTURE,fw*6,fh*9)!,ctx=texture.getContext(),draw=createSpriteCropper();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(const [i,subject] of [...subjects,sideSubjects[0],...gaitSubjects].entries()){
    const row=Math.floor(i/6),side=i===42,gait=i>=43;
    const neutral=gait?gaitSubjects[0]:side?sideSubjects[0]:subjects[row<4?row*6:12];
    const fit=76/neutral.region[3],[rx,,w,h]=subject.region;
    // Head-centered walking; foot-centered sword combat preserves hand reach.
    let weighted=0,total=0;
    const head=side||gait||row<4;
    for(let y=head?0:Math.floor(h*.85);y<(head?Math.ceil(h*.2):h);y++)for(let x=0;x<w;x++){
      const a=subject.pixels[(y*w+x)*4+3];if(a>128){weighted+=(rx+x)*a;total+=a;}
    }
    const root=total?weighted/total:rx+w/2;
    const left=sheet.frameWidth/2+(rx-root)*fit,top=sheet.frameHeight-2-h*fit;
    if(left<2||top<2||left+w*fit>sheet.frameWidth-2)throw new Error('Pirate pose exceeds atlas cell: '+i);
    const x=i%6*fw,y=Math.floor(i/6)*fh;
    draw(ctx,spriteSubjectCanvas(subject),[0,0,w,h],x+left*2,y+top*2,w*fit*2,h*fit*2);
    texture.add(i,0,x,y,fw,fh)!.customData={fullSprite:true,isolatedSubject:true,sourceRegion:subject.region,
      sourcePath:gait?PIRATE_GAIT_PATH:side?PIRATE_SIDE_PATH:PIRATE_PATH,
      sourceFit:fit,foreignProbes:subject.foreignProbes,visibleBounds:{left,top,width:w*fit,height:h*fit}};
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.textures.remove('pirate-source');scene.textures.remove('pirate-side-source');scene.textures.remove('pirate-gait-source');
  const animations:SpriteAnimation[]=ACTOR_DIRECTIONS.flatMap((direction,row)=>{
    const side=direction==='left'||direction==='right';
    // Vertical rows keep the neutral endpoints for idle out of the walk loop.
    const base=side?42:row*6;
    return [
    {key:enemyLocomotionKey(PIRATE_SPECIES,'idle',direction),texture:PIRATE_TEXTURE,frames:[base],frameRate:1,repeat:-1},
    {key:enemyLocomotionKey(PIRATE_SPECIES,'walk',direction),texture:PIRATE_TEXTURE,
      frames:side?PIRATE_GAIT_ORDER.map(i=>43+i):[base+1,base+2,base+3,base+4],
      frameRate:side?1000/(560/6):9,repeat:-1,
      ...(side?{frameDurations:CREW_GAIT_DURATIONS}:{})},
  ];});
  return animations;
}
