export const ACTOR_DIRECTIONS=['down','left','right','up'] as const;
export type ActorDirection=typeof ACTOR_DIRECTIONS[number];
/** One neutral pose plus four real steps per direction. Boss variants retain
 * their existing species art and appearance multiplier. */
export const DIRECTIONAL_ENEMY_ART=[
 {species:0,id:'gray-wolf',texture:'enemies'},
 {species:1,id:'road-bandit',texture:'enemies'},
 {species:2,id:'boarfiend',texture:'enemies'},
 {species:3,id:'marsh-wraith',texture:'enemies'},
 {species:4,id:'cave-troll',texture:'enemy_troll'},
 {species:5,id:'ash-dragon',texture:'enemy_dragon'},
] as const;
export function enemyLocomotionKey(species:number,state:'idle'|'walk',direction:ActorDirection){
 return `enemy:${species}:${state}:${direction}`;
}
/** Hysteresis at diagonal corners; very small motion retains the last facing. */
export function actorTravelDirection(x:number,y:number,previous:ActorDirection):ActorDirection{
 if(Math.hypot(x,y)<3)return previous;
 const sideways=previous==='left'||previous==='right';
 return Math.abs(x)>Math.abs(y)*(sideways?.85:1.15)?x<0?'left':'right':y<0?'up':'down';
}
