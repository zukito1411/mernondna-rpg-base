import { TOWN_BY_ID } from './towns';
import {ROAD_ROUTES} from './roadRoutes';
import {DRAINAGE,pathDistance} from './worldLandscape';

const highmere = TOWN_BY_ID.highmere.world;

// The capital's river follows a shallow valley through its eastern wards.
// Three stone causeways carry the city streets between both banks.
export const HIGHMERE_RIVER = {
  width:168,
  points:DRAINAGE[0].points,
  bridgeY:[-650,0,650,1550],
};

export function highmereRiverDistance(x:number,y:number) {
  return pathDistance(x,y,HIGHMERE_RIVER.points,700);
}

export function onHighmereRiver(x:number,y:number) {
  return highmereRiverDistance(x,y) <= HIGHMERE_RIVER.width / 2;
}

export function onHighmereBridge(x:number,y:number) {
  return onHighmereRiver(x,y) && HIGHMERE_RIVER.bridgeY.some(crossing =>
    Math.abs(y - highmere.y - crossing) <= 40) || onWildernessBridge(x,y);
}

// Continue local river reaches beyond the town survey; never end a river at
// a settlement/chunk boundary. The distant pools are provisional headwaters.
export const SETTLEMENT_RIVERS=[
  {townId:'willowcross',x:600,width:120,halfHeight:1150},
  {townId:'deepford',x:450,width:144,halfHeight:1450},
].map(r=>{
  const points=DRAINAGE[r.townId==='willowcross'?1:2].points;
  return {...r,points};
});
export function onSettlementRiver(x:number,y:number) {
  return SETTLEMENT_RIVERS.some(r=>pathDistance(x,y,r.points,700)<=r.width/2);
}
export const WILDERNESS_BRIDGES=ROAD_ROUTES.flatMap(r=>r.crossings.map((p,i)=>({...p,id:`bridge:road:${r.id}:${i}`})));
export function onWildernessBridge(x:number,y:number){return WILDERNESS_BRIDGES.some(p=>Math.abs(y-p.y)<=40&&Math.abs(x-p.x)<=p.width*.8+50);}
