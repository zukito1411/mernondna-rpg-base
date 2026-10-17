import {BOSS_BY_ID,ENEMY_BY_ID} from './enemies';
import {NPC_BY_ID} from './npcs';
import {REGION_BY_ID} from './regions';
import {WEAPON_BY_ID} from './weapons';
import {TOWN_BY_ID} from './towns';
import type {RegionId} from '../game/types';

export interface JournalState {
  creatures:Record<string,number>; bosses:Record<string,number>;
  characters:string[]; regions:RegionId[]; weapons:string[];
}
export function emptyJournal():JournalState{return {creatures:{},bosses:{},characters:[],regions:[],weapons:[]};}
export function discoverCreature(journal:JournalState,enemyId:string,bossId?:string,defeated=false):JournalState {
  if(!Object.hasOwn(ENEMY_BY_ID,enemyId))return journal;
  const boss=bossId&&Object.hasOwn(BOSS_BY_ID,bossId)&&BOSS_BY_ID[bossId].enemyId===enemyId?bossId:undefined;
  if(!defeated&&Object.hasOwn(journal.creatures,enemyId)&&(!boss||Object.hasOwn(journal.bosses,boss)))return journal;
  return {...journal,creatures:{...journal.creatures,[enemyId]:Math.min(999999,(journal.creatures[enemyId]??0)+(defeated?1:0))},
    bosses:boss?{...journal.bosses,[boss]:Math.min(999999,(journal.bosses[boss]??0)+(defeated?1:0))}:journal.bosses};
}
export function discoverJournalEntry(journal:JournalState,kind:'characters'|'regions'|'weapons',id:string):JournalState {
  const catalog=kind==='characters'?NPC_BY_ID:kind==='regions'?REGION_BY_ID:WEAPON_BY_ID;
  if(!Object.hasOwn(catalog,id)||(journal[kind] as string[]).includes(id))return journal;
  return {...journal,[kind]:[...journal[kind],id]};
}
/** Old saves retain earned knowledge without revealing undiscovered content. */
export function restoreJournal(journal:JournalState,history:{inventory:string[];defeatedBosses:string[];regionId:RegionId;unlockedTownShrines?:string[]}):JournalState {
  let result=journal;
  for(const id of history.inventory)result=discoverJournalEntry(result,'weapons',id);
  result=discoverJournalEntry(result,'regions',history.regionId);
  for(const id of history.unlockedTownShrines??[]){const town=TOWN_BY_ID[id];if(town)result=discoverJournalEntry(result,'regions',town.regionId);}
  for(const id of history.defeatedBosses){const boss=BOSS_BY_ID[id];if(!boss)continue;
    result=discoverCreature(result,boss.enemyId,id);
    if(!result.bosses[id])result={...result,bosses:{...result.bosses,[id]:1},creatures:{...result.creatures,[boss.enemyId]:Math.max(1,result.creatures[boss.enemyId]??0)}};
  }
  return result;
}
export function parseJournal(value:unknown):JournalState|null {
  if(value===undefined)return emptyJournal();
  const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
  if(!record(value)||!record(value.creatures)||!record(value.bosses))return null;
  for(const [key,catalog] of [['creatures',ENEMY_BY_ID],['bosses',BOSS_BY_ID]] as const){
    const entries=value[key] as Record<string,unknown>;
    if(Object.keys(entries).length>Object.keys(catalog).length||Object.entries(entries).some(([id,n])=>
      !Object.hasOwn(catalog,id)||typeof n!=='number'||!Number.isSafeInteger(n)||n<0||n>999999))return null;
  }
  for(const [key,catalog] of [['characters',NPC_BY_ID],['regions',REGION_BY_ID],['weapons',WEAPON_BY_ID]] as const){
    const ids=value[key];if(!Array.isArray(ids)||ids.length>Object.keys(catalog).length||new Set(ids).size!==ids.length
      ||ids.some(id=>typeof id!=='string'||!Object.hasOwn(catalog,id)))return null;
  }
  return {creatures:{...value.creatures} as Record<string,number>,bosses:{...value.bosses} as Record<string,number>,
    characters:[...value.characters as string[]],regions:[...value.regions as RegionId[]],weapons:[...value.weapons as string[]]};
}
export const REGION_HISTORY:Record<string,string>={
  trandum:'The crown’s roads connect farms, river quays and fortified towns. The broken eastern watch shows how quickly a trade route can become a raider’s toll road. Highmere’s records and households preserve different accounts of the kingdom’s troubles.',
  narenthil:'Elven halls grew beside old shrines and silver rivers long before the present road network. The Moonlit Warden’s blight threatens the living bond between settlement and woodland.',
  nardorous:'Watchforts and stone citadels guard the mountain passes. A broken beacon or a blocked wagon road can isolate a whole community; Stonejaw’s ambushes make that danger immediate.',
  rindass:'Independent orcan clans built their lives around steppe routes and hardy herds. Krag’s warband has turned clan strength into coercion, leaving travelers and local families caught between armed patrols.',
  druganwoods:'Dwarven roads follow rivers into workshops, mine halls and deep-rooted woods. The Rootfather’s unrest exposes the uneasy boundary between worked stone, living roots and old spirits.',
  portquill:'Harbor trade supports sailors, shipwrights and coastal households. The Salt King’s stolen crown cargo and fortified flagship show how easily sea power becomes a private toll on every voyage.',
  frostlands:'Hunters and sea clans endure on scattered frozen islands. Harbors and beacons bind those communities together. The Frost Wyrm’s displacement has made the routes between them more dangerous.',
  darkav:'Forge halls and ash roads cross a volcanic landscape watched by the Ashen Seer. Above them, Varkhul returns to the ridge after defeat; the dragon’s retreat is a reprieve rather than a permanent death.',
};
