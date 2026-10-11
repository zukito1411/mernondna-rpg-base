import slots from './npcPositions.json';
import type {NpcDefinition,Vec2} from '../game/types';
import {TOWN_BY_ID} from './towns';

/** Audited feet positions, in the NPC's existing work/home neighborhood.
 * Separate from identity data so relocating a resident cannot move scenery. */
export const NPC_POSITIONS=slots as Record<string,{position:Vec2;home:Vec2;schedule:Vec2[];arrival?:Vec2}>;
export function npcEscortArrival(){
 const p=NPC_POSITIONS['tovin-reed'].arrival!,town=TOWN_BY_ID.highmere;
 return {x:town.world.x+p.x,y:town.world.y+p.y};
}
export function npcWorldPosition(npc:NpcDefinition,kind:'position'|'home'='position'){
 const p=NPC_POSITIONS[npc.id]?.[kind]??npc.worldOffset,town=TOWN_BY_ID[npc.townId];
 return {x:town.world.x+p.x,y:town.world.y+p.y};
}
export function npcSchedulePosition(npc:NpcDefinition,index:number){
 return NPC_POSITIONS[npc.id]?.schedule[index]??npc.schedule[index]?.location??npc.worldOffset;
}
