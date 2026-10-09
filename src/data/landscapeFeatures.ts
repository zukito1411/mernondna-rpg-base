import {chunkCenter} from './world';
import {ROAD_ROUTES} from './roadRoutes';
import {rectTouchesStreet} from './settlementGeometry';
import {TOWNS} from './towns';
import {insideDefense} from './settlementDefenses';
import type {RegionId,Vec2} from '../game/types';

export interface ScenicLake extends Vec2 {id:string;name:string;region:RegionId;rx:number;ry:number;frozen?:boolean}
const pond=(id:string,name:string,region:RegionId,cx:number,cy:number,rx:number,ry:number,frozen=false):ScenicLake=>
  ({...chunkCenter(cx,cy),id,name,region,rx,ry,frozen});
// Fixed geographic features, not water noise sprinkled across roads. Reserve
// the largest shoreline envelope before admitting a pond into the landscape.
export const SCENIC_LAKES:ScenicLake[]=[
  pond('crown-meadow-pool','Crown Meadow Pool','trandum',26,28,620,420),
  pond('silverleaf-spring','Silverleaf Spring','narenthil',58,12,480,340),
  pond('greenward-pool','Greenward Mirror','narenthil',52,20,400,310),
  pond('rootwater-tarn','Rootwater Tarn','druganwoods',54,59,700,460),
  pond('cliffwater-tarn','Cliffwater Tarn','nardorous',74,31,500,350,true),
  pond('saltmeadow-pool','Saltmeadow Pool','portquill',23,68,360,260),
  pond('bluewatch-tarn','Bluewatch Tarn','frostlands',96,65,650,420,true),
].filter(lake=>{
  const bounds={left:lake.x-lake.rx*1.2,right:lake.x+lake.rx*1.2,top:lake.y-lake.ry*1.2,bottom:lake.y+lake.ry*1.2};
  return !ROAD_ROUTES.some(road=>rectTouchesStreet(bounds,road,220))&&
    !TOWNS.some(town=>[bounds.left,bounds.right,lake.x].some(x=>[bounds.top,bounds.bottom,lake.y].some(y=>insideDefense(town.id,x,y,150))));
});
export function lakeDistance(x:number,y:number,lake:ScenicLake){
  const dx=(x-lake.x)/lake.rx,dy=(y-lake.y)/lake.ry,angle=Math.atan2(dy,dx);
  const edge=1+Math.sin(angle*3+lake.x*.001)*.055+Math.sin(angle*5+lake.y*.001)*.035;
  return (Math.hypot(dx,dy)-edge)*Math.min(lake.rx,lake.ry);
}
export function lakeAt(x:number,y:number){return SCENIC_LAKES.find(lake=>Math.abs(x-lake.x)<lake.rx*1.2&&Math.abs(y-lake.y)<lake.ry*1.2&&lakeDistance(x,y,lake)<0);}
export function lakeShoreDistance(x:number,y:number){return Math.min(Infinity,...SCENIC_LAKES.map(lake=>Math.abs(lakeDistance(x,y,lake))));}
