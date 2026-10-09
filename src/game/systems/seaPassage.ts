import type {Vec2} from '../types';
import {PORT_BY_ID,type Port} from '../../data/ports';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../../data/world';
import type {WorldGenerator} from './WorldGenerator';

const STEP=1024,COLS=Math.floor(WORLD_WIDTH/STEP),ROWS=Math.floor(WORLD_HEIGHT/STEP);
const cell=(x:number,y:number)=>y*COLS+x;
const point=(id:number)=>({x:(id%COLS+.5)*STEP,y:(Math.floor(id/COLS)+.5)*STEP});
/** Conservative sea graph, built lazily once. River/bay approaches are authored
 * channels; ocean routing never takes a straight shortcut through an island. */
export class SeaPassagePlanner {
 private water:Uint8Array|null=null;
 private readonly cache=new Map<string,Vec2[]>();
 constructor(private readonly world:WorldGenerator){}
 route(fromId:string,toId:string):Vec2[]{
  const key=fromId+':'+toId,cached=this.cache.get(key);if(cached)return cached;
  const from=PORT_BY_ID[fromId],to=PORT_BY_ID[toId];if(!from||!to||from===to)return [];
  this.prepare();const a=from.channel.at(-1)!,b=to.channel.at(-1)!;
  const start=this.nearest(a),goal=this.nearest(b);if(start<0||goal<0)return [];
  const open=new Set([start]),came=new Map<number,number>(),cost=new Map([[start,0]]);
  const heuristic=(id:number)=>Math.hypot(id%COLS-goal%COLS,Math.floor(id/COLS)-Math.floor(goal/COLS));
  while(open.size){
   let current=-1,best=Infinity;for(const id of open){const score=cost.get(id)!+heuristic(id);if(score<best){current=id;best=score;}}
   if(current===goal){
    const ids=[goal];while(came.has(ids[0]))ids.unshift(came.get(ids[0])!);
    const ocean=ids.map(point),result=[...from.channel,...ocean,...[...to.channel].reverse()];
    this.cache.set(key,result);this.cache.set(toId+':'+fromId,[...result].reverse());return result;
   }
   open.delete(current);const x=current%COLS,y=Math.floor(current/COLS);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;
    const next=cell(nx,ny);if(!this.water![next])continue;
    const value=cost.get(current)!+1;if(value>=(cost.get(next)??Infinity))continue;
    came.set(next,current);cost.set(next,value);open.add(next);
   }
  }
  return [];
 }
 private prepare(){
  if(this.water)return;this.water=new Uint8Array(COLS*ROWS);
  for(let id=0;id<this.water.length;id++){const p=point(id);
   this.water[id]=[[0,0],[160,0],[-160,0],[0,160],[0,-160]].every(([dx,dy])=>this.world.getTerrainAt(p.x+dx,p.y+dy)==='water')?1:0;
  }
 }
 private nearest(p:Vec2){
  let chosen=-1,best=Infinity;
  for(let id=0;id<this.water!.length;id++)if(this.water![id]){
   const q=point(id),distance=Math.hypot(p.x-q.x,p.y-q.y);if(distance>=best||distance>2500)continue;
   const steps=Math.ceil(distance/48);
   if(Array.from({length:steps+1},(_,i)=>({x:p.x+(q.x-p.x)*i/steps,y:p.y+(q.y-p.y)*i/steps})).every(v=>this.world.getTerrainAt(v.x,v.y)==='water')){chosen=id;best=distance;}
  }
  return chosen;
 }
}
export function passageDuration(points:Vec2[]){
 const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
 return Math.max(18000,Math.min(60000,length/5000*1000));
}
export function passagePoint(points:Vec2[],fraction:number){
 if(fraction<=0)return {...points[0],dx:points[1].x-points[0].x,dy:points[1].y-points[0].y};
 if(fraction>=1){const a=points.at(-2)!,b=points.at(-1)!;return {...b,dx:b.x-a.x,dy:b.y-a.y};}
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);
 let distance=Math.max(0,Math.min(1,fraction))*total;
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],t=lengths[i]?Math.min(1,distance/lengths[i]):0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:b.x-a.x,dy:b.y-a.y};}distance-=lengths[i];}
 return {...points[0],dx:0,dy:1};
}
