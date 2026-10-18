import {TOWNS,TOWN_BY_ID} from './towns';
import {BOSSES,ENEMY_BY_ID} from './enemies';
import {REGION_BY_ID} from './regions';
import type {RegionId} from '../game/types';

export interface Contract {id:string;townId:string;regionId:RegionId;title:string;description:string;enemyId:string;bossId?:string;amount:number;gold:number;xp:number}
export interface ContractProgress {progress:number;claimed:boolean}
export type ContractLedger=Record<string,ContractProgress>;
export const MAX_ACTIVE_CONTRACTS=3;
const hunts:Partial<Record<RegionId,{enemyId:string;amount:number;reason:string}>>={
  trandum:{enemyId:'road-bandit',amount:4,reason:'Wagoners are losing seed grain to armed thieves. Keep the crown roads open.'},
  narenthil:{enemyId:'blighted-thornling',amount:4,reason:'Blighted growth is spreading along the woodland paths. The grove keepers need a clear passage.'},
  nardorous:{enemyId:'cave-troll',amount:3,reason:'Pass traders report trolls near the mountain trails. Help the next caravan reach shelter.'},
  rindass:{enemyId:'rindass-orc-raider',amount:4,reason:'Warband raiders are troubling travelers beyond the clan roads. Break up their attacks.'},
  druganwoods:{enemyId:'grove-spider',amount:4,reason:'Webs are closing the forest paths used by mill workers and river traders.'},
  portquill:{enemyId:'cutlass-pirate',amount:4,reason:'Pirate deckhands threaten the cargo routes. Give the harbor crews room to work.'},
  frostlands:{enemyId:'frost-wolf',amount:4,reason:'Hungry frost wolves are stalking the beacon road. Protect those carrying winter supplies.'},
  darkav:{enemyId:'cave-troll',amount:3,reason:'Trolls are roaming the volcanic highlands. The forge caravans need a safer road.'},
};
// A small authored catalog, constructed once. No daily spawning or polling.
export const CONTRACTS:Contract[]=TOWNS.flatMap(town=>{
  const hunt=hunts[town.regionId],boss=BOSSES.find(b=>b.regionId===town.regionId);
  const entries:Contract[]=[];
  if(hunt){
    // Retain the original ID, target and payout for existing saved contracts.
    entries.push({id:town.id+':hunt',townId:town.id,regionId:town.regionId,
      title:`${town.name}: safer roads`,description:hunt.reason,enemyId:hunt.enemyId,amount:hunt.amount,gold:100,xp:90});
    entries.push({id:town.id+':hunt-30',townId:town.id,regionId:town.regionId,
      title:`${town.name}: the long patrol`,description:`${hunt.reason} The settlement is funding a sustained patrol: defeat 30 of these enemies across the region.`,
      enemyId:hunt.enemyId,amount:30,gold:1200,xp:1000});
    entries.push({id:town.id+':hunt-50',townId:town.id,regionId:town.regionId,
      title:`${town.name}: regional relief`,description:`${hunt.reason} This major commission calls for 50 defeats to relieve pressure on the region's travelers and workers.`,
      enemyId:hunt.enemyId,amount:50,gold:2400,xp:2200});
  }
  if(boss)entries.push({id:town.id+':bounty',townId:town.id,regionId:town.regionId,
    title:`Bounty: ${boss.name}`,description:`${town.name} offers a reward for confronting ${boss.name}. ${boss.lore}`,
    enemyId:boss.enemyId,bossId:boss.id,amount:1,gold:250,xp:180});
  return entries;
});
export const CONTRACT_BY_ID=Object.fromEntries(CONTRACTS.map(c=>[c.id,c])) as Record<string,Contract>;
export const CONTRACTS_BY_TOWN=Object.fromEntries(TOWNS.map(t=>[t.id,CONTRACTS.filter(c=>c.townId===t.id)])) as Record<string,Contract[]>;
export const outstandingContracts=(ledger:ContractLedger)=>Object.values(ledger).filter(p=>!p.claimed).length;
export const contractObjective=(c:Contract)=>`Defeat ${ENEMY_BY_ID[c.enemyId].name} × ${c.amount} in ${c.regionId==='dead-sea'?'Dead Sea':REGION_BY_ID[c.regionId].name}. Return to ${TOWN_BY_ID[c.townId].name}.`;
export function advanceContracts(ledger:ContractLedger,enemyId:string,region:RegionId,bossId?:string){
  let next=ledger;
  for(const [id,p] of Object.entries(ledger)){
    const c=CONTRACT_BY_ID[id];
    if(!c||p.claimed||p.progress>=c.amount||c.enemyId!==enemyId||c.regionId!==region||c.bossId!==bossId)continue;
    if(next===ledger)next={...ledger};
    next[id]={progress:p.progress+1,claimed:false};
  }
  return next;
}
export function parseContracts(value:unknown):ContractLedger|null{
  if(value===undefined)return {};
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const result:ContractLedger={};
  for(const [id,raw] of Object.entries(value)){
    const c=Object.hasOwn(CONTRACT_BY_ID,id)?CONTRACT_BY_ID[id]:undefined;
    if(!c||!raw||typeof raw!=='object'||Array.isArray(raw))return null;
    const {progress,claimed}=raw as Partial<ContractProgress>;
    if(typeof progress!=='number'||!Number.isInteger(progress)||progress<0||progress>c.amount||typeof claimed!=='boolean'
      ||claimed&&progress!==c.amount)return null;
    result[id]={progress,claimed};
  }
  return outstandingContracts(result)<=MAX_ACTIVE_CONTRACTS?result:null;
}
