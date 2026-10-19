import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {useGameStore} from '../src/store/gameStore';
import {NPCS} from '../src/data/npcs';
import {isBlacksmith} from '../src/data/economy';
import {AWAKENING_PROFILES,AWAKENING_HEART_DROP_CHANCE,awakenedProc} from '../src/data/awakening';
import {WORLD_ASCENSION} from '../src/data/breakthrough';
import {enhancedWeapon,weaponUpgradeRank,enhancedProcChance} from '../src/data/weaponUpgrades';
import {WEAPON_PROFILES} from '../src/data/weaponProfiles';
import {WEAPON_BY_ID} from '../src/data/weapons';
import {progressionStats} from '../src/data/progression';
import {allowExplicitNewGame,setSaveSnapshotProvider,saveGame,parseSave,SAVE_KEY} from '../src/utils/save';

beforeEach(()=>{
 const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});
 vi.useFakeTimers();vi.setSystemTime(2000000000000);allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();
});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();setSaveSnapshotProvider();});
it('gives every final form its own stronger technique without changing ordinary weapons',()=>{
 for(const p of AWAKENING_PROFILES){
  const base=WEAPON_PROFILES[p.weaponId].proc!,final=awakenedProc(p.weaponId,base,[p.weaponId]);
  expect(final.name).not.toBe(base.name);expect(final.status).toBe(base.status);
  expect(final.durationMs).toBeGreaterThan(base.durationMs);expect(final.damagePerSecond).toBeGreaterThanOrEqual(base.damagePerSecond);
  expect(enhancedProcChance(p.weaponId,base.chance,{[p.weaponId]:5},60,[p.weaponId])).toBeLessThanOrEqual(.35);
 }
 expect(enhancedWeapon('roadwarden-sword',{})).toBe(WEAPON_BY_ID['roadwarden-sword']);
});
it('assigns ascending awakened base ATK from Varr 152 to Varkhul 220 without changing normal weapons',()=>{
 const expected=[152,161,169,178,186,195,203,212,220];
 expect(AWAKENING_PROFILES.map(p=>p.baseAttack)).toEqual(expected);
 for(const [index,profile] of AWAKENING_PROFILES.entries()){
  const id=profile.weaponId;
  expect(WEAPON_BY_ID[id].damage).toBeLessThan(profile.baseAttack);
  expect(enhancedWeapon(id,{},[]).damage).toBe(WEAPON_BY_ID[id].damage);
  expect(enhancedWeapon(id,{},[id]).damage).toBe(expected[index]);
  for(let rank=0;rank<=5;rank++){
   const upgrades={[id]:rank};
   const normal=enhancedWeapon(id,upgrades,[]);
   const awakened=enhancedWeapon(id,upgrades,[id]);
   expect(normal.damage).toBe(Math.round(WEAPON_BY_ID[id].damage*(1+rank*.08)));
   expect(awakened.damage).toBe(Math.round(expected[index]*(1+rank*.08)));
   expect(awakened.cooldownMs).toBe(normal.cooldownMs);
  }
 }
 expect(enhancedWeapon('varr-rededge',{'varr-rededge':5},['varr-rededge']).damage).toBe(213);
 expect(enhancedWeapon('varkhul-emberfang',{'varkhul-emberfang':5},['varkhul-emberfang']).damage).toBe(308);
});
it.each([false,true])('rolls a fixed 50% heart drop and prevents duplicate rewards (ascended=%s)',ascended=>{
 expect(AWAKENING_HEART_DROP_CHANCE).toBe(.5);
 const roll=vi.spyOn(Math,'random').mockReturnValue(.5);
 useGameStore.setState({storyFlags:ascended?{[WORLD_ASCENSION]:true}:{}});
 useGameStore.getState().recordEnemyDefeat('bandit-captain',0,0,'captain-varr');
 expect(useGameStore.getState().bossHearts).toEqual({});
 useGameStore.getState().resetGame();useGameStore.setState({storyFlags:ascended?{[WORLD_ASCENSION]:true}:{}});
 roll.mockReturnValue(.499999);
 useGameStore.getState().recordEnemyDefeat('bandit-captain',0,0,'captain-varr');
 expect(useGameStore.getState().bossHearts['captain-varr']).toBe(1);
 useGameStore.getState().recordEnemyDefeat('bandit-captain',0,0,'captain-varr');
 expect(useGameStore.getState().bossHearts['captain-varr']).toBe(1);
 useGameStore.getState().recordEnemyDefeat('stonejaw-troll',0,0,'stonejaw-troll',undefined,undefined,false);
 expect(useGameStore.getState().bossHearts['stonejaw-troll']).toBeUndefined();
});
it('consumes three hearts once, preserves enhancements and armor, and still accepts duplicate enhancements',()=>{
 const smith=NPCS.find(n=>isBlacksmith(n.id))!.id,id='varr-rededge';
 useGameStore.setState({storyFlags:{},inventory:[id],weaponUpgrades:{[id]:3},bossMaterials:{[id]:2},bossHearts:{'captain-varr':2},
  panel:null,dialogue:{npcId:smith,lines:['Let me see that blade.'],lineIndex:0}});
 const before=useGameStore.getState(),stats=progressionStats(before.attributes,before.learnedSkills,before.armorBonuses);
 before.awakenBossWeapon(smith,id);expect(useGameStore.getState().awakenedWeapons).toEqual([]);
 useGameStore.setState({bossHearts:{'captain-varr':3}});vi.advanceTimersByTime(2000);
 useGameStore.getState().awakenBossWeapon(smith,id);const after=useGameStore.getState();
 expect(after.bossHearts['captain-varr']).toBe(0);expect(after.awakenedWeapons).toEqual([id]);expect(weaponUpgradeRank(id,after.weaponUpgrades)).toBe(3);
 expect(progressionStats(after.attributes,after.learnedSkills,after.armorBonuses)).toEqual(stats);
 expect(enhancedWeapon(id,after.weaponUpgrades,after.awakenedWeapons).damage).toBeGreaterThan(enhancedWeapon(id,after.weaponUpgrades).damage);
 after.awakenBossWeapon(smith,id);expect(useGameStore.getState().bossHearts['captain-varr']).toBe(0);
 useGameStore.getState().enhanceBossWeapon(smith,id);expect(useGameStore.getState().weaponUpgrades[id]).toBe(4);expect(useGameStore.getState().bossMaterials[id]).toBe(1);
});
it('keeps legacy saves compatible and validates persistent heart and awakening records',()=>{
 const id=AWAKENING_PROFILES[0].weaponId;
 useGameStore.setState({inventory:['roadwarden-sword',id],awakenedWeapons:[id],bossHearts:{'captain-varr':3}});
 expect(saveGame()).toBe(true);const raw=JSON.parse(localStorage.getItem(SAVE_KEY)!);
 expect(parseSave(JSON.stringify(raw))?.state.awakenedWeapons).toEqual([id]);
 expect(parseSave(JSON.stringify(raw))?.state.bossHearts).toEqual({'captain-varr':3});
 raw.state.bossHearts={invented:3};expect(parseSave(JSON.stringify(raw))).toBeNull();
 delete raw.state.bossHearts;delete raw.state.awakenedWeapons;
 expect(parseSave(JSON.stringify(raw))?.state.awakenedWeapons).toEqual([]);
 expect(parseSave(JSON.stringify(raw))?.state.bossHearts).toEqual({});
});
