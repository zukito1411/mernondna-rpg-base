import {ROAD_ROUTES} from '../../data/roadRoutes';
import {TOWN_BY_ID} from '../../data/towns';
import {protectedSettlementAt} from '../../data/settlements';
import type {Vec2} from '../types';
import {seededRandom} from '../../utils/seededRandom';
import {pathLength,routePointAtDistance,type TravelPath} from './travelRoutes';

export interface RoadLifeRoute extends TravelPath {townId:string;destinationId:string;patrol:boolean;clock:number}

/** Full surveyed roads, including their streets and bridge approaches. Patrols
 * cover the gate's exterior approach, never an invented loop through scenery. */
export function roadLifeRoutes():RoadLifeRoute[]{
  const routes:RoadLifeRoute[]=[];
  for(const road of ROAD_ROUTES){
    const length=pathLength(road.points),speed=42,rng=seededRandom('road-life:'+road.id);
    // Only a sparse set of logical journeys is needed. Offscreen travelers have
    // no physics bodies, art or navigation; a region admits at most one visible
    // pair, so dozens of overlapping journey slots per road add no game value.
    const count=Math.min(16,Math.max(1,Math.ceil(length/4800)));
    for(let i=0;i<count;i++)routes.push({id:`travel:${road.id}:${i}`,points:road.points,length,speed,
      phase:(i+rng()*.3)/count*length/speed*1000*2,townId:road.from,destinationId:road.to,patrol:false,clock:0});
    for(const townId of [road.from,road.to]){
      const points=townId===road.from?road.points:[...road.points].reverse();
      const path:TravelPath={id:road.id,points,length,speed:38,phase:0};
      // Find the real settlement boundary along this road, then patrol a
      // substantial stretch outside it. Keep narrow bridges on their centerline.
      let start=0;
      while(start<Math.min(length-1200,14000)){
        const p=routePointAtDistance(path,start);
        if(!protectedSettlementAt(p.x,p.y))break;
        start+=64;
      }
      start+=96;
      const end=Math.min(length-300,start+2600);
      if(end-start<1000)continue;
      let cumulative=0;
      const patrol:Vec2[]=[routePointAtDistance(path,start)];
      for(let i=1;i<points.length;i++){
        cumulative+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
        if(cumulative>start&&cumulative<end)patrol.push(points[i]);
      }
      patrol.push(routePointAtDistance(path,end));
      if(patrol.some(p=>protectedSettlementAt(p.x,p.y)))continue;
      routes.push({id:`patrol:${townId}:${road.id}`,townId,destinationId:townId,patrol:true,points:patrol,
        length:pathLength(patrol),speed:38,phase:rng()*100000,clock:0});
    }
  }
  return routes.filter(r=>Boolean(TOWN_BY_ID[r.townId]));
}

/** Project actual physical feet when unloading, so blocked travel or combat
 * does not make a party jump forward when its renderer returns. */
export function rememberRoadJourney(route:RoadLifeRoute,point:Vec2,direction:number){
  let cumulative=0,best=Infinity,distance=0;
  for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(length*length))):0;
    const gap=Math.hypot(point.x-a.x-dx*t,point.y-a.y-dy*t);
    if(gap<best){best=gap;distance=cumulative+length*t;}
    cumulative+=length;
  }
  const travel=route.length/route.speed*1000;
  route.clock=(direction>0?distance/route.speed*1000:travel+4000+(route.length-distance)/route.speed*1000)-route.phase;
}
