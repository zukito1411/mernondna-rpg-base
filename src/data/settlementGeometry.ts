import { artFrameSize, type ArtTextureKey } from './art';
import type { Vec2 } from '../game/types';
import {isTreeArt,treeFootprint} from './treeArt';

export interface Rect { left:number; top:number; right:number; bottom:number }
export function overlaps(a:Rect,b:Rect,gap = 0) {
  return a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
}
export function spriteBounds(texture:ArtTextureKey,frame:number,scale:number,x:number,y:number,center = false):Rect {
  const size = artFrameSize(texture,frame), width = size.width * scale, height = size.height * scale;
  const bottom = center ? y + height / 2 : y - 2 * scale;
  return { left:x - width / 2,right:x + width / 2,top:bottom - height,bottom };
}
export function segmentTouchesRect(a:Vec2,b:Vec2,r:Rect) {
  let lo = 0, hi = 1;
  for (const [start,delta,min,max] of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]) {
    if (Math.abs(delta) < .000001) { if (start < min || start > max) return false; continue; }
    const t0 = (min-start)/delta, t1 = (max-start)/delta;
    lo = Math.max(lo,Math.min(t0,t1)); hi = Math.min(hi,Math.max(t0,t1));
    if (lo > hi) return false;
  }
  return true;
}
export function rectTouchesStreet(r:Rect,s:{ width:number; points:Vec2[] },gap = 0) {
  const pad = s.width / 2 + gap;
  const expanded = { left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad };
  return s.points.slice(1).some((p,i) => segmentTouchesRect(s.points[i],p,expanded));
}
export function propFoundation(texture:ArtTextureKey,frame:number,scale:number) {
  const size = artFrameSize(texture,frame);
  if (isTreeArt(texture,frame)) return treeFootprint(texture,frame,scale);
  return { width:size.width * scale * .72,height:Math.min(56,size.height * scale * .25) };
}
export const retiredBoundaryId = (id:string) => /^settlement:(wall|gate|gate-tower):/.test(id);
