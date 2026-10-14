import {ART_BY_KEY,artFrameSize} from './art';

// Surveyed source deck, excluding painted water, pillars and parapets. These
// registrations match worldPropOrigin and the extracted bridge rail layers.
const region=ART_BY_KEY.bridges.regions![2],anchor=ART_BY_KEY.bridges.groundPoints![2];
const sourceFit=artFrameSize('bridges',2).width/region[2];
const deck:readonly (readonly [number,number,number])[]=[
  [110,470,516],[154,448,493],[225,437,480],[298,438,478],
  [366,450,490],[414,472,510],[456,490,535],
];
export function stoneBridgeScale(waterSpan:number){
  return Math.max(3.3,(waterSpan+64)/((456-110)*sourceFit));
}
export function stoneBridgeApproachSpan(scale:number){
  return Math.max(anchor[0]-deck[0][0],deck[deck.length-1][0]-anchor[0])*sourceFit*scale+32;
}
export function stoneBridgePath(cx:number,cy:number,scale:number){
  const fit=sourceFit*scale;
  return deck.map(([x,back,front])=>({x:cx+(x-anchor[0])*fit,y:cy+((back+front)/2+6-anchor[1])*fit}));
}
export function onStoneBridgeDeck(x:number,y:number,cx:number,cy:number,scale=3.3){
  const fit=sourceFit*scale,px=(x-cx)/fit+anchor[0],py=(y-cy)/fit+anchor[1];
  if(px<deck[0][0]||px>deck[deck.length-1][0])return false;
  for(let i=1;i<deck.length;i++){
    const a=deck[i-1],b=deck[i];if(px>b[0])continue;
    const t=(px-a[0])/(b[0]-a[0]);
    // Feet stay between the rail edges; the source arch bends at both banks.
    return py>=a[1]+(b[1]-a[1])*t+6&&py<=a[2]+(b[2]-a[2])*t-2;
  }
  return false;
}
