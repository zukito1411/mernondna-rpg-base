import {chunkCenter} from './world';
import {TOWN_BY_ID} from './towns';
import type {Vec2} from '../game/types';
const local=(id:string,x:number,y:number):Vec2=>({x:TOWN_BY_ID[id].world.x+x,y:TOWN_BY_ID[id].world.y+y});
const chunks=(points:number[][])=>points.map(([x,y])=>chunkCenter(x,y));
export const DRAINAGE=[
  {id:'crown-river',width:168,points:[...chunks([[46,12],[39,15]]),...[[1050,-6500],[760,-4000],[560,-1800],[430,-800],[420,0],[540,1000],[950,3300],[1500,6500]].map(([x,y])=>local('highmere',x,y)),...chunks([[30,30],[24,35],[16,38],[2,40]])]},
  {id:'willow-tributary',width:120,points:[...chunks([[50,12],[45,17]]),...[[900,-5500],[700,-2600],[600,-1150],[600,1150],[700,2600],[1000,5500]].map(([x,y])=>local('willowcross',x,y)),...chunks([[38,31],[38,34],[34,34],[24,35]])]},
  {id:'rootwater',width:144,points:[...chunks([[65,48],[62,54]]),...[[750,-5500],[550,-2600],[450,-1450],[450,1450],[550,2600],[850,5500]].map(([x,y])=>local('deepford',x,y)),...chunks([[58,70],[55,80]])]},
  // Mountain meltwater and woodland springs join existing headwaters. Roads
  // survey these same paths and insert correctly oriented physical crossings.
  {id:'silverleaf-brook',width:72,points:chunks([[54,7],[53,10],[52,11],[50,12]])},
  {id:'skywater',width:88,points:chunks([[75,17],[70,18],[63,14],[56,12],[50,12]])},
];
export const RIDGES=chunks([[61,15],[68,18],[75,23],[81,30],[83,38],[80,44]]);
export const WOODLAND_UPLANDS=chunks([[49,52],[52,56],[54,59],[55,64]]);
export const CROWN_DOWNS=chunks([[20,17],[23,18],[25,20]]);
export const LAVA_FLOW=[local('blackspire',6500,-6500),local('blackspire',7200,-2000),local('blackspire',9800,3000),local('blackspire',12000,6500)];
export function pathDistance(x:number,y:number,points:Vec2[],limit=12000){
  let best=Infinity;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];
    if(x<Math.min(a.x,b.x)-limit||x>Math.max(a.x,b.x)+limit||y<Math.min(a.y,b.y)-limit||y>Math.max(a.y,b.y)+limit)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len)):0;
    best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
  }return best;
}
export function drainageDistance(x:number,y:number){return Math.min(...DRAINAGE.map(r=>pathDistance(x,y,r.points,900)-r.width/2));}
export function onHeadwaterStream(x:number,y:number){return DRAINAGE.slice(3).some(r=>pathDistance(x,y,r.points,700)<=r.width/2);}
export function harborBay(x:number,y:number){return ['tidewatch','skallheim'].some(id=>{const town=TOWN_BY_ID[id].world,dy=y-town.y;
  return dy>900&&dy<40000&&Math.abs(x-town.x)<1400+(dy-900)*.32;});}
export function harborShoreDistance(x:number,y:number){return Math.min(...['tidewatch','skallheim'].map(id=>{const town=TOWN_BY_ID[id].world,dy=y-town.y,dx=Math.abs(x-town.x);
  if(dy<300||dy>40000)return Infinity;return dy>=900?Math.abs(dx-(1400+(dy-900)*.32)):dx<1400?900-dy:Infinity;}));}
