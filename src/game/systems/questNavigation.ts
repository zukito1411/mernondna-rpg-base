import { QUEST_BY_ID } from '../../data/quests';
import { CONTENT_BY_ID, WORLD_CONTENT } from '../../data/content';
import { NPC_BY_ID } from '../../data/npcs';
import { npcWorldPosition, npcEscortArrival } from '../../data/npcPositions';
import { BOSS_BY_ID } from '../../data/enemies';
import { TOWN_BY_ID } from '../../data/towns';
import type { ContentDefinition, ContentWorldState, QuestObjective, QuestRuntimeState, QuestTarget, Vec2 } from '../types';
import { PORTS, PORT_BY_ID } from '../../data/ports';
import { NPC_INTERIOR_BY_ID } from '../../data/interiors';
import { WorldGenerator } from './WorldGenerator';
import { mainlandQuestWaypoint } from './questRoutes';
import {FLAGSHIP_GANGPLANK,onFlagshipDeck,onFlagshipBoarding,shipPoint} from '../../data/pirateFlagship';
import {questNpcLabel,contentQuestLocation} from './questDestinations';
import {REGION_BY_ID} from '../../data/regions';

const geography=new WorldGenerator();
const candidatesByObjective=new Map<string,ContentDefinition[]>();
const islandPorts={portquill:'tidewatch',frostlands:'skallheim',darkav:'blackspire'} as const;

