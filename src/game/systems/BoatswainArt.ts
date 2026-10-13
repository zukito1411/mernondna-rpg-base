import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {BOATSWAIN_ART,BOATSWAIN_GAIT_ART,BOATSWAIN_SIDE_GAIT,BOATSWAIN_DOWN_PASSING,BOATSWAIN_UP_GAIT,BOATSWAIN_ATTACK_FEET,BOATSWAIN_TEXTURE} from '../../data/boatswainArt';
import {actorSpriteSubjects,type ActorSpriteSubject} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

/** Calibrate complete poses by their standing body, never by mallet reach.
 * Connected-subject isolation preserves boots crossing approximate row seams. */
export function prepareBoatswainArt(scene:Phaser.Scene){
  const sheet=ART_BY_KEY[BOATSWAIN_TEXTURE],columns=sheet.atlasColumns!,fw=sheet.frameWidth*sheet.density,fh=sheet.frameHeight*sheet.density;
  const texture=scene.textures.createCanvas(BOATSWAIN_TEXTURE,columns*fw,Math.ceil(sheet.columns/columns)*fh)!;
  const ctx=texture.getContext(),draw=createSpriteCropper();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const canvas=document.createElement('canvas'),read=canvas.getContext('2d',{willReadFrequently:true})!;
  const drawSubject=(subject:ActorSpriteSubject,fit:number,foot:number,frame:number,path:string,falling=false,mirror=false)=>{
    const [rx,ry,w,h]=subject.region;
    const root=falling?rx+w/2:scarfRoot(subject,foot,76/fit);
    const left=sheet.frameWidth/2+(rx-root)*fit;
    const top=sheet.frameHeight-(sheet.groundPadding??2)+(ry-foot)*fit;
    if(left<2||top<2||left+w*fit>sheet.frameWidth-2||top+h*fit>sheet.frameHeight-1)
      throw new Error(`Complete boatswain pose needs more atlas room: ${path}/${frame}`);
    const x=frame%columns*fw,y=Math.floor(frame/columns)*fh;
    ctx.save();
    if(mirror){ctx.translate(x+fw,y);ctx.scale(-1,1);}
    draw(ctx,spriteSubjectCanvas(subject),[0,0,w,h],(mirror?0:x)+left*sheet.density,(mirror?0:y)+top*sheet.density,w*fit*sheet.density,h*fit*sheet.density);
    ctx.restore();
    texture.add(frame,0,x,y,fw,fh)!.customData={fullSprite:true,isolatedSubject:true,sourcePath:path,sourceRegion:subject.region,
      sourceFit:fit,sourceMirrored:mirror,
      foreignProbes:mirror?subject.foreignProbes.map(([px,py])=>[w-1-px,py] as const):subject.foreignProbes,
      visibleBounds:{left:mirror?sheet.frameWidth-left-w*fit:left,top,width:w*fit,height:h*fit}};
  };
  for(const [kind,art] of Object.entries(BOATSWAIN_ART)){
    const source=scene.textures.get('boatswain-source:'+kind).getSourceImage() as HTMLImageElement;
    canvas.width=source.width;canvas.height=source.height;read.drawImage(source,0,0);
    const subjects=actorSpriteSubjects(read.getImageData(0,0,source.width,source.height).data,source.width,source.height,art.columns,art.rows);
    subjects.forEach((subject,index)=>{
      const row=Math.floor(index/art.columns),pose=index%art.columns;
      // Keep the old neutral profiles and real down contacts. The weak old
      // stride poses are never used by the new locomotion clips. Slots 5/6
      // remain populated only for atlas compatibility, not for playback.
      if(kind==='walk'&&pose>0&&pose<5&&!(row===0&&pose<=2))return;
      const neutral=subjects[row*art.columns+(kind==='states'?2:0)];
      const foot=kind==='attack'?BOATSWAIN_ATTACK_FEET[row][pose]:subject.region[1]+subject.region[3];
      const neutralFoot=kind==='attack'?BOATSWAIN_ATTACK_FEET[row][0]:neutral.region[1]+neutral.region[3];
      const fit=76/(neutralFoot-neutral.region[1]);
      const falling=kind==='states'&&pose>=3;
      const frame=kind==='walk'&&row===0&&pose===2?3:art.offset+index;
      drawSubject(subject,fit,foot,frame,art.path,falling);
    });
    scene.textures.remove('boatswain-source:'+kind);
  }
  for(const [kind,art] of Object.entries(BOATSWAIN_GAIT_ART)){
    const source=scene.textures.get('boatswain-gait-source:'+kind).getSourceImage() as HTMLImageElement;
    canvas.width=source.width;canvas.height=source.height;read.drawImage(source,0,0);
    const subjects=actorSpriteSubjects(read.getImageData(0,0,source.width,source.height).data,source.width,source.height,art.columns,art.rows);
    if(kind==='side'){
      // One canonical side cycle keeps both facings' anatomy and cadence equal.
      const fit=76/subjects[2].region[3];
      BOATSWAIN_SIDE_GAIT.forEach((pose,step)=>{
        const subject=subjects[pose],foot=subject.region[1]+subject.region[3];
        drawSubject(subject,fit,foot,15+step,art.path);
        drawSubject(subject,fit,foot,8+step,art.path,false,true);
      });
    }else{
      const downFit=76/subjects[2].region[3],upFit=76/subjects[6].region[3];
      BOATSWAIN_DOWN_PASSING.forEach((pose,step)=>{
        const subject=subjects[pose];
        drawSubject(subject,downFit,subject.region[1]+subject.region[3],2+step*2,art.path);
      });
      BOATSWAIN_UP_GAIT.forEach((pose,step)=>{
        const subject=subjects[pose];
        drawSubject(subject,upFit,subject.region[1]+subject.region[3],22+step,art.path);
      });
    }
    scene.textures.remove('boatswain-gait-source:'+kind);
  }
  canvas.width=canvas.height=1;texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** The scarf centers the head independently of the reaching hammer. */
function scarfRoot(subject:ActorSpriteSubject,foot:number,bodyHeight:number){
  const [left,top,width,height]=subject.region;let sum=0,weight=0;
  for(let y=0;y<height;y++){
    if(top+y<foot-bodyHeight*1.12||top+y>foot-bodyHeight*.5)continue;
    for(let x=0;x<width;x++){
      const offset=(y*width+x)*4,r=subject.pixels[offset],g=subject.pixels[offset+1],b=subject.pixels[offset+2],alpha=subject.pixels[offset+3];
      if(alpha>128&&r>50&&r>g*1.5&&r>b*1.25){sum+=(left+x)*alpha;weight+=alpha;}
    }
  }
  return weight?sum/weight:left+width/2;
}
