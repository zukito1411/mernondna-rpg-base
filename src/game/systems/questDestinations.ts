import type {ContentDefinition,QuestObjective,RegionId} from '../types';
import {QUEST_BY_ID} from '../../data/quests';
import {NPC_BY_ID} from '../../data/npcs';
import {NPC_INTERIOR_BY_ID} from '../../data/interiors';
import {CONTENT_BY_ID,WORLD_CONTENT} from '../../data/content';
import {BOSS_BY_ID,ENEMY_BY_ID} from '../../data/enemies';
import {TOWNS,TOWN_BY_ID} from '../../data/towns';
import {REGION_BY_ID} from '../../data/regions';
import {WILDERNESS_SITES} from '../../data/wildernessSites';
import {PORT_BY_ID} from '../../data/ports';
import {settlementAt} from '../../data/settlements';
import {WorldGenerator} from './WorldGenerator';

interface QuestDestination {name:string;location:string;regionId:RegionId;townId?:string;building?:string}
const geography=new WorldGenerator();
const destinations=new WeakMap<QuestObjective,QuestDestination|null>();
const descriptions=new WeakMap<QuestObjective,string>();
const regionName=(id:RegionId)=>id==='dead-sea'?'Dead Sea':REGION_BY_ID[id].name;
const islandPorts:Partial<Record<RegionId,string>>={portquill:'tidewatch',frostlands:'skallheim',darkav:'blackspire'};

export function npcQuestDestination(id:string):QuestDestination|undefined{
  const npc=NPC_BY_ID[id];if(!npc)return;
  const room=NPC_INTERIOR_BY_ID[id],town=TOWN_BY_ID[room?.entry.townId??npc.townId];
  const world=CONTENT_BY_ID['npc:'+id]?.world;
  const context=room?'inside '+room.entry.name+' in ':world&&!settlementAt(world.x,world.y)?'near ':'in ';
  return {name:npc.name,regionId:town.regionId,townId:town.id,building:room?.entry.name,
    location:context+town.name+', '+regionName(town.regionId)};
}

export function contentQuestLocation(content:ContentDefinition,regionOverride?:RegionId):QuestDestination{
  const regionId=regionOverride??geography.getRegionAt(content.world.x,content.world.y);
  const towns=TOWNS.filter(t=>t.regionId===regionId);
  const town=towns.reduce<typeof TOWNS[number]|undefined>((best,t)=>!best
    ||Math.hypot(t.world.x-content.world.x,t.world.y-content.world.y)<Math.hypot(best.world.x-content.world.x,best.world.y-content.world.y)?t:best,undefined);
  const site=WILDERNESS_SITES.find(s=>s.id===content.id.replace(/^discovery:/,''))
    ??WILDERNESS_SITES.find(s=>Math.hypot(s.world.x-content.world.x,s.world.y-content.world.y)<1400);
  const name=content.kind==='creature'?ENEMY_BY_ID[content.enemyId].name:content.kind==='settlement'
    ?TOWN_BY_ID[content.townId].name:'name' in content?content.name:'the marked encounter';
  const location=content.kind==='creature'&&content.bossId==='salt-king'?'aboard the Salt King’s flagship south of Tidewatch, Portquill'
    :content.kind==='creature'&&content.bossId==='varkhul'?'at the lava-ringed lair beyond Blackspire, Darkav'
    :site?.roadId?(()=>{
    const [from,to]=site.roadId!.split(':');
    return 'at '+site.name+' on the road between '+TOWN_BY_ID[from].name+' and '+TOWN_BY_ID[to].name+', '+regionName(regionId);
  })():site?'at '+site.name+(town?', near '+town.name:'')+', '+regionName(regionId)
    :town?(settlementAt(content.world.x,content.world.y)?'in ':'near ')+town.name+', '+regionName(regionId)
      :'in '+regionName(regionId);
  return {name,location,regionId,townId:town?.id};
}

export function questDestination(objective:QuestObjective):QuestDestination|null{
  if(destinations.has(objective))return destinations.get(objective)!;
  let destination:QuestDestination|undefined;
  if(['talk','deliver','choice','puzzle','escort'].includes(objective.type))destination=npcQuestDestination(objective.targetId);
  if(objective.type==='quest'){
    const dependency=QUEST_BY_ID[objective.targetId];
    if(dependency)destination=npcQuestDestination(dependency.giverNpcId);
  }
  if(objective.type==='visit'){
    const town=TOWN_BY_ID[objective.targetId];
    if(town)destination={name:town.name,location:'in '+town.name+', '+regionName(town.regionId),regionId:town.regionId,townId:town.id};
  }
  if(!destination){
    const content=CONTENT_BY_ID[objective.contentId??objective.targetId]
      ??(objective.bossId?CONTENT_BY_ID['boss:'+objective.bossId]:undefined)
      ??WORLD_CONTENT.find(d=>objective.killContentPrefix?d.kind==='creature'&&d.id.startsWith(objective.killContentPrefix)
        :'questTargetId' in d&&d.questTargetId===objective.targetId);
    if(content)destination=contentQuestLocation(content,objective.bossId?BOSS_BY_ID[objective.bossId]?.regionId:undefined);
  }
  destinations.set(objective,destination??null);return destination??null;
}

/** Location text stays separate from spoken dialogue and stable objective IDs. */
export function questObjectiveText(objective:QuestObjective){
  const cached=descriptions.get(objective);if(cached)return cached;
  const destination=questDestination(objective);if(!destination)return objective.text;
  const contact=NPC_BY_ID[objective.targetId];
  const action=contact?'Find '+destination.name+' '+destination.location
    :objective.type==='quest'?'Begin with '+destination.name+' '+destination.location
      :'Your destination is '+destination.location.replace(/^(in|at) /,'');
  const text=objective.text.trimEnd()+(objective.text.trim().endsWith('.')?' ':'. ')+action+'.';
  descriptions.set(objective,text);return text;
}

/** Explicit harbor names and boat instructions; never suggest walking to islands. */
export function questTravelHint(objective:QuestObjective,from:RegionId){
  const destination=questDestination(objective);if(!destination||destination.regionId===from)return;
  const sourceId=islandPorts[from],targetId=islandPorts[destination.regionId];
  if(!sourceId&&!targetId)return;
  const source=PORT_BY_ID[sourceId??'highmere'],target=PORT_BY_ID[targetId??'highmere'];
  const start=source.id==='highmere'?'Highmere River Quay in Highmere, Trandum':source.name;
  const arrival=target.id==='blackspire'?'Ashen Landing in Darkav':target.name+' in '+regionName(TOWN_BY_ID[target.townId].regionId);
  return 'Go to '+start+', interact with the pier and take a boat to '+arrival+'.'
    +(target.id==='blackspire'?' After landing, follow the ash road north to Blackspire.':'');
}

export function questNpcLabel(id:string,enter=false){
  const destination=npcQuestDestination(id);if(!destination)return NPC_BY_ID[id]?.name??id;
  return destination.name+' — '+(enter&&destination.building?'enter '+destination.building+', '+TOWN_BY_ID[destination.townId!].name+', '+regionName(destination.regionId):destination.location);
}
