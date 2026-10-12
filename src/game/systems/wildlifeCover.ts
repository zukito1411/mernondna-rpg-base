import type {Vec2} from '../types';
import {TOWN_BY_ID} from '../../data/towns';

/** Tidewatch includes its inland housing wards, not just the coast-biome strip. */
export function tidewatchGullHabitat(point:Vec2,region:string){
  const town=TOWN_BY_ID.tidewatch.world;
  return region==='portquill'&&Math.hypot(point.x-town.x,point.y-town.y)<4500;
}

export interface WildlifeCover extends Vec2 {
  id:number;
  width:number;
  height:number;
  depth:number;
  kind:'tree'|'shrub'|'shore'|'roof';
  climbable:boolean;
  perch?:Vec2;
  shoreFeed?:Vec2;
  cooldownUntil:number;
  groundRetryAt?:number;
  birdRetryAt?:number;
}

/** Loaded scenery only. Proximity checks visit bounded nearby cell ranges,
 * never scanning the complete streamed forest or persistent world content. */
export class WildlifeCoverIndex {
  private readonly cells=new Map<string,Set<WildlifeCover>>();
  private readonly covers=new Map<number,WildlifeCover>();
  private key(x:number,y:number){return `${Math.floor(x/512)}:${Math.floor(y/512)}`;}
  add(cover:WildlifeCover){
    this.remove(cover.id);
    this.covers.set(cover.id,cover);
    const key=this.key(cover.x,cover.y),cell=this.cells.get(key)??new Set<WildlifeCover>();
    cell.add(cover);this.cells.set(key,cell);
  }
  remove(id:number){
    const cover=this.covers.get(id);if(!cover)return;
    const key=this.key(cover.x,cover.y),cell=this.cells.get(key);
    cell?.delete(cover);if(!cell?.size)this.cells.delete(key);
    this.covers.delete(id);
  }
  has(id:number){return this.covers.has(id);}
  nearby(point:Vec2,radius:number){
    const result:WildlifeCover[]=[];
    for(let y=Math.floor((point.y-radius)/512);y<=Math.floor((point.y+radius)/512);y++)
      for(let x=Math.floor((point.x-radius)/512);x<=Math.floor((point.x+radius)/512);x++)
        for(const cover of this.cells.get(`${x}:${y}`)??[])
          if(Math.hypot(cover.x-point.x,cover.y-point.y)<=radius)result.push(cover);
    return result;
  }
  clear(){this.cells.clear();this.covers.clear();}
}

/** Entry/exit points lie beside the root contour, under the outer foliage.
 * Four candidates allow the caller to reject roots, banks and foundations. */
export function coverPorts(cover:WildlifeCover):Vec2[]{
  const side=cover.width*.38+8;
  return [-1,1].flatMap(sign=>[.18,.28].map(height=>({
    x:cover.x+sign*side,y:cover.y-cover.height*height,
  })));
}

export function rabbitHabitat(region:string,biome:string,terrain:string){
  return ['trandum','narenthil','druganwoods','rindass','portquill'].includes(region)
    && ['forest','meadow'].includes(biome)
    && ['grass','forest','dirt'].includes(terrain);
}

export function squirrelHabitat(region:string,biome:string,terrain:string){
  return ['trandum','narenthil','druganwoods'].includes(region)&&['forest','meadow','highland'].includes(biome)
    && ['grass','forest','dirt'].includes(terrain);
}

export function woodlandBirdHabitat(region:string,biome:string,terrain:string){
  return ['trandum','narenthil','druganwoods'].includes(region)
    && ['forest','meadow','highland','wetland'].includes(biome)&&['grass','forest','dirt','stone','sand'].includes(terrain);
}

/** Approach the front of the roots via the same side as the checked port.
 * Only the later, visual climb enters the trunk; ground routes never do. */
export function squirrelGroundRoute(from:Vec2,port:Vec2,tree:WildlifeCover):Vec2[]{
  const side=port.x<tree.x?-1:1,outerX=tree.x+side*(tree.width*.6+18);
  return [from,port,{x:outerX,y:port.y},{x:outerX,y:tree.y+22},{x:tree.x,y:tree.y+22}];
}
