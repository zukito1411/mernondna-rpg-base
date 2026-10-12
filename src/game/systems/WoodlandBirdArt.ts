import Phaser from 'phaser';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

export const BIRD_TEXTURE='wildlife-woodland-bird';
export const BIRD_SOURCE='wildlife-woodland-bird-source';
export const BIRD_PATH='assets/wildlife/woodland-bird/poses.png';
export const BIRD_CELL=128;
export const BIRD_FOOT=90;
export const BIRD_HEIGHT=14;

// Torso centers, not wing/tail bounding-box centers. Opening one wing must
// never yank the bird sideways or shrink its body against a larger alpha box.
const ROOT_X=[188,437,705,946,1194,1430,152,415,655,885,1155,1411,169,405,651,878,1153,1410] as const;

/** Isolate complete subjects before packing: raised wings extend beyond
 * approximate source cells. Existing component extraction preserves them
 * and removes neighboring bird pixels even where crop rectangles overlap. */
export function prepareWoodlandBirdArt(scene:Phaser.Scene){
  prepareBirdAtlas(scene,{texture:BIRD_TEXTURE,source:BIRD_SOURCE,path:BIRD_PATH,
    registry:'woodlandBirdVisibleHeight',roots:ROOT_X});
}

/** Shared preparation only; each bird family retains its own source artwork,
 * authored body roots, fixed calibration and physical presentation size. */
export function prepareBirdAtlas(scene:Phaser.Scene,art:{texture:string;source:string;path:string;registry:string;roots:readonly number[]}){
  if(scene.textures.exists(art.texture)){scene.textures.remove(art.source);return;}
  const source=scene.textures.get(art.source).getSourceImage() as HTMLImageElement;
  if(source.width!==1536||source.height!==1024||art.roots.length!==18)throw new Error(`${art.texture} source registration changed.`);
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const subjects=actorSpriteSubjects(ctx.getImageData(0,0,source.width,source.height).data,source.width,source.height,6,3);
  const baseline=[0,6,12].map(i=>subjects[i].region[1]+subjects[i].region[3]);
  let fit=Infinity;
  subjects.forEach(({region:[x,y,w,h]},i)=>{
    const foot=baseline[Math.floor(i/6)],root=art.roots[i];
    fit=Math.min(fit,60/Math.max(root-x,x+w-root),86/Math.max(1,foot-y),34/Math.max(1,y+h-foot));
  });
  const texture=scene.textures.createCanvas(art.texture,BIRD_CELL*6,BIRD_CELL*3)!;
  const target=texture.getContext(),crop=createSpriteCropper();target.imageSmoothingEnabled=true;
  subjects.forEach((subject,i)=>{
    const [x,y,w,h]=subject.region,cellX=i%6*BIRD_CELL,cellY=Math.floor(i/6)*BIRD_CELL;
    const drawX=cellX+BIRD_CELL/2+(x-art.roots[i])*fit;
    const drawY=cellY+BIRD_FOOT+(y-baseline[Math.floor(i/6)])*fit;
    crop(target,spriteSubjectCanvas(subject),[0,0,w,h],drawX,drawY,w*fit,h*fit);
    const frame=texture.add(i,0,cellX,cellY,BIRD_CELL,BIRD_CELL);
    if(frame)frame.customData={isolatedSubject:true,sourcePath:art.path,sourceRegion:subject.region,sourceRoot:art.roots[i],sourceFit:fit,
      visibleBounds:{left:drawX-cellX,top:drawY-cellY,width:w*fit,height:h*fit}};
  });
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  scene.registry.set(art.registry,subjects[0].region[3]*fit);
  scene.textures.remove(art.source);
}
