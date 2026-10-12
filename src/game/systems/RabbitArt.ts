import Phaser from 'phaser';
import type {SpriteRegion} from '../../data/art';
import {alphaFrameBounds,createSpriteCropper} from './spriteArt';

export const RABBIT_TEXTURE='wildlife-rabbit';
export const RABBIT_SOURCE='wildlife-rabbit-source';
export const RABBIT_PATH='assets/wildlife/rabbit/poses.png';
export const RABBIT_CELL=96;
export const RABBIT_FOOT=86;
export const RABBIT_HEIGHT=26;

// Authored source rectangles, not assumed equal cells. The fully extended
// east hop extends past its nominal cell; preserve its complete legs/tail
// without admitting pixels from the adjacent rabbit. All poses use one fit.
const REGIONS:readonly SpriteRegion[]=[
  [8,70,248,267],[260,120,252,220],[516,110,248,230],
  [766,65,295,280],[1063,115,236,231],[1300,80,236,267],
  [30,376,199,271],[274,387,219,259],[550,373,180,273],
  [808,375,186,272],[1064,383,191,266],[1324,390,202,260],
  [37,677,193,299],[277,682,217,294],[545,677,204,299],
  [795,672,213,304],[1062,677,212,299],[1320,682,207,294],
];

/** Decode/crop once at boot; only this 576x288 atlas stays on the GPU.
 * Preserve source-space ground registration and hop lift across poses;
 * alpha trimming never independently rescales or grounds an airborne frame. */
export function prepareRabbitArt(scene:Phaser.Scene){
  if(scene.textures.exists(RABBIT_TEXTURE)){scene.textures.remove(RABBIT_SOURCE);return;}
  const source=scene.textures.get(RABBIT_SOURCE).getSourceImage() as HTMLImageElement;
  if(source.width!==1536||source.height!==1024)throw new Error('Rabbit source dimensions changed; update RabbitArt regions.');
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const bounds=REGIONS.map((region,i)=>{
    const bound=alphaFrameBounds(pixels,canvas.width,region);
    if(!bound)throw new Error(`Empty rabbit pose ${i}`);
    return bound;
  });
  const baseline=[0,6,12].map(i=>bounds[i][1]+bounds[i][3]);
  let fit=Infinity;
  for(let i=0;i<bounds.length;i++){
    const [x,y,w,h]=bounds[i],center=(i%6+.5)*256,ground=baseline[Math.floor(i/6)];
    fit=Math.min(fit,44/Math.max(center-x,x+w-center),82/Math.max(1,ground-y),
      7/Math.max(1,y+h-ground));
  }
  const texture=scene.textures.createCanvas(RABBIT_TEXTURE,RABBIT_CELL*6,RABBIT_CELL*3)!;
  const target=texture.getContext(),crop=createSpriteCropper();target.imageSmoothingEnabled=true;
  for(let i=0;i<bounds.length;i++){
    const [x,y,w,h]=bounds[i],cellX=i%6*RABBIT_CELL,cellY=Math.floor(i/6)*RABBIT_CELL;
    const drawX=cellX+RABBIT_CELL/2+(x-(i%6+.5)*256)*fit;
    const drawY=cellY+RABBIT_FOOT+(y-baseline[Math.floor(i/6)])*fit;
    crop(target,source,bounds[i],drawX,drawY,w*fit,h*fit);
    const frame=texture.add(i,0,cellX,cellY,RABBIT_CELL,RABBIT_CELL);
    if(frame)frame.customData={visibleBounds:{left:drawX-cellX,top:drawY-cellY,width:w*fit,height:h*fit}};
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  scene.registry.set('rabbitVisibleHeight',bounds[0][3]*fit);
  scene.textures.remove(RABBIT_SOURCE);
}
