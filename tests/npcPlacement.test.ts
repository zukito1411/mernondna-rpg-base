import {describe,it,expect} from 'vitest';
import {NPCS,NPC_BY_ID} from '../src/data/npcs';
import {NPC_POSITIONS,npcWorldPosition,npcEscortArrival} from '../src/data/npcPositions';
import {createNpcPlacementSurvey,npcMayPatrol,npcPersonalSpace} from '../src/game/systems/npcPlacement';
import {ContentChunkManager} from '../src/game/systems/ContentChunkManager';
import {WORLD_CONTENT,initialContentState} from '../src/data/content';
import {TOWN_BY_ID} from '../src/data/towns';
import {enemyAnimation} from '../src/data/animationPacks';
import {ENEMY_BY_ID} from '../src/data/enemies';
describe('audited NPC courts',()=>{
 it('all residents have clear authored slots outside patrol lanes, with no stacked bodies',()=>{
  const survey=createNpcPlacementSurvey();
  expect(Object.keys(NPC_POSITIONS).every(id=>NPC_BY_ID[id])).toBe(true);
  for(const npc of NPCS){
   const p=npcWorldPosition(npc);
   expect(survey.clear(p),npc.id+' blocked by scenery').toBe(true);
   if(npc.formation||!npcMayPatrol(npc))continue;
   expect(survey.offRoad(npc,p),npc.id+' occupies a road').toBe(true);
   for(const other of NPCS)if(other.id!==npc.id)
    expect(npcPersonalSpace(p,npcWorldPosition(other)),npc.id+' overlaps '+other.id).toBe(true);
  }
 });
 it('guard work, home and evening anchors remain clear and leave civilian courts open',()=>{
  const survey=createNpcPlacementSurvey();
  for(const npc of NPCS.filter(npcMayPatrol)){
   const town=TOWN_BY_ID[npc.townId];
   for(const local of [NPC_POSITIONS[npc.id].home,...NPC_POSITIONS[npc.id].schedule]){
    const p={x:town.world.x+local.x,y:town.world.y+local.y};
    expect(survey.clear(p),npc.id+' schedule scenery').toBe(true);
    expect(survey.offRoad(npc,p),npc.id+' stops on patrol lane').toBe(true);
    for(const other of NPCS.filter(n=>n.id!==npc.id&&!n.formation))
     expect(npcPersonalSpace(p,npcWorldPosition(other)),npc.id+' schedule overlaps '+other.id).toBe(true);
   }
  }
 });
 it('old overlapping saves relocate fixed residents while preserving trust and escort progress',()=>{
  const shrine=npcWorldPosition(NPC_BY_ID['maren-voss']);
  const manager=new ContentChunkManager(WORLD_CONTENT,{states:{'npc:renna-vale':{...shrine,trust:88},'npc:tovin-reed':{x:123,y:456,trust:73}},spawns:{},nextSpawnSequence:0},{
   initialState:initialContentState,create:(_d,s)=>s,position:a=>a,capture:(_d,a)=>a,destroy:()=>{},
  });
  expect(manager.getState('npc:renna-vale')).toMatchObject({...npcWorldPosition(NPC_BY_ID['renna-vale']),trust:88});
  expect(manager.getState('npc:tovin-reed')).toMatchObject({x:123,y:456,trust:73});
 });
 it('the rescued dockworker has his own clear arrival beside the kitchen',()=>{
  const arrival=npcEscortArrival(),survey=createNpcPlacementSurvey();
  expect(survey.clear(arrival)).toBe(true);expect(survey.offRoad(NPC_BY_ID['tovin-reed'],arrival)).toBe(true);
  for(const other of NPCS)expect(npcPersonalSpace(arrival,npcWorldPosition(other)),other.id).toBe(true);
  expect(Math.hypot(arrival.x-npcWorldPosition(NPC_BY_ID['mairin-reed']).x,arrival.y-npcWorldPosition(NPC_BY_ID['mairin-reed']).y)).toBeLessThan(220);
 });
 it('Salt King has a dedicated complete pirate family without replacing the road bandit',()=>{
  expect(ENEMY_BY_ID['salt-king'].spriteFrame).toBe(6);
  for(const state of ['attack','hurt','death'] as const){expect(enemyAnimation(6,state).texture).toBe('enemy_salt_king');expect(enemyAnimation(6,state).frames).toHaveLength(6);expect(enemyAnimation(1,state).texture).toBe('enemy_bandit');}
 });
});
