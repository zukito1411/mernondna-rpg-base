import type { Vec2 } from '../game/types';
import { chunkCenter } from './world';
import { ROAD_CONNECTIONS, TOWN_BY_ID } from './towns';

export interface RoadRoute { id:string; from:string; to:string; width:number; points:Vec2[] }

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

export const ROAD_ROUTES:RoadRoute[] = ROAD_CONNECTIONS.map(([from,to]) => ({
  id:`${from}:${to}`,from,to,width:from === 'oakmere' || to === 'oakmere' ? 88 : 72,
  points:[TOWN_BY_ID[from].world,
    ...(from==='highmere'&&to==='willowcross'?[{x:TOWN_BY_ID.highmere.world.x+950,y:TOWN_BY_ID.highmere.world.y}]:[]),
    ...corridors[`${from}:${to}`].map(([x,y]) => chunkCenter(x,y)),TOWN_BY_ID[to].world],
}));

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
