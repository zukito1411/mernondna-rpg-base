import {TOWN_BY_ID} from './towns';
import type {RegionId,Vec2} from '../game/types';
import {seededRandom} from '../utils/seededRandom';
import {TOWER_FLOORS} from './towerOfMight';

export const DUNGEON_ENEMY_LEVEL=120;
// 26 slots fit the existing positive 32-bit save mask. Do not exceed 30.
export const DUNGEON_WAVE_SIZES=[3,4,5,6,7,1] as const;
export const DUNGEON_LEADER_SCALE=1.2;
const DEFENDER_COUNT=DUNGEON_WAVE_SIZES.reduce<number>((sum,count)=>sum+count,0)-1;

export interface DungeonDefinition {id:string;name:string;townId:string;regionId:RegionId;door:Vec2;directions:string;description:string;enemyLevel?:number;enemies:readonly string[];enemyPool:readonly string[];captain:string;gold:number;xp:number;tint:number;tower?:{chamber:number;floor:number;bossId:string}}
const cave=(id:string,name:string,townId:string,dx:number,dy:number,directions:string,description:string,enemies:readonly string[],captain:string,gold:number,xp:number,tint=0xffffff):DungeonDefinition=>{
 const enemyPool=[...new Set(enemies.slice(0,-1))];
 // The bandit hideout also harbours hired goblin scavengers; every cave needs
 // more than one regular model for its reset rotation to be meaningful.
 if(enemyPool.length===1)enemyPool.push('hedge-goblin');
 return {id,name,townId,regionId:TOWN_BY_ID[townId].regionId,door:{x:TOWN_BY_ID[townId].world.x+dx,y:TOWN_BY_ID[townId].world.y+dy},
  directions,description,enemyLevel:DUNGEON_ENEMY_LEVEL,enemyPool,
  enemies:[...Array.from({length:DEFENDER_COUNT},(_,slot)=>enemyPool[slot%enemyPool.length]),enemies[enemies.length-1]],captain,gold,xp,tint};
};
export const DUNGEONS:readonly DungeonDefinition[]=[
 cave('hollow-road','Hollow Road Hideout','oakmere',2350,-1850,'northeast of Oakmere','Bandits have hidden stolen caravan pay beneath a broken limestone arch.',['road-bandit','road-bandit','road-bandit','road-bandit','road-bandit','road-bandit','bandit-captain'],'Hideout Captain',1400,1200),
 cave('moonroot-den','Moonroot Den','moonfall',-2250,1750,'southwest of Moonfall','Goblin scavengers and stone-slingers defend a cache beneath the woodland roots.',['hedge-goblin','goblin-stone-slinger','hedge-goblin','goblin-stone-slinger','hedge-goblin','hedge-goblin','hedge-goblin'],'Moonroot Hoardkeeper',2100,1800,0xdbe5d1),
 cave('broken-pass','Broken Pass Cavern','starhold',2050,-2050,'northeast of Starhold','Trolls have dragged shattered wagons into a deep mountain store-cavern.',['cave-troll','road-bandit','road-bandit','cave-troll','road-bandit','road-bandit','cave-troll'],'Passbreaker',2800,2400,0xd9dce0),
 cave('redfang-hold','Redfang Underhold','redmesa',-2450,1650,'southwest of Redmesa','An orc raiding company keeps its war chest in a fortified underground hollow.',['rindass-orc-raider','rindass-orc-spearman','rindass-orc-raider','rindass-orc-spearman','rindass-orc-raider','rindass-orc-raider','redmesa-chieftain'],'Redfang Warleader',3600,3000,0xe9d6bb),
];
export const ALL_DUNGEONS=[...DUNGEONS,...TOWER_FLOORS];
export const DUNGEON_BY_ID=Object.fromEntries(ALL_DUNGEONS.map(d=>[d.id,d])) as Record<string,DungeonDefinition>;
export const DUNGEON_RESET_MS=20*60*1000;
export interface DungeonProgress {discovered:boolean;defeated:number;claimed:boolean;respawnAt?:number;version?:2;rotation?:number}
export type DungeonLedger=Record<string,DungeonProgress>;
export const newDungeonProgress=(rotation=0):DungeonProgress=>({discovered:true,defeated:0,claimed:false,version:2,rotation});
/** Stable for the whole expedition, including reloads and partial clears.
 * Rotating the dominant species guarantees a different first defender and
 * changes the mixture on each reset without storing disposable enemy actors. */
export function dungeonEnemyId(d:DungeonDefinition,slot:number,p?:DungeonProgress):string{
 if(slot===d.enemies.length-1)return d.enemies[slot];
 const rotation=p?.rotation??0;
 const roll=slot===0?0:seededRandom(`${d.id}:${Math.floor(rotation/d.enemyPool.length)}:${slot}`)();
 const offset=roll<.65?0:1+Math.floor((roll-.65)/.35*(d.enemyPool.length-1));
 return d.enemyPool[(rotation+Math.min(offset,d.enemyPool.length-1))%d.enemyPool.length];
}
export function dungeonWave(slot:number){
 let end=0;return DUNGEON_WAVE_SIZES.findIndex(size=>slot<(end+=size));
}
export const dungeonMask=(d:DungeonDefinition)=>(1<<d.enemies.length)-1;
export const dungeonCleared=(d:DungeonDefinition,p?:DungeonProgress)=>Boolean(p&&p.defeated===dungeonMask(d));
// Previously claimed saves without a deadline become available on the next
// entry. Partial clears and unopened chests never expire.
export const dungeonResetReady=(p?:DungeonProgress,now=Date.now())=>Boolean(p?.claimed&&(p.respawnAt??0)<=now);
export function parseDungeons(value:unknown):DungeonLedger|null{
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>ALL_DUNGEONS.length)return null;
 const result:DungeonLedger={};
 for(const [id,raw] of Object.entries(value)){
  const d=Object.hasOwn(DUNGEON_BY_ID,id)?DUNGEON_BY_ID[id]:undefined;
  if(!d||!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const p=raw as Partial<DungeonProgress>;
  const legacy=p.version===undefined;
  if(d.tower&&legacy||!legacy&&p.version!==2||p.rotation!==undefined&&(!Number.isSafeInteger(p.rotation)||p.rotation<0||p.rotation>=1000000))return null;
  if(typeof p.discovered!=='boolean'||!p.discovered||typeof p.claimed!=='boolean'||!Number.isInteger(p.defeated)
   ||p.defeated!<0||p.defeated!>(legacy?127:dungeonMask(d))||p.claimed&&p.defeated!==(legacy?127:dungeonMask(d)))return null;
  if(p.respawnAt!==undefined&&(!p.claimed||!Number.isSafeInteger(p.respawnAt)||p.respawnAt<0))return null;
  // Honour old completed runs/chests; preserve the six regular kill bits and
  // move an already defeated old captain to the new final slot.
  const defeated=legacy?(p.defeated===127?dungeonMask(d):(p.defeated!&63)|((p.defeated!&64)?1<<DEFENDER_COUNT:0)):p.defeated!;
  result[id]={...newDungeonProgress(p.rotation??0),defeated,claimed:p.claimed,...(p.respawnAt!==undefined?{respawnAt:p.respawnAt}:{})};
 }
 return result;
}
