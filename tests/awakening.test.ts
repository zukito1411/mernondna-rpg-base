import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {useGameStore} from '../src/store/gameStore';
import {NPCS} from '../src/data/npcs';
import {isBlacksmith} from '../src/data/economy';
import {AWAKENING_PROFILES,AWAKENING_HEART_DROP_CHANCE,awakenedProc} from '../src/data/awakening';
import {WORLD_ASCENSION} from '../src/data/breakthrough';
import {enhancedWeapon,weaponUpgradeRank,enhancedProcChance} from '../src/data/weaponUpgrades';
import {WEAPON_PROFILES} from '../src/data/weaponProfiles';
import {WEAPON_BY_ID} from '../src/data/weapons';
import {progressionStats,playerDamageGrowth,BASE_ATTRIBUTES} from '../src/data/progression';
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
it('balances awakened base ATK against player growth without changing normal weapons without changing normal weapons',()=>{
 const expected=[45,52,58,64,70,76,82,89,95];
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
 expect(enhancedWeapon('varr-rededge',{'varr-rededge':5},['varr-rededge']).damage).toBe(63);
 expect(enhancedWeapon('varkhul-emberfang',{'varkhul-emberfang':5},['varkhul-emberfang']).damage).toBe(133);
});
it('keeps level 67 full-Might Strength 40 damage reasonable at every upgrade rank',()=>{
 const attributes={...BASE_ATTRIBUTES,strength:40};
 const talents=['heavy-strike','steady-edge','veteran-strike'] as const;
 const modifier=progressionStats(attributes,[...talents]).damageMultiplier*playerDamageGrowth(67);
 expect(modifier).toBeCloseTo(3.591);
 // 152 base on a +5 Varr gave 765 attack; with a true base of 45 it is 226.
 expect(Math.round(enhancedWeapon('varr-rededge',{'varr-rededge':5},['varr-rededge']).damage*modifier)).toBe(226);
 const expectedAtZero=[162,187,208,230,251,273,294,320,341];
 const expectedAtFive=[226,261,292,322,352,382,412,447,478];
 AWAKENING_PROFILES.forEach((profile,index)=>{
  const id=profile.weaponId;
  expect(Math.round(enhancedWeapon(id,{},[id]).damage*modifier)).toBe(expectedAtZero[index]);
  expect(Math.round(enhancedWeapon(id,{[id]:5},[id]).damage*modifier)).toBe(expectedAtFive[index]);
  expect(enhancedWeapon(id,{[id]:5},[id]).damage).toBeGreaterThan(enhancedWeapon(id,{[id]:5},[]).damage);
 });
});
it('caps fully ascended maximum-strength Varkhul at a predictable damage range',()=>{
 const attributes={...BASE_ATTRIBUTES,strength:60};
 const talents=['heavy-strike','steady-edge','veteran-strike'] as const;
 const multiplier=progressionStats(attributes,[...talents]).damageMultiplier*playerDamageGrowth(75);
 const damage=enhancedWeapon('varkhul-emberfang',{'varkhul-emberfang':5},['varkhul-emberfang']).damage;
 expect(multiplier).toBeCloseTo(4.536);
 expect(damage).toBe(133);
 expect(Math.round(damage*multiplier)).toBe(603);
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
