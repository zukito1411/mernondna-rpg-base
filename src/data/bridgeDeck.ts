import {ART_BY_KEY,artFrameSize} from './art';

// Existing straight timber crossing. One shared source survey drives artwork,
// road endpoints and walkability; legacy helper names remain for callers.
export const ROAD_BRIDGE_FRAME=0;
const region=ART_BY_KEY.bridges.regions![ROAD_BRIDGE_FRAME],anchor=ART_BY_KEY.bridges.groundPoints![ROAD_BRIDGE_FRAME];
const sourceFit=artFrameSize('bridges',ROAD_BRIDGE_FRAME).width/region[2];
const deck={left:90,right:393,back:196,front:261};
export function stoneBridgeScale(waterSpan:number){
  return Math.max(3.3,(waterSpan+96)/((deck.right-deck.left)*sourceFit));
}
export function stoneBridgeApproachSpan(scale:number){
  return Math.max(anchor[0]-deck.left,deck.right-anchor[0])*sourceFit*scale+32;
}
export function stoneBridgePath(cx:number,cy:number,scale:number){
  const fit=sourceFit*scale;
  return [deck.left,anchor[0],deck.right].map(x=>({x:cx+(x-anchor[0])*fit,y:cy}));
}
export function onStoneBridgeDeck(x:number,y:number,cx:number,cy:number,scale=3.3){
  const fit=sourceFit*scale,px=(x-cx)/fit+anchor[0],py=(y-cy)/fit+anchor[1];
  return px>=deck.left&&px<=deck.right&&py>=deck.back+4&&py<=deck.front-4;
}
