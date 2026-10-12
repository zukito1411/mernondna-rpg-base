import Phaser from 'phaser';
import type {SpriteRegion} from '../../data/art';
import {alphaFrameBounds,createSpriteCropper} from './spriteArt';

export const SQUIRREL_TEXTURE='wildlife-squirrel';
export const SQUIRREL_SOURCE='wildlife-squirrel-source';
export const SQUIRREL_PATH='assets/wildlife/squirrel/poses.png';
export const SQUIRREL_CELL=128;
export const SQUIRREL_FOOT=90;
export const SQUIRREL_HEIGHT=32;

// The board has unequal row spacing and an extended side stride. Explicit
// rectangles isolate whole poses, never cutting at an assumed grid boundary.
const REGIONS:readonly SpriteRegion[]=[
  [12,18,242,234],[267,44,239,210],[515,28,253,225],
  [769,17,280,238],[1050,41,243,213],[1300,36,233,218],
  [50,255,164,249],[314,254,160,251],[553,254,170,253],
  [808,251,171,253],[1061,251,178,255],[1320,251,178,255],
  [24,510,230,194],[267,510,233,194],[516,510,236,194],
  [771,510,237,194],[1028,510,229,194],[1293,510,226,194],
  [59,705,169,300],[315,706,180,299],[566,703,164,301],
  [820,709,188,293],[1070,713,191,288],[1340,698,161,292],
];
// Climbing anchors are rear-paw contacts, NOT the dangling tail's alpha bottom.
// A shared body fit across all states prevents a stretched climb pose shrinking.
const CLIMB_CONTACT_Y=[883,912,909,908,882,886] as const;

/** One preparation/upload at boot, then a compact 768x512 resident atlas.
 * No per-animal cropping, independent pose resizing or stitched body parts. */
export function prepareSquirrelArt(scene:Phaser.Scene){
  if(scene.textures.exists(SQUIRREL_TEXTURE)){scene.textures.remove(SQUIRREL_SOURCE);return;}
  const source=scene.textures.get(SQUIRREL_SOURCE).getSourceImage() as HTMLImageElement;
  if(source.width!==1536||source.height!==1024)throw new Error('Squirrel source dimensions changed; update SquirrelArt regions.');
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const bounds=REGIONS.map((region,i)=>{
    const bound=alphaFrameBounds(pixels,canvas.width,region);
    if(!bound)throw new Error(`Empty squirrel pose ${i}`);
    return bound;
  });
  const baseline=[0,6,12].map(i=>bounds[i][1]+bounds[i][3]);
  const contacts=bounds.map((_,i)=>i<18?baseline[Math.floor(i/6)]:CLIMB_CONTACT_Y[i-18]);
  let fit=Infinity;
  for(let i=0;i<bounds.length;i++){
    const [x,y,w,h]=bounds[i],center=(i%6+.5)*256,contact=contacts[i];
    fit=Math.min(fit,60/Math.max(center-x,x+w-center),86/Math.max(1,contact-y),
      34/Math.max(1,y+h-contact));
  }
  const texture=scene.textures.createCanvas(SQUIRREL_TEXTURE,SQUIRREL_CELL*6,SQUIRREL_CELL*4)!;
  const target=texture.getContext(),crop=createSpriteCropper();target.imageSmoothingEnabled=true;
  for(let i=0;i<bounds.length;i++){
    const [x,y,w,h]=bounds[i],cellX=i%6*SQUIRREL_CELL,cellY=Math.floor(i/6)*SQUIRREL_CELL;
    const drawX=cellX+SQUIRREL_CELL/2+(x-(i%6+.5)*256)*fit;
    const drawY=cellY+SQUIRREL_FOOT+(y-contacts[i])*fit;
    crop(target,source,bounds[i],drawX,drawY,w*fit,h*fit);
    const frame=texture.add(i,0,cellX,cellY,SQUIRREL_CELL,SQUIRREL_CELL);
    if(frame)frame.customData={visibleBounds:{left:drawX-cellX,top:drawY-cellY,width:w*fit,height:h*fit}};
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  scene.registry.set('squirrelVisibleHeight',bounds[0][3]*fit);
  scene.textures.remove(SQUIRREL_SOURCE);
}
