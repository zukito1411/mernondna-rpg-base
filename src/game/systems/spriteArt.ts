import type { SpriteRegion } from '../../data/art';

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
