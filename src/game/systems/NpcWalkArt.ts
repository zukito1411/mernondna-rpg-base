import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {NPC_WALK_ART,npcWalkTexture,npcWalkPath} from '../../data/npcWalkArt';
import {NPC_IDLE_ART,npcIdleSilhouetteHeight} from '../../data/npcIdleArt';
import type {SpriteAnimation} from '../../data/animationPacks';
import {actorSpriteSubjects} from './spriteComponents';
import {spriteSubjectCanvas} from './spriteArt';

/** Segment complete actors before packing. Transparent gutters isolate linear
 * GPU sampling, while one scale per sheet preserves anatomy across the cycle. */
export function prepareNpcWalkArt(scene:Phaser.Scene):SpriteAnimation[]{
  return NPC_WALK_ART.flatMap(spec=>{
    const sourceKey='npc-walk-source:'+spec.walk;
    const image=scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
    const native=document.createElement('canvas');native.width=image.width;native.height=image.height;
    const read=native.getContext('2d')!;read.drawImage(image,0,0);
    const subjects=actorSpriteSubjects(read.getImageData(0,0,image.width,image.height).data,image.width,image.height,4,3);
    const key=npcWalkTexture(spec.walk)!,sheet=ART_BY_KEY[key],d=sheet.density;
    const idle=NPC_IDLE_ART.find(a=>a.walk===spec.walk)!;
    // Unlike a sword swing, the reference walk carries its gear in the same
    // upright position as idle. Include that gear in BOTH silhouette measures.
    const modelHeight=npcIdleSilhouetteHeight(idle);
    // All frames share the front contact's scale, not a separate stretch per pose.
    const fit=modelHeight/subjects[0].region[3];
    const fw=sheet.frameWidth*d,fh=sheet.frameHeight*d,gutter=4;
    const texture=scene.textures.createCanvas(key,(fw+2*gutter)*4,(fh+2*gutter)*4)!;
    const ctx=texture.getContext();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const clips:SpriteAnimation[]=[];
    ['down','left','right','up'].forEach((direction,row)=>{
      const sourceRow=direction==='up'?2:direction==='down'?0:1,mirror=direction==='left';
      const baselines=subjects.slice(sourceRow*4,sourceRow*4+4).map(s=>s.region[1]+s.region[3]).sort((a,b)=>a-b);
      const rootY=(baselines[1]+baselines[2])/2;
      for(let pose=0;pose<4;pose++){
        const subject=subjects[sourceRow*4+pose],[left,top,width,height]=subject.region;
        const rootX=(pose+.5)*image.width/4;
        const x=sheet.frameWidth/2+(left-rootX)*fit,y=sheet.frameHeight-sheet.groundPadding!+(top-rootY)*fit;
        if(x<2||y<2||x+width*fit>sheet.frameWidth-2||y+height*fit>sheet.frameHeight-1)
          throw new Error(`NPC walk pose exceeds frame: ${spec.walk}/${direction}/${pose}`);
        const frame=row*4+pose,cx=pose*(fw+2*gutter)+gutter,cy=row*(fh+2*gutter)+gutter;
        ctx.save();ctx.translate(cx+(mirror?fw:0),cy);if(mirror)ctx.scale(-1,1);
        ctx.drawImage(spriteSubjectCanvas(subject),x*d,y*d,width*fit*d,height*fit*d);ctx.restore();
        texture.add(frame,0,cx,cy,fw,fh)!.customData={fullSprite:true,isolatedSubject:true,
          sourcePath:npcWalkPath(spec),sourceRegion:subject.region,sourceRoot:{x:rootX,y:rootY},sourceFit:fit,
          sourceMirrored:mirror,visibleBounds:{left:mirror?sheet.frameWidth-x-width*fit:x,top:y,width:width*fit,height:height*fit}};
      }
      clips.push({key:spec.walk+'-'+direction,texture:key,frames:[0,1,2,3].map(i=>row*4+i),frameRate:6,repeat:-1});
    });
    texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    native.width=native.height=1;scene.textures.remove(sourceKey);
    return clips;
  });
}
