import {TOWN_BY_ID} from './towns';
import type {RegionId,Vec2} from '../game/types';

export interface DungeonDefinition {id:string;name:string;townId:string;regionId:RegionId;door:Vec2;directions:string;description:string;minLevel:number;enemies:readonly string[];captain:string;gold:number;xp:number;tint:number}
const cave=(id:string,name:string,townId:string,dx:number,dy:number,directions:string,description:string,minLevel:number,enemies:readonly string[],captain:string,gold:number,xp:number,tint=0xffffff):DungeonDefinition=>({
 id,name,townId,regionId:TOWN_BY_ID[townId].regionId,door:{x:TOWN_BY_ID[townId].world.x+dx,y:TOWN_BY_ID[townId].world.y+dy},directions,description,minLevel,enemies,captain,gold,xp,tint,
});
export const DUNGEONS:readonly DungeonDefinition[]=[
 cave('hollow-road','Hollow Road Hideout','oakmere',2350,-1850,'northeast of Oakmere','Bandits have hidden stolen caravan pay beneath a broken limestone arch.',6,['road-bandit','road-bandit','road-bandit','road-bandit','road-bandit','road-bandit','bandit-captain'],'Hideout Captain',1400,1200),
 cave('moonroot-den','Moonroot Den','moonfall',-2250,1750,'southwest of Moonfall','Goblin scavengers and stone-slingers defend a cache beneath the woodland roots.',12,['hedge-goblin','goblin-stone-slinger','hedge-goblin','goblin-stone-slinger','hedge-goblin','hedge-goblin','hedge-goblin'],'Moonroot Hoardkeeper',2100,1800,0xdbe5d1),
 cave('broken-pass','Broken Pass Cavern','starhold',2050,-2050,'northeast of Starhold','Trolls have dragged shattered wagons into a deep mountain store-cavern.',18,['cave-troll','road-bandit','road-bandit','cave-troll','road-bandit','road-bandit','cave-troll'],'Passbreaker',2800,2400,0xd9dce0),
 cave('redfang-hold','Redfang Underhold','redmesa',-2450,1650,'southwest of Redmesa','An orc raiding company keeps its war chest in a fortified underground hollow.',22,['rindass-orc-raider','rindass-orc-spearman','rindass-orc-raider','rindass-orc-spearman','rindass-orc-raider','rindass-orc-raider','redmesa-chieftain'],'Redfang Warleader',3600,3000,0xe9d6bb),
];
export const DUNGEON_BY_ID=Object.fromEntries(DUNGEONS.map(d=>[d.id,d])) as Record<string,DungeonDefinition>;
export const DUNGEON_RESET_MS=20*60*1000;
export interface DungeonProgress {discovered:boolean;defeated:number;claimed:boolean;respawnAt?:number}
export type DungeonLedger=Record<string,DungeonProgress>;
export const dungeonMask=(d:DungeonDefinition)=>(1<<d.enemies.length)-1;
export const dungeonCleared=(d:DungeonDefinition,p?:DungeonProgress)=>Boolean(p&&p.defeated===dungeonMask(d));
// Previously claimed saves without a deadline become available on the next
// entry. Partial clears and unopened chests never expire.
export const dungeonResetReady=(p?:DungeonProgress,now=Date.now())=>Boolean(p?.claimed&&(p.respawnAt??0)<=now);
export function parseDungeons(value:unknown):DungeonLedger|null{
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>DUNGEONS.length)return null;
 const result:DungeonLedger={};
 for(const [id,raw] of Object.entries(value)){
  const d=Object.hasOwn(DUNGEON_BY_ID,id)?DUNGEON_BY_ID[id]:undefined;
  if(!d||!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const p=raw as Partial<DungeonProgress>;
  if(typeof p.discovered!=='boolean'||!p.discovered||typeof p.claimed!=='boolean'||!Number.isInteger(p.defeated)
   ||p.defeated!<0||p.defeated!>dungeonMask(d)||p.claimed&&!dungeonCleared(d,p as DungeonProgress))return null;
  if(p.respawnAt!==undefined&&(!p.claimed||!Number.isSafeInteger(p.respawnAt)||p.respawnAt<0))return null;
  result[id]={discovered:true,defeated:p.defeated!,claimed:p.claimed,...(p.respawnAt!==undefined?{respawnAt:p.respawnAt}:{})};
 }
 return result;
}
