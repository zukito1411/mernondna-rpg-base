import type { SpriteRegion } from '../../data/art';
import type {ActorSpriteSubject} from './spriteComponents';

/** Trim a single manifest cell, never merging neighbors or cropping opaque art. */
export function alphaFrameBounds(pixels:Uint8ClampedArray, imageWidth:number, cell:SpriteRegion):SpriteRegion | null {
  const [left,top,width,height] = cell;
  let minX = left + width, minY = top + height, maxX = -1, maxY = -1;
  for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
    if (pixels[(y * imageWidth + x) * 4 + 3] <= 32) continue;
    minX = Math.min(minX,x); minY = Math.min(minY,y); maxX = Math.max(maxX,x); maxY = Math.max(maxY,y);
  }
  return maxX < 0 ? null : [minX,minY,maxX - minX + 1,maxY - minY + 1];
}

/** Filtering a crop directly out of a sheet can sample a neighboring pose.
 * Copy at native size into a reusable, transparently padded surface first. */
export function createSpriteCropper(){
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;
 return (target:CanvasRenderingContext2D,source:CanvasImageSource,region:SpriteRegion,x:number,y:number,width:number,height:number)=>{
  const [sx,sy,sw,sh]=region,pad=2;
  canvas.width=sw+pad*2;canvas.height=sh+pad*2;context.imageSmoothingEnabled=false;
  context.drawImage(source,sx,sy,sw,sh,pad,pad,sw,sh);
  target.drawImage(canvas,pad,pad,sw,sh,x,y,width,height);
 };
}

export function spriteSubjectCanvas(subject:ActorSpriteSubject){
 const canvas=document.createElement('canvas');canvas.width=subject.region[2];canvas.height=subject.region[3];
 const ctx=canvas.getContext('2d')!,data=ctx.createImageData(canvas.width,canvas.height);
 data.data.set(subject.pixels);ctx.putImageData(data,0,0);return canvas;
}
