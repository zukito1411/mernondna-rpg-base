import {TOWNS} from '../../data/towns';
import {TOWN_SHRINE_BY_ID} from '../../data/townShrines';
import type {TownDefinition,RegionId,Vec2} from '../types';

/** Respawn in the closest town IN the death region. Ocean/dead-sea has
 * no settlements, so it falls back to the nearest town in the world. */
export function nearestRespawnTown(death:Vec2,region:RegionId,towns:readonly TownDefinition[]=TOWNS):TownDefinition {
 if(!towns.length)throw new Error('No respawn towns are available.');
 const local=towns.filter(town=>town.regionId===region);
 const candidates=local.length?local:towns;
 return candidates.reduce((best,town)=>{
  const d=(t:TownDefinition)=>Math.hypot(t.world.x-death.x,t.world.y-death.y);
  return d(town)<d(best)?town:best;
 });
}

/** Ordered alternatives around the authored town shrine, checked against
 * real terrain, building collision and nearby NPCs AFTER destination streaming.
 * Do not assume each town has the same road layout as Oakmere. */
export function respawnArrivalCandidates(town:TownDefinition):Vec2[]{
 const shrine=TOWN_SHRINE_BY_ID[town.id];
 const anchor=shrine?.arrival??{x:town.world.x,y:town.world.y+80};
 const points:Vec2[]=[anchor];
 for(const radius of [48,80,128,192,256,384,512]){
  for(let i=0;i<16;i++){
   const angle=i*Math.PI/8;
   points.push({x:anchor.x+Math.cos(angle)*radius,y:anchor.y+Math.sin(angle)*radius});
  }
 }
 points.push({x:town.world.x,y:town.world.y+80});
 return points;
}
