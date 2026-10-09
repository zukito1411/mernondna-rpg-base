import {describe,it,expect} from 'vitest';
import {cartRoutes,seaRoute,routePosition,isSailingWater,type TrafficRoute} from '../src/game/systems/travelRoutes';
import {WorldGenerator} from '../src/game/systems/WorldGenerator';
import {TOWN_BY_ID} from '../src/data/towns';
import {CHUNK_SIZE} from '../src/data/world';
import {settlementAt} from '../src/data/settlements';
import {onRoadRoute} from '../src/data/roadRoutes';
import {fortificationBlocksPath} from '../src/data/fortifications';
import {BOAT_HULL_CLEARANCE} from '../src/game/systems/VehicleArt';
import {trafficDistance,horseWalkFrame,wheelTurnFrame} from '../src/game/systems/trafficMotion';

describe('traveling world scenery',()=>{
  const world=new WorldGenerator();
  it('turns and waits at route ends without jumps, and repeats after a complete trip',()=>{
    const route:TrafficRoute={id:'fixture',kind:'cart',points:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],length:200,speed:10,phase:0};
    expect(routePosition(route,10000)).toMatchObject({x:100,y:0,moving:true});
    expect(routePosition(route,21000)).toMatchObject({x:100,y:100,moving:false});
    expect(routePosition(route,25000)).toMatchObject({x:100,y:90,dy:-100});
    expect(routePosition(route,46000)).toMatchObject({x:0,y:0,moving:false});
    expect(routePosition(route,48000)).toEqual(routePosition(route,0));
    const before=routePosition(route,23999),after=routePosition(route,24001);
    expect(Math.hypot(before.x-after.x,before.y-after.y)).toBeLessThan(.02);
  });
  it('drives hoof and wheel phases with distance, holding both throughout loading waits',()=>{
    const route:TrafficRoute={id:'motion',kind:'cart',points:[{x:0,y:0},{x:200,y:0}],length:200,speed:10,phase:0};
    expect(trafficDistance(route,10000)).toBe(100);
    expect(trafficDistance(route,21000)).toBe(200);
    expect(trafficDistance(route,23999)).toBe(200);
    expect(trafficDistance(route,25000)).toBe(210);
    expect(trafficDistance(route,48000)).toBe(400);
    expect(horseWalkFrame(trafficDistance(route,21000))).toBe(horseWalkFrame(trafficDistance(route,23999)));
    expect(wheelTurnFrame(trafficDistance(route,21000),2)).toBe(wheelTurnFrame(trafficDistance(route,23999),2));
    expect(new Set([0,11,22,33].map(horseWalkFrame)).size).toBe(4);
    expect(wheelTurnFrame(12,2)).not.toBe(wheelTurnFrame(12,1));
  });
  it('keeps caravans on walkable road approaches outside authored town interiors',()=>{
    const routes=cartRoutes(world);
    expect(routes.length).toBeGreaterThan(5);
    expect(new Set(routes.map(r=>r.id)).size).toBe(routes.length);
    for(const route of routes){
      for(const p of route.points){expect(world.isWalkable(p.x,p.y)).toBe(true);expect(onRoadRoute(p.x,p.y)).toBe(true);expect(settlementAt(p.x,p.y)).toBeUndefined();}
      for(let t=0;t<60000;t+=1000){const p=routePosition(route,t);expect(world.isWalkable(p.x,p.y)).toBe(true);}
    }
  });
  it('builds reproducible harbor lanes with clearance on both sides of the hull',()=>{
    const harbor=TOWN_BY_ID.tidewatch.world,cx=Math.floor(harbor.x/CHUNK_SIZE),cy=Math.floor((harbor.y+1800)/CHUNK_SIZE);
    const candidates=[-1,0,1].flatMap(dx=>[0,1,2].map(dy=>({cx:cx+dx,cy:cy+dy})))
      .map(p=>({ ...p,route:seaRoute(world,p.cx,p.cy)})).filter(p=>p.route);
    expect(candidates.length).toBeGreaterThan(0);
    for(const {cx,cy,route} of candidates){
      expect(seaRoute(world,cx,cy)).toEqual(route);
      expect(fortificationBlocksPath(route!.points[0],route!.points[1],BOAT_HULL_CLEARANCE)).toBe(false);
      for(let t=0;t<80000;t+=1000){const p=routePosition(route!,t),length=Math.hypot(p.dx,p.dy);
        for(const [ox,oy] of [[0,0],[BOAT_HULL_CLEARANCE,0],[-BOAT_HULL_CLEARANCE,0],[0,BOAT_HULL_CLEARANCE],[0,-BOAT_HULL_CLEARANCE]])expect(isSailingWater(world,p.x+ox,p.y+oy)).toBe(true);}
    }
    expect(isSailingWater(world,TOWN_BY_ID.oakmere.world.x,TOWN_BY_ID.oakmere.world.y)).toBe(false);
    expect(isSailingWater(world,-100,100)).toBe(false);
  });
});
