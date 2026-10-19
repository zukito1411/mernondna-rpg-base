import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {GOBLIN_ART,GOBLIN_TEXTURE} from '../../data/goblinArt';
import {actorSpriteSubjects,type ActorSpriteSubject} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';
import {fitAtlasPoses} from './atlasPoseFit';

/** Whole poses only. Fixed neutral-calibrated scale across each source row;
 * mirror complete right-facing poses, never reconstruct separate limbs. */
export function prepareGoblinArt(scene:Phaser.Scene){
  const subjects={} as Record<keyof typeof GOBLIN_ART,ActorSpriteSubject[]>;
  const canvas=document.createElement('canvas'),read=canvas.getContext('2d',{willReadFrequently:true})!;
  for(const [kind,art] of Object.entries(GOBLIN_ART)){
    const source=scene.textures.get('goblin-source:'+kind).getSourceImage() as HTMLImageElement;
    canvas.width=source.width;canvas.height=source.height;read.drawImage(source,0,0);
    subjects[kind as keyof typeof GOBLIN_ART]=actorSpriteSubjects(read.getImageData(0,0,source.width,source.height).data,source.width,source.height,art.columns,art.rows);
  }
  const sheet=ART_BY_KEY[GOBLIN_TEXTURE],columns=sheet.atlasColumns!,fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density;
  const texture=scene.textures.createCanvas(GOBLIN_TEXTURE,columns*fw,Math.ceil(sheet.columns/columns)*fh)!;
  const ctx=texture.getContext(),crop=createSpriteCropper();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const draw=(subject:ActorSpriteSubject,fit:number,frame:number,mirror:boolean,falling=false)=>{
    const [, ,w,h]=subject.region;
    // Standing registration follows the hood/torso, not a reaching dagger.
    let sum=0,weight=0;
    if(!falling)for(let y=0;y<Math.floor(h*.25);y++)for(let x=0;x<w;x++){
      const alpha=subject.pixels[(y*w+x)*4+3];if(alpha>128){sum+=x*alpha;weight+=alpha;}
    }
    const root=weight?sum/weight:w/2;
    const safeFit=fitAtlasPoses(fit,sheet.frameWidth,sheet.frameHeight,sheet.frameHeight-sheet.groundPadding!,
      [{region:subject.region,rootX:subject.region[0]+root,rootY:subject.region[1]+h}]);
    const left=sheet.frameWidth/2-root*safeFit,top=sheet.frameHeight-sheet.groundPadding!-h*safeFit;
    const x=frame%columns*fw,y=Math.floor(frame/columns)*fh;
    ctx.save();if(mirror){ctx.translate(x+fw,y);ctx.scale(-1,1);}
    crop(ctx,spriteSubjectCanvas(subject),[0,0,w,h],(mirror?0:x)+left*sheet.density,(mirror?0:y)+top*sheet.density,w*safeFit*sheet.density,h*safeFit*sheet.density);ctx.restore();
    texture.add(frame,0,x,y,fw,fh)!.customData={fullSprite:true,isolatedSubject:true,sourceRegion:subject.region,sourceFit:safeFit,sourceMirrored:mirror,
      visibleBounds:{left:mirror?sheet.frameWidth-left-w*safeFit:left,top,width:w*safeFit,height:h*safeFit}};
  };
  for(const [row,sourceRow] of [0,1,1,2].entries()){
    const mirror=row===1,walk=sourceRow*5,action=sourceRow*6;
    const walkFit=64/subjects.walk[walk].region[3];
    for(let pose=0;pose<5;pose++){
      let subject=subjects.walk[walk+pose],fit=walkFit;
      if(row===0){
        if(pose===1||pose===3){subject=subjects.complete[pose===1?0:1];fit=64/((subjects.complete[0].region[3]+subjects.complete[1].region[3])/2);}
        else if(pose===2||pose===4)subject=subjects.walk[pose===2?1:3];
      }
      draw(subject,fit,row*5+pose,mirror);
    }
    const actionFit=64/subjects.actions[action+2].region[3];
    for(let pose=0;pose<6;pose++){
      // The original back-facing fallen pose touches the board edge. Replace
      // it with a separately generated complete pose, never crop a lost boot.
      const replacement=row===3&&pose===5;
      const subject=replacement?subjects.complete[2]:subjects.actions[action+pose];
      const fit=replacement?64/((subjects.complete[0].region[3]+subjects.complete[1].region[3])/2):actionFit;
      draw(subject,fit,20+row*6+pose,mirror,pose>=4);
    }
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for(const kind of Object.keys(GOBLIN_ART))scene.textures.remove('goblin-source:'+kind);
}
