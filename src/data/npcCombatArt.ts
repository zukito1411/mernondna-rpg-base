import type {NpcDefinition} from '../game/types';
import {CITIZEN_SOURCES} from './regionalCitizenArt';

export const NPC_COMBAT_DIRECTIONS=['down','left','right','up'] as const;
export type NpcCombatId='guard'|'general'|'huntress'|'adventurer-sword'|'adventurer-bow'|'blacksmith'|'elven-guard'
  |'rindass-officer'|'druganwoods-officer'|'frostlands-officer'|'nardorous-officer'|'darkav-officer';
export type NpcCombatTexture='npc_guard_story_attack'|'npc_general_story_attack'|`npc_combat_${NpcCombatId}`;
export interface CombatSource {
  path:string;columns:number;rows:number;
  roots?:readonly (readonly [number,number])[];bodyHeight?:number;rowBodyRatios?:readonly number[];
}
export interface NpcCombatSpec {
  id:NpcCombatId;walk:string;texture:NpcCombatTexture;mode:'melee'|'bow';reach:number;
  sources:readonly CombatSource[];frames:number;
  attackRows:readonly [number,number,number,number];walkRows?:readonly [number,number,number,number];
  mirrorLeft?:boolean;modelHeight?:number;impact:number;
  vertical?:boolean;eager?:boolean;attackOrder?:readonly number[];sideFrames?:readonly number[];walkSource?:number;
  attackBodyRatio?:number;
}
export const NPC_COMBAT_ART:readonly NpcCombatSpec[]=[
  {id:'guard',walk:'npc_guard',texture:'npc_guard_story_attack',mode:'melee',reach:96,frames:6,impact:4,eager:true,
    attackRows:[0,1,2,3],sources:[{path:'assets/npcs/trandum_guard/story-attack.png',columns:6,rows:4,bodyHeight:204,
      roots:[
        [140,276],[396,276],[652,276],[908,276],[1164,276],[1420,276],
        [140,501],[396,501],[652,501],[908,501],[1164,501],[1420,501],
        [136,740],[392,740],[648,740],[904,740],[1160,740],[1416,740],
        [136,992],[392,992],[648,992],[904,992],[1160,992],[1416,992],
      ]}]},
  {id:'general',walk:'npc_general',texture:'npc_general_story_attack',mode:'melee',reach:76,frames:6,impact:4,eager:true,
    attackRows:[0,1,2,3],sources:[{path:'assets/npcs/general/story-attack.png',columns:6,rows:4,bodyHeight:218,
      roots:[
        [140,261],[396,261],[652,261],[908,261],[1164,261],[1420,261],
        [144,501],[400,501],[656,501],[912,501],[1168,501],[1424,501],
        [140,740],[396,740],[652,740],[908,740],[1164,740],[1420,740],
        [140,998],[396,998],[652,998],[908,998],[1164,998],[1420,998],
      ]}]},
  ...(['huntress','adventurer-sword','adventurer-bow'] as const).map((id):NpcCombatSpec=>({
    id,walk:id==='huntress'?'npc_huntress':'npc_adventurer',texture:`npc_combat_${id}`,
    mode:id==='adventurer-sword'?'melee':'bow',reach:id==='adventurer-sword'?76:320,frames:4,impact:3,
    sources:[{path:`assets/npcs/story_combat/${id}.png`,columns:4,rows:4},
      {path:`assets/npcs/story_combat/${id}-vertical.png`,columns:4,rows:2,rowBodyRatios:id==='adventurer-sword'?[1,.96]:[1,.89]}],
    attackRows:[0,id==='huntress'?1:2,id==='huntress'?1:2,3],vertical:true,mirrorLeft:true,
  })),
  {id:'blacksmith',walk:'npc_blacksmith',texture:'npc_combat_blacksmith',mode:'melee',reach:70,frames:4,impact:3,
    sources:[{path:'assets/npcs/story_combat/blacksmith.png',columns:4,rows:4}],attackRows:[0,1,1,3],mirrorLeft:true,
    sideFrames:[8,5,6,11]},
  {id:'elven-guard',walk:'npc_elven_guard',texture:'npc_combat_elven-guard',mode:'melee',reach:100,frames:4,impact:3,
    sources:[{path:'assets/npcs/story_combat/elven-guard.png',columns:4,rows:3}],attackRows:[0,1,1,2],mirrorLeft:true},
  ...(['rindass','druganwoods','frostlands','nardorous','darkav'] as const).map((region):NpcCombatSpec=>({
    id:`${region}-officer`,walk:'npc_general',texture:`npc_combat_${region}-officer`,mode:'melee',reach:76,frames:4,impact:3,
    modelHeight:80,sources:[{path:`assets/npcs/story_combat/${region}.png`,columns:4,rows:6},
      {path:`assets/npcs/walking/${region}-officer.png`,columns:4,rows:3}],
    walkRows:[0,1,1,2],attackRows:[3,4,4,5],mirrorLeft:true,
    walkSource:1,attackBodyRatio:region==='darkav'?.88:undefined,
    attackOrder:region==='darkav'?[3,0,1,2]:region==='nardorous'?[1,0,2,1]:undefined,
  })),
];
/** Match the actual on-screen identity, not just a shared source-family name. */
export function npcCombatArt(npc:NpcDefinition,regionalModel?:number){
  if(!npc.combatant)return undefined;
  if(regionalModel!==undefined){
    const region=CITIZEN_SOURCES[Math.floor(regionalModel/6)]?.region;
    return regionalModel%6===2?NPC_COMBAT_ART.find(a=>a.id===`${region}-officer`):undefined;
  }
  const walk=npc.spriteTexture==='npc_royal_guard'?'npc_guard':npc.spriteTexture==='npc_elven_guard_idle'?'npc_elven_guard':npc.spriteTexture;
  if(walk==='npc_adventurer')return NPC_COMBAT_ART.find(a=>a.id===(npc.weaponId==='narenthil-longbow'?'adventurer-bow':'adventurer-sword'));
  return NPC_COMBAT_ART.find(a=>a.walk===walk);
}
export function npcCombatKey(spec:NpcCombatSpec,state:'attack'|'walk',direction:string){return `npc-combat:${spec.id}:${state}:${direction}`;}
export const NPC_ARROW_TEXTURE='npc-story-arrow';
export const NPC_ARROW_PATH='assets/npcs/story_combat/arrow.png';
