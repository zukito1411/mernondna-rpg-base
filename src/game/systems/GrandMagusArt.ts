import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {GRAND_MAGUS_SPELL_TEXTURE,type M14ArtSpec} from '../../data/m14Art';
import {actorSpriteGridSubjects,type ActorSpriteSubject} from './spriteComponents';
import {spriteSubjectCanvas} from './spriteArt';
import {isolateAtlasFrames} from './AtlasFrameIsolation';
import type {Enemy} from '../entities/Enemy';

/** Full authored poses, registered once on demand. One shared body scale for
 * all directions and actions; bat dispersal has its own expanding silhouette. */
export function prepareGrandMagusArt(scene:Phaser.Scene,spec:M14ArtSpec){
  const poses:Record<string,ActorSpriteSubject[]>={};
  const scratch=document.createElement('canvas'),read=scratch.getContext('2d',{willReadFrequently:true})!;
  for(const kind of ['down','side','up','dissolve','bat','spells']){
    const source=scene.textures.get(`m14-source:${spec.id}:${kind}`).getSourceImage() as HTMLImageElement;
    scratch.width=source.width;scratch.height=source.height;read.drawImage(source,0,0);
    poses[kind]=actorSpriteGridSubjects(read.getImageData(0,0,source.width,source.height).data,source.width,source.height,
      kind==='bat'?4:kind==='spells'?2:3,kind==='bat'?1:2,{keepDetachedDetails:true});
  }
  const sheet=ART_BY_KEY[spec.texture],fw=sheet.frameWidth,fh=sheet.frameHeight,columns=sheet.atlasColumns!;
  const texture=scene.textures.createCanvas(spec.texture,columns*fw,Math.ceil(sheet.columns/columns)*fh)!;
  const context=texture.getContext();context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  const bodies=[...poses.down,...poses.side,...poses.up];
  const natural=spec.height/((poses.down[0].region[3]+poses.side[0].region[3]+poses.up[0].region[3])/3);
  const fit=Math.min(natural,...bodies.map(p=>Math.min((fw-24)/p.region[2],(fh-28)/p.region[3])));
  const put=(pose:ActorSpriteSubject,frame:number,scale=fit,mirror=false,bat=false,hand?:readonly [number,number])=>{
    const [,,w,h]=pose.region,x=frame%columns*fw,y=Math.floor(frame/columns)*fh;
    const left=(fw-w*scale)/2,top=bat?(fh-h*scale)/2:fh-14-h*scale;
    const source=spriteSubjectCanvas(pose);
    context.save();context.translate(x+(mirror?fw:0),y);if(mirror)context.scale(-1,1);
    context.drawImage(source,left,top,w*scale,h*scale);context.restore();
    const handX=hand?left+(hand[0]-pose.region[0])*scale:0;
    texture.add(frame,0,x,y,fw,fh)!.customData={fullSprite:true,isolatedSubject:true,sourceRegion:pose.region,sourceFit:scale,
      ...(hand?{castOrigin:{x:mirror?fw-handX:handX,y:top+(hand[1]-pose.region[1])*scale}}:{}),
      visibleBounds:{left,top,width:w*scale,height:h*scale}};
  };
  for(const [row,kind] of ['down','side','side','up'].entries()){
    const mirror=row===1,source=poses[kind];
    [0,1,0,1,0].forEach((pose,i)=>put(source[pose],row*5+i,fit,mirror));
    [4,5,0,0,0,0].forEach((pose,i)=>put(source[pose],20+row*6+i,fit,mirror));
    // Measured palms in the versioned 1536x1024 source boards. Register each
    // authored preparation/release separately; rear casting uses the left hand.
    const hands=kind==='up'?[[1166,120],[111,627]] as const:kind==='side'?[[1394,150],[448,647]] as const:
      [[1365,98],[433,625]] as const;
    put(source[2],44+row*2,fit,mirror,false,hands[0]);put(source[3],45+row*2,fit,mirror,false,hands[1]);
  }
  const dissolveFit=Math.min(fit,...poses.dissolve.map(p=>Math.min((fw-24)/p.region[2],(fh-28)/p.region[3])));
  poses.dissolve.forEach((pose,i)=>put(pose,52+i,dissolveFit));
  const batFit=22/Math.max(...poses.bat.map(p=>Math.max(p.region[2],p.region[3])));
  poses.bat.forEach((pose,i)=>put(pose,58+i,batFit,false,true));
  // Bats need only their occupied centre, not a full boss-sized transparent
  // quad. Keep their authored size while avoiding oversized doubled quads.
  for(let i=58;i<=61;i++){const frame=texture.get(i);frame.setSize(32,32,frame.cutX+(fw-32)/2,frame.cutY+(fh-32)/2);}
  // Keep effects in a tiny owned companion atlas: adding four full boss cells
  // would grow the isolated body atlas beyond 2048px on older Android GPUs.
  const spells=scene.textures.createCanvas(GRAND_MAGUS_SPELL_TEXTURE,256,256)!;
  poses.spells.forEach((pose,i)=>{
    const [,,w,h]=pose.region,scale=104/Math.max(w,h),x=i%2*128,y=Math.floor(i/2)*128;
    spells.getContext().drawImage(spriteSubjectCanvas(pose),x+(128-w*scale)/2,y+(128-h*scale)/2,w*scale,h*scale);
    spells.add(i,0,x,y,128,128);
  });
  spells.refresh();spells.setFilter(Phaser.Textures.FilterMode.NEAREST);isolateAtlasFrames(spells);
  scratch.width=0;scratch.height=0;texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);isolateAtlasFrames(texture);
}

/** Owned by the active dungeon, including all timers and escaping bats. */
export function grandMagusFarewell(scene:Phaser.Scene,enemy:Enemy,finished:()=>void){
  const x=enemy.x,y=enemy.y,depth=enemy.depth,scale=enemy.scaleX,origin=enemy.originY;
  const visible=enemy.frame.customData as {visibleBounds?:{height:number}};
  const height=(visible.visibleBounds?.height??112)*scale;
  let active=true;const sprites:Phaser.GameObjects.Sprite[]=[],timers:Phaser.Time.TimerEvent[]=[];
  const destroy=()=>{if(!active)return;active=false;for(const timer of timers)timer.remove(false);
    for(const sprite of sprites){scene.tweens.killTweensOf(sprite);sprite.destroy();}};
  sprites.push(scene.add.sprite(x,y,'enemy_grand_magus',52).setOrigin(.5,origin).setScale(scale).setDepth(depth).play('enemy:19:death'));
  timers.push(scene.time.delayedCall(450,()=>{
    if(!active)return;
    for(let i=0;i<12;i++){
      const angle=-Math.PI*.9+i/11*Math.PI*.8,distance=260+i%4*45;
      const bat=scene.add.sprite(x+(i%3-1)*height*.08,y-height*.45-i%4*10,'enemy_grand_magus',58)
        .setDepth(depth+2).setScale(scale).play('grand-magus:bats');sprites.push(bat);
      scene.tweens.add({targets:bat,x:x+Math.cos(angle)*distance,y:y+Math.sin(angle)*distance-70,alpha:0,
        duration:1100+i%4*100,ease:'Sine.easeIn',onComplete:()=>bat.destroy()});
    }
  }));
  timers.push(scene.time.delayedCall(1900,()=>{if(!active)return;destroy();finished();}));
  return {get active(){return active;},destroy};
}
