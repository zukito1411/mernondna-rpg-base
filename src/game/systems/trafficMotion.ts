import type {TrafficRoute} from './travelRoutes';

export function trafficDirection(dx:number,dy:number){return Math.abs(dx)>Math.abs(dy)*1.15?(dx<0?1:2):(dy<0?3:0);}
const modulo=(value:number,divisor:number)=>((value%divisor)+divisor)%divisor;
/** Distance keeps hooves and wheels synchronized through waits and streaming. */
export function trafficDistance(route:TrafficRoute,elapsedMs:number){
  const travel=route.length/route.speed*1000,pause=4000,cycle=2*(travel+pause),time=elapsedMs+route.phase;
  const lap=Math.floor(time/cycle),local=modulo(time,cycle);
  return lap*route.length*2+Math.min(route.length,local*route.speed/1000)
    +Math.max(0,Math.min(route.length,(local-travel-pause)*route.speed/1000));
}
export function horseWalkFrame(distance:number){return modulo(Math.floor(distance/11),4);}
export function wheelTurnFrame(distance:number,direction:number){
  return modulo(Math.floor(distance/(2*Math.PI*18)*16)*(direction===1||direction===3?-1:1),16);
}
