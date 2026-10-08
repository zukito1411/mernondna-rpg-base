import type { Vec2 } from '../game/types';
import { TOWN_BY_ID } from './towns';
import { segmentDistance } from './roadRoutes';

const highmere = TOWN_BY_ID.highmere.world;
const offset = (x:number,y:number):Vec2 => ({ x:highmere.x + x,y:highmere.y + y });

// The capital's river follows a shallow valley through its eastern wards.
// Three stone causeways carry the city streets between both banks.
export const HIGHMERE_RIVER = {
  width:168,
  points:[offset(1050,-6500),offset(760,-4000),offset(560,-1800),offset(430,-800),
    offset(420,0),offset(540,1000),offset(950,3300),offset(1500,6500)],
  bridgeY:[-650,0,650,1550],
};

export function highmereRiverDistance(x:number,y:number) {
  if (Math.abs(x - highmere.x) > 2300 || Math.abs(y - highmere.y) > 6700) return Number.POSITIVE_INFINITY;
  const point = { x,y };
  return Math.min(...HIGHMERE_RIVER.points.slice(1).map((end,index) =>
    segmentDistance(point,HIGHMERE_RIVER.points[index],end)));
}

export function onHighmereRiver(x:number,y:number) {
  return highmereRiverDistance(x,y) <= HIGHMERE_RIVER.width / 2;
}

export function onHighmereBridge(x:number,y:number) {
  return onHighmereRiver(x,y) && HIGHMERE_RIVER.bridgeY.some(crossing =>
    Math.abs(y - highmere.y - crossing) <= 28);
}

// Continue local river reaches beyond the town survey; never end a river at
// a settlement/chunk boundary. The distant pools are provisional headwaters.
export const SETTLEMENT_RIVERS=[
  {townId:'willowcross',x:600,width:120,halfHeight:1150},
  {townId:'deepford',x:450,width:144,halfHeight:1450},
].map(r=>{
  const town=TOWN_BY_ID[r.townId];
  const points=[{x:r.x+300,y:-5500},{x:r.x+100,y:-2600},{x:r.x,y:-r.halfHeight},
    {x:r.x,y:r.halfHeight},{x:r.x+100,y:2600},{x:r.x+400,y:5500}]
    .map(p=>({x:town.world.x+p.x,y:town.world.y+p.y}));
  return {...r,points};
});
export function onSettlementRiver(x:number,y:number) {
  const p={x,y};
  return SETTLEMENT_RIVERS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance(p,r.points[i],b)<=r.width/2)
    || [r.points[0],r.points.at(-1)!].some(end=>Math.hypot(x-end.x,y-end.y)<160));
}
