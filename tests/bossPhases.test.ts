import {expect,it} from 'vitest';
import {BOSS_COMBAT_PROFILES,TOWER_BOSS_PROFILES,CAVE_LEADER_PROFILES,VARKHUL_WORLD_PROFILE,
 worldBossCombatProfile} from '../src/data/bossCombatProfiles';
import {BossPhaseState,BOSS_PHASE_TWO_TRANSITION_MS,parseBossPhaseSnapshot} from '../src/game/systems/BossPhaseState';

it('latches spent resolve even at full HP; only explicit encounter recovery resets it',()=>{
 const phase=new BossPhaseState(),profile=BOSS_COMBAT_PROFILES['captain-varr'];
 for(const hp of [100,60,50,1])expect(phase.deplete(profile,hp)).toBe(false);
 expect(phase.phase).toBe(1);expect(phase.deplete(profile,0)).toBe(true);
 expect(phase.phase).toBe(2);expect(phase.advance(BOSS_PHASE_TWO_TRANSITION_MS-1)).toBe(false);
 expect(phase.advance(1)).toBe(true);expect(phase.transitioning).toBe(false);
 expect(phase.deplete(profile,0)).toBe(false);expect(phase.phase).toBe(2);
 expect(phase.deplete(profile,100)).toBe(false);expect(phase.phase).toBe(2);
 phase.reset();expect(phase.phase).toBe(1);
});

it('smoothly refills the real HP to full once, including when resuming a saved roar',()=>{
 const phase=new BossPhaseState(),profile=BOSS_COMBAT_PROFILES['captain-varr'];
 expect(phase.deplete(profile,0)).toBe(true);
 expect(phase.refillHp(100)).toBe(0);
 phase.advance(BOSS_PHASE_TWO_TRANSITION_MS/2);expect(phase.refillHp(100)).toBe(50);
 const restored=new BossPhaseState();restored.restore(phase.snapshot()!);
 expect(restored.phase).toBe(2);expect(restored.refillHp(100)).toBe(50);
 expect(restored.advance(BOSS_PHASE_TWO_TRANSITION_MS/2)).toBe(true);expect(restored.refillHp(100)).toBe(100);
 expect(restored.deplete(profile,0)).toBe(false);
 const complete=new BossPhaseState();complete.restore(restored.snapshot()!);
 expect(complete.phase).toBe(2);expect(complete.transitioning).toBe(false);
});

it('repairs optional roar metadata without rejecting old saves or restoring a spent dot',()=>{
 expect(parseBossPhaseSnapshot(undefined)).toBeUndefined();
 expect(parseBossPhaseSnapshot({phase:1})).toBeUndefined();
 expect(parseBossPhaseSnapshot({phase:2,refill:{elapsedMs:400,startRatio:.4}}))
  .toEqual({phase:2,refill:{elapsedMs:400,startRatio:.4}});
 for(const elapsedMs of [NaN,-1,Infinity,1250])
  expect(parseBossPhaseSnapshot({phase:2,refill:{elapsedMs,startRatio:.4}})).toEqual({phase:2});
});

it('uses the tower phase-two profile for every ascended world boss, including Varkhul',()=>{
 const ids=['captain-varr','moonlit-warden','stonejaw-troll','iron-tusk','rootfather','salt-king','frost-wyrm','ashen-seer','varkhul'];
 for(const [index,id] of ids.entries()){
  expect(worldBossCombatProfile(id,true)).toBe(TOWER_BOSS_PROFILES[index]);
  expect(worldBossCombatProfile(id,false)?.phaseTwo).toBeDefined();
 }
 expect(worldBossCombatProfile('varkhul',false)).toBe(VARKHUL_WORLD_PROFILE);
});

it('gives every boss phase-exclusive moves, bounded hazards and complete warning/recovery windows',()=>{
 const profiles=[...Object.values(BOSS_COMBAT_PROFILES),VARKHUL_WORLD_PROFILE,...TOWER_BOSS_PROFILES,...Object.values(CAVE_LEADER_PROFILES)];
 for(const profile of profiles){
  expect(profile.phaseTwo?.name).toBeTruthy();expect(profile.phaseTwo?.announcement).toBeTruthy();
  expect(profile.enrageCooldownMultiplier).toBeLessThan(1);
  const firstPhase=new Set(profile.patterns.flatMap(combo=>combo.map(move=>move.id)));
  expect(profile.enraged.flat().some(move=>!firstPhase.has(move.id))).toBe(true);
  for(const combo of profile.enraged){
   expect(combo.length).toBeLessThanOrEqual(3);
   for(const move of combo){
    expect(move.windup).toBeGreaterThanOrEqual(500);expect(move.recovery).toBeGreaterThanOrEqual(400);
    expect(move.zones?.length??0).toBeLessThanOrEqual(6);
    if(move.dragonAftershock){
     expect(move.dragonAftershock.windup).toBeGreaterThanOrEqual(1000);
     expect(move.dragonAftershock.innerRadius).toBeLessThan(move.dragonAftershock.radius);
    }
   }
  }
 }
});

it('authors real multi-action dragon rage combos rather than silently taking only the first action',()=>{
 for(const profile of [VARKHUL_WORLD_PROFILE,TOWER_BOSS_PROFILES[8]]){
  expect(profile.enraged.every(combo=>combo.length>=2)).toBe(true);
  expect(profile.enraged.flat().some(move=>move.dragonAftershock)).toBe(true);
  expect(profile.enraged.flat().every(move=>move.dragonAction)).toBe(true);
 }
});