export function activeObjective(quests:Record<string,QuestRuntimeState>,trackedQuestId?:string|null) {
  const entries=Object.entries(quests).sort(([a],[b])=>Number(b===trackedQuestId)-Number(a===trackedQuestId));
  for(const [questId,runtime] of entries){
    const quest=QUEST_BY_ID[questId];
    if(!quest||runtime.status!=='active')continue;
    const objective=quest.objectives.find(o=>(runtime.objectiveProgress[o.id]??0)<o.amount);
    if(objective)return {questId,quest,objective};
  }return null;
}
function eligible(d:ContentDefinition,o:QuestObjective){
  if(o.contentId)return d.id===o.contentId;
  if(['talk','deliver','choice','puzzle','escort'].includes(o.type))return d.kind==='npc'&&d.npcId===o.targetId;
  if(o.type==='kill')return d.kind==='creature'&&(!o.killContentPrefix||d.id.startsWith(o.killContentPrefix))
    &&(o.bossId?d.bossId===o.bossId:(o.enemyIds??[o.targetId]).includes(d.enemyId));
  if(o.type==='visit')return d.kind==='settlement'&&d.townId===o.targetId;
  return ('questTargetId' in d&&d.questTargetId===o.targetId)||d.id===o.targetId;
}
function travelApproach(target:QuestTarget,player:Vec2,interiorId?:string):QuestTarget{
  if(interiorId)return target;
  const deckGoal=onFlagshipDeck(target.x,target.y),aboard=onFlagshipBoarding(player.x,player.y);
  const plankY=(FLAGSHIP_GANGPLANK.top+FLAGSHIP_GANGPLANK.bottom)/2;
  if(aboard&&!deckGoal){
    const p=onFlagshipDeck(player.x,player.y)?shipPoint(600,plankY):shipPoint(1040,plankY);
    return {...target,waypoint:{...p,label:'Leave the flagship by its eastern gangplank'}};
  }
  const from=geography.getRegionAt(player.x,player.y),to=geography.getRegionAt(target.x,target.y);
  const fromPort=Object.hasOwn(islandPorts,from)?PORT_BY_ID[islandPorts[from as keyof typeof islandPorts]]:
    PORTS.find(p=>!p.river&&Math.hypot(player.x-p.landing.x,player.y-p.landing.y)<4000);
  const toPort=Object.hasOwn(islandPorts,to)?PORT_BY_ID[islandPorts[to as keyof typeof islandPorts]]:
    target.contentId.includes('flagship')?PORT_BY_ID.tidewatch:undefined;
  if((fromPort?.id??'highmere')!==(toPort?.id??'highmere')){
    const quay=fromPort??PORT_BY_ID.highmere;
    const road=quay.id==='highmere'||quay.id==='blackspire'?mainlandQuestWaypoint(player,quay.quay):undefined;
    const arrival=toPort??PORT_BY_ID.highmere,region=TOWN_BY_ID[arrival.townId].regionId;
    const arrivalName=arrival.id==='blackspire'?'Ashen Landing':arrival.name;
    return {...target,waypoint:{...(road??quay.quay),label:(road?'Follow the road to ':'Go to ')+quay.name
      +' — board a boat to '+arrivalName+' ('+(region==='dead-sea'?'Dead Sea':REGION_BY_ID[region].name)+')'}};
  }
  if(deckGoal&&!onFlagshipDeck(player.x,player.y)){
    const shore=shipPoint(1040,plankY),near=Math.hypot(player.x-shore.x,player.y-shore.y)<160||aboard;
    return {...target,waypoint:{...(near?shipPoint(600,plankY):shore),label:near?'Cross the painted eastern gangplank':'Approach the flagship from the eastern shoreline'}};
  }
  const darkavApproach=toPort?.id==='blackspire'&&(target.contentId.startsWith('npc:')||['boss:varkhul','clue:varkhul-ward','port:blackspire'].includes(target.contentId));
  if(!toPort&&!fromPort||darkavApproach){
    const point=mainlandQuestWaypoint(player,target);
    if(point)return {...target,waypoint:{...point,label:'Follow the road and cross at the bridges'}};
  }return target;
}
/** One objective resolver shared by world, interiors, maps and journal. */
export function resolveQuestTarget(quests:Record<string,QuestRuntimeState>,world:ContentWorldState,player:Vec2,
  livePosition?:(id:string)=>Vec2|undefined,trackedQuestId?:string|null,interiorId?:string,visited=new Set<string>()):QuestTarget|null{
  const active=activeObjective(quests,trackedQuestId);
  if(!active||visited.has(active.questId))return null;
  const {objective:o,questId}=active;visited.add(questId);
  if(o.type==='quest'){
    if(quests[o.targetId]?.status==='active')return resolveQuestTarget(quests,world,player,livePosition,o.targetId,interiorId,visited);
    const dependency=QUEST_BY_ID[o.targetId],npc=dependency&&NPC_BY_ID[dependency.giverNpcId];
    if(!npc)return null;
    const id='npc:'+npc.id,room=NPC_INTERIOR_BY_ID[npc.id];
    const p=room&&room.entry.id!==interiorId?room.entry.door:livePosition?.(id)??world.states[id]??npcWorldPosition(npc);
    return travelApproach({x:p.x,y:p.y,contentId:id,label:questNpcLabel(npc.id,Boolean(room&&room.entry.id!==interiorId))+' — '+dependency.name,
      questId,objectiveId:o.id,type:o.type},player,interiorId);
  }
  const key=questId+':'+o.id;
  let authored=candidatesByObjective.get(key);
  if(!authored){authored=o.contentId?(CONTENT_BY_ID[o.contentId]?[CONTENT_BY_ID[o.contentId]]:[]):WORLD_CONTENT.filter(d=>eligible(d,o));
    candidatesByObjective.set(key,authored);}
  const candidates=o.type==='kill'&&!o.bossId&&!o.killContentPrefix
    ?[...authored,...Object.values(world.spawns).filter(d=>eligible(d,o))]:authored;
  let target:ContentDefinition|undefined,position:Vec2|undefined,nearest=Infinity;
  for(const d of candidates){
    const state=world.states[d.id];
    if(state?.defeated&&!(o.bossId&&o.requiresFreshDefeat))continue;
    if('questTargetId' in d&&state?.used&&!d.repeatable)continue;
    const room=d.kind==='npc'?NPC_INTERIOR_BY_ID[d.npcId]:undefined;
    const p=room&&room.entry.id!==interiorId?room.entry.door:livePosition?.(d.id)??state??d.world;
    const distance=Math.hypot(p.x-player.x,p.y-player.y);
    if(distance<nearest){nearest=distance;target=d;position=p;}
  }
  if(!target||!position)return null;
  if(o.type==='escort'&&o.targetId==='tovin-reed'&&nearest<210)
    return {...npcEscortArrival(),contentId:'escort:tovin-reed',label:'Kitchen approach, Highmere, Trandum — stay close to '+NPC_BY_ID['tovin-reed'].name,questId,objectiveId:o.id,type:o.type};
  const room=target.kind==='npc'?NPC_INTERIOR_BY_ID[target.npcId]:undefined;
  const destination=target.kind==='npc'?undefined:contentQuestLocation(target,target.kind==='creature'&&target.bossId?BOSS_BY_ID[target.bossId]?.regionId:undefined);
  let label=target.kind==='npc'?questNpcLabel(target.npcId,Boolean(room&&room.entry.id!==interiorId))
    :destination!.name+' — '+destination!.location;
  const state=world.states[target.id];
  if(target.kind==='creature'&&state?.defeated&&o.requiresFreshDefeat){
    const minutes=Math.max(0,Math.ceil(((state.respawnAt??0)-Date.now())/60000));
    label+=minutes?' — recovering; returns in '+minutes+' min':' — return to the lair for the next battle';
  }
  return travelApproach({x:position.x,y:position.y,contentId:target.id,label,questId,objectiveId:o.id,type:o.type},player,interiorId);
}

export function questBearing(player: Vec2, target: Vec2) { return Math.atan2(target.x - player.x, player.y - target.y); }
export function compassDirection(bearing: number) {
  const directions = ['N','NE','E','SE','S','SW','W','NW'];
  return directions[((Math.round(bearing / (Math.PI / 4)) % 8) + 8) % 8];
}
export function mapPoint(point: Vec2, center: Vec2, range: number, size: number, clamp = false) {
  let dx = (point.x - center.x) * size / (2 * range), dy = (point.y - center.y) * size / (2 * range);
  const distance = Math.hypot(dx, dy), limit = size / 2 - 12;
  if (clamp && distance > limit) { dx *= limit / distance; dy *= limit / distance; }
  return { x: size / 2 + dx, y: size / 2 + dy, offscreen: distance > limit };
}
