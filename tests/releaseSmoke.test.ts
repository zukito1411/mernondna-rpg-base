import {describe,it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import {QUESTS} from '../src/data/quests';
import {NPC_BY_ID} from '../src/data/npcs';
import {CONTENT_BY_ID,WORLD_CONTENT} from '../src/data/content';
import {CINEMATICS} from '../src/data/cinematics';
import {INTERIOR_ENTRIES} from '../src/data/interiors';
import {CITIZEN_SOURCES} from '../src/data/regionalCitizenArt';
import {ROAD_ROUTES} from '../src/data/roadRoutes';
import {stoneBridgePath} from '../src/data/bridgeDeck';
import {WorldGenerator} from '../src/game/systems/WorldGenerator';
import {questObjectiveText,questTravelHint} from '../src/game/systems/questDestinations';
import {STORY_ENCOUNTERS} from '../src/data/adventure';
import {ENEMY_BY_ID} from '../src/data/enemies';
import {NPC_INTERIOR_BY_ID} from '../src/data/interiors';

describe('focused release smoke',()=>{
 it('loads campaign data with resolvable contacts, clues, scenes and encounter counts',()=>{
  for(const q of QUESTS){
   expect(NPC_BY_ID[q.giverNpcId],q.id).toBeTruthy();
   expect(new Set(q.objectives.map(o=>o.id)).size,q.id).toBe(q.objectives.length);
   for(const o of q.objectives){
    if(['talk','deliver','choice','puzzle','escort'].includes(o.type))expect(NPC_BY_ID[o.targetId],q.id+'/'+o.id).toBeTruthy();
    if(o.contentId)expect(CONTENT_BY_ID[o.contentId],q.id+'/'+o.id).toBeTruthy();
    if(o.cinematicId)expect(CINEMATICS[o.cinematicId],o.cinematicId).toBeTruthy();
    if(o.type==='quest')expect(QUESTS.some(d=>d.id===o.targetId),o.targetId).toBe(true);
    if(o.killContentPrefix)expect(WORLD_CONTENT.filter(d=>d.kind==='creature'&&d.id.startsWith(o.killContentPrefix!)
     &&(o.enemyIds??[o.targetId]).includes(d.enemyId)).length,q.id+'/'+o.id).toBeGreaterThanOrEqual(o.amount);
   }
  }
 });
 it('resolves story encounter actors, indoor hosts and world anchors',()=>{
  for(const event of STORY_ENCOUNTERS){
   const objective=QUESTS.find(q=>q.id===event.questId)?.objectives.find(o=>o.id===event.objectiveId);
   expect(objective?.type,event.id).toBe('encounter');expect(objective?.targetId).toBe(event.id);
   if(event.interiorNpcId)expect(NPC_INTERIOR_BY_ID[event.interiorNpcId],event.id).toBeTruthy();
   else expect(CONTENT_BY_ID[event.npcId?'npc:'+event.npcId:event.contentId!],event.id).toBeTruthy();
   for(const enemyId of event.waves.flat())expect(ENEMY_BY_ID[enemyId],event.id+'/'+enemyId).toBeTruthy();
   expect(CINEMATICS['encounter-'+event.id],event.id).toBeTruthy();
  }
 });
 it('keeps wilderness bridge centerlines walkable between sampled points',()=>{
  const world=new WorldGenerator();
  for(const route of ROAD_ROUTES)for(const bridge of route.crossings){
   const path=stoneBridgePath(bridge.x,bridge.y,bridge.scale);
   for(let i=1;i<path.length;i++)for(let step=0;step<=8;step++){
    const a=path[i-1],b=path[i],t=step/8;
    expect(world.isWalkable(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t),route.id+'/'+i+'/'+step).toBe(true);
   }
  }
 });
 it('names island settlements, indoor buildings and boat arrivals',()=>{
  const objective=QUESTS.find(q=>q.id==='eight-regions')!.objectives.find(o=>o.id==='brief:blackspire')!;
  const text=questObjectiveText(objective);
  for(const name of ['Forge Hall','Blackspire','Darkav'])expect(text).toContain(name);
  expect(questTravelHint(objective,'trandum')).toContain('Ashen Landing');
  expect(questTravelHint(objective,'trandum')).toContain('boat');
 });
 it('includes the new interior and regional citizen source files',()=>{
  for(const kit of new Set(INTERIOR_ENTRIES.map(e=>e.kit)))expect(existsSync('public/assets/interiors/'+kit+'/kit.png'),kit).toBe(true);
  for(const source of CITIZEN_SOURCES)expect(existsSync('public/'+source.path),source.path).toBe(true);
 });
});
