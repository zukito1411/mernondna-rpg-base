import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {TOWER_FLOORS,TOWER_QUEST,towerKnown,towerCampaignComplete,gateTowerQuest,nextTowerWeeklyReset,towerCombatStats,towerEntryFloor} from '../src/data/towerOfMight';
import {TOWER_BOSS_PROFILES,bossPattern} from '../src/data/bossCombatProfiles';
import {DUNGEONS,newDungeonProgress} from '../src/data/dungeons';
import {ENEMY_BY_ID} from '../src/data/enemies';
import {SHADOW_MAGUS_ARMOR_IDS} from '../src/data/armor';
import {useGameStore} from '../src/store/gameStore';
import type {QuestRuntimeState} from '../src/game/types';
import {roomPlan,roomFloorContains} from '../src/data/interiors';
import {TOWER_ROUND_FLOOR,TOWER_SOUTH_ENTRY} from '../src/data/towerRoom';

beforeEach(()=>{useGameStore.getState().resetGame();useGameStore.setState({pendingCinematic:null});});
afterEach(()=>vi.restoreAllMocks());

it('uses a circular floor for the tower instead of its camera bounding box',()=>{
 const plan=roomPlan(false,'Tower of Might','cave','tower_of_might'),c=TOWER_ROUND_FLOOR;
 expect(plan.roundFloor).toEqual(c);expect(roomFloorContains(plan,c.x,c.y)).toBe(true);
 expect(roomFloorContains(plan,200,200)).toBe(false);
 expect(roomFloorContains(plan,c.x+c.radius-1,c.y)).toBe(true);
 expect(roomFloorContains(plan,c.x+c.radius+1,c.y)).toBe(false);
 for(const dx of [-12,0,12])for(const dy of [-24,-12,0])
  expect(roomFloorContains(plan,TOWER_SOUTH_ENTRY.x+dx,TOWER_SOUTH_ENTRY.y+dy)).toBe(true);
 const radius=ENEMY_BY_ID['grand-magus'].bodyRadius!*1.2;
 for(const dx of [-radius,0,radius])for(const dy of [-radius*2,-radius,0])
  expect(roomFloorContains(plan,900+dx,650+dy)).toBe(true);
});

it('keeps the current Magus silhouette and feet independent of his combat stats',()=>{
 const magus=ENEMY_BY_ID['grand-magus'];
 expect(magus.appearanceMultiplier).toBe(1.8);expect(magus.bodyRadius).toBe(35);
 expect(towerCombatStats(10,5,magus).hp).toBe(55000);
 expect(TOWER_BOSS_PROFILES[9].closeMove?.radius).toBe(245);
});

it('requires the completed main-story ending even with an old unlock flag',()=>{
 const quests:Record<string,QuestRuntimeState>={'the-last-ward':{status:'active',objectiveProgress:{}},
  'tower-of-might':{status:'active',objectiveProgress:{'hear-bell':1}}};
 expect(TOWER_QUEST.prerequisiteQuestId).toBe('the-last-ward');
 expect(towerKnown(quests,{'tower-of-might:unlocked':true})).toBe(false);
 const gated=gateTowerQuest(quests);expect(gated['tower-of-might'].status).toBe('locked');
 expect(gated['tower-of-might'].objectiveProgress['hear-bell']).toBe(1);
 quests['the-last-ward']={status:'completed',objectiveProgress:{}};
 expect(towerCampaignComplete(quests)).toBe(true);expect(towerKnown(quests,{})).toBe(true);
});
it('renews at the real local Monday 06:00 boundary, not seven days after entry',()=>{
 const monday=new Date(2026,9,19,6,0,0,0),nextMonday=new Date(2026,9,26,6,0,0,0);
 expect(nextTowerWeeklyReset(monday.getTime()-1)).toBe(monday.getTime());
 expect(nextTowerWeeklyReset(monday.getTime())).toBe(nextMonday.getTime());
 expect(nextTowerWeeklyReset(new Date(2026,9,23,15).getTime())).toBe(nextMonday.getTime());
});
it('uses bounded authored combat stats with no tower enemy level',()=>{
 expect(TOWER_FLOORS).toHaveLength(50);
 for(const floor of TOWER_FLOORS){
  expect(floor.enemyLevel).toBeUndefined();
  const stats=towerCombatStats(floor.tower!.chamber,floor.tower!.floor,ENEMY_BY_ID[floor.enemies[0]]);
  expect(stats.hp).toBeGreaterThan(600);expect(stats.hp).toBeLessThanOrEqual(55000);
  expect(stats.damage).toBeGreaterThan(30);expect(stats.damage).toBeLessThanOrEqual(210);
  expect(stats.defense).toBeLessThan(.23);
 }
});
it('keeps distinct tower moves, full warning windows and aggressive low-health patterns',()=>{
 expect(TOWER_BOSS_PROFILES).toHaveLength(10);
 expect(new Set(TOWER_BOSS_PROFILES.map(p=>p.identity)).size).toBe(10);
 for(const profile of TOWER_BOSS_PROFILES){
  expect(profile.resistFlurry).toBe(true);expect(profile.staggerRecoveryMs).toBe(5000);
  expect(bossPattern(profile,0,.55)).toBe(profile.enraged[0]);
  expect(profile.cooldown).toBeLessThanOrEqual(1000);
  for(const combo of [...profile.patterns,...profile.enraged])for(const move of combo){
   expect(move.windup).toBeGreaterThanOrEqual(750);expect(move.recovery).toBeGreaterThanOrEqual(400);
  }
 }
});
it('banks an earned chest exactly once before weekly reset and preserves caves and equipment',()=>{
 const reset=new Date(2026,9,19,6).getTime(),clock=vi.spyOn(Date,'now').mockReturnValue(reset-1);
 const cave={...newDungeonProgress(),defeated:1};
 useGameStore.setState({nextTowerResetAt:reset,dungeons:{'might-1-5':{...newDungeonProgress(),defeated:1},
  'might-2-1':{...newDungeonProgress(),defeated:3},[DUNGEONS[0].id]:cave}});
 const before=useGameStore.getState();expect(before.refreshTowerWeek()).toBe(false);
 clock.mockReturnValue(reset);expect(before.refreshTowerWeek()).toBe(true);
 const after=useGameStore.getState();expect(after.gold).toBe(before.gold+TOWER_FLOORS[4].gold);
 expect(after.dungeons).toEqual({[DUNGEONS[0].id]:cave});expect(after.inventory).toEqual(before.inventory);
 expect(after.quests).toBe(before.quests);expect(towerEntryFloor(after.dungeons).id).toBe('might-1-1');
 expect(after.refreshTowerWeek()).toBe(false);expect(useGameStore.getState().gold).toBe(after.gold);
});
it('does not clear active combat actors behind the scene; closing banks the final armor safely',()=>{
 const reset=new Date(2026,9,19,6).getTime();vi.spyOn(Date,'now').mockReturnValue(reset);
 useGameStore.setState({nextTowerResetAt:reset,activeDungeonId:'might-10-5',
  dungeons:{'might-10-5':{...newDungeonProgress(),defeated:1}}});
 expect(useGameStore.getState().refreshTowerWeek()).toBe(false);
 useGameStore.getState().resetTowerRun();const after=useGameStore.getState();
 expect(after.dungeons).toEqual({});expect(after.armorInventory).toEqual(SHADOW_MAGUS_ARMOR_IDS);
 const gold=after.gold;after.resetTowerRun();expect(useGameStore.getState().gold).toBe(gold);
 expect(useGameStore.getState().armorInventory).toHaveLength(3);
});
