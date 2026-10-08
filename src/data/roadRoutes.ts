import type { Vec2 } from '../game/types';
import { chunkCenter } from './world';
import { ROAD_CONNECTIONS, TOWN_BY_ID } from './towns';
import {DRAINAGE} from './worldLandscape';

export interface RoadRoute { id:string; from:string; to:string; width:number; points:Vec2[]; surface:'stone'|'dirt'; hierarchy:'royal'|'regional'|'trail'; crossings:Array<Vec2 & {width:number}> }

// Surveyed mainland corridors. Waypoints follow valley floors and pass
// approaches rather than drawing a ruler line through every town pair.
const corridors:Record<string,Array<[number,number]>> = {
  'deepford:cibar-plains':[[58,62+620/1536],[58.8,62+620/1536],[61,64],[64,66]],
  'oakmere:highmere':[[22.5,24.3],[25,23.4],[28,22.4]],
  'highmere:willowcross':[[34,22.2],[37,23.2]],
  'willowcross:elarion':[[43,24],[47,21],[52,17.8]],
  'elarion:moonfall':[[59,18],[61,20]],
  'willowcross:starhold':[[47,25],[54,25.2],[61,25.3],[68,26],[74,27]],
  'starhold:redmesa':[[81,32],[81.5,38],[80,44]],
  'redmesa:deepford':[[74,53],[69,56],[63,59.5]],
  'deepford:highmere':[[53,56],[49,49],[44,42],[39,34],[35,27],[31.9,22.42],[31.2,22.42]],
};

export const ROAD_ROUTES:RoadRoute[] = ROAD_CONNECTIONS.map(([from,to]):RoadRoute => ({
  id:`${from}:${to}`,from,to,width:from==='elarion'&&to==='moonfall'?96:from==='oakmere'?144:from==='starhold'||to==='starhold'?128:176,
  surface:from==='highmere'||to==='highmere'?'stone':'dirt',hierarchy:from==='highmere'||to==='highmere'?'royal':to==='moonfall'?'trail':'regional',crossings:[],
  points:[TOWN_BY_ID[from].world,
    ...(from==='highmere'&&to==='willowcross'?[{x:TOWN_BY_ID.highmere.world.x+950,y:TOWN_BY_ID.highmere.world.y}]:[]),
    ...corridors[`${from}:${to}`].map(([x,y]) => chunkCenter(x,y)),TOWN_BY_ID[to].world],
}));

// Align every new river crossing to the actual east/west bridge illustration.
// Existing town-center approaches already match their authored local decks.
for(const route of ROAD_ROUTES){const aligned:Vec2[]=[route.points[0]];
  for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],hits:Array<Vec2 & {t:number;width:number}>=[];
    for(const river of DRAINAGE)for(let j=1;j<river.points.length;j++){
      const c=river.points[j-1],d=river.points[j],dx=b.x-a.x,dy=b.y-a.y,ex=d.x-c.x,ey=d.y-c.y,det=dx*ey-dy*ex;
      if(Math.abs(det)<.001||Math.abs(ey)<Math.abs(ex)*.45)continue;
      const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/det,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/det;
      if(t<=0||t>=1||u<0||u>1)continue;
      const p={x:a.x+dx*t,y:a.y+dy*t,t,width:river.width};
      if(Math.hypot(p.x-TOWN_BY_ID[route.from].world.x,p.y-TOWN_BY_ID[route.from].world.y)<3000
        ||Math.hypot(p.x-TOWN_BY_ID[route.to].world.x,p.y-TOWN_BY_ID[route.to].world.y)<3000)continue;
      if(!hits.some(h=>Math.hypot(h.x-p.x,h.y-p.y)<300))hits.push(p);
    }
    for(const hit of hits.sort((p,q)=>p.t-q.t)){const sign=b.x>=a.x?1:-1,half=hit.width*.8+50;
      aligned.push({x:hit.x-sign*half,y:hit.y},{x:hit.x+sign*half,y:hit.y});route.crossings.push(hit);}
    aligned.push(b);
  }route.points=aligned;
}
export function roadSurfaceAt(x:number,y:number){const p={x,y};return ROAD_ROUTES.find(r=>r.points.slice(1).some((b,i)=>segmentDistance(p,r.points[i],b)<=r.width/2))?.surface;}

export function segmentDistance(point:Vec2,a:Vec2,b:Vec2) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0,Math.min(1,((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
  return Math.hypot(point.x - a.x - t * dx,point.y - a.y - t * dy);
}

export function onRoadRoute(x:number,y:number,clearance = 0) {
  const point = { x,y };
  return ROAD_ROUTES.some(route => route.points.slice(1).some((end,index) =>
    segmentDistance(point,route.points[index],end) <= route.width / 2 + clearance));
}
