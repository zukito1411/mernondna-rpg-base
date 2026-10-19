import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useGameStore} from '../src/store/gameStore';
import {BASE_ATTRIBUTES,bossWeaponDropChance,progressionStats} from '../src/data/progression';
import {WEAPON_BY_ID} from '../src/data/weapons';
import {enhancedWeapon,enhancedProcChance} from '../src/data/weaponUpgrades';
import {allowExplicitNewGame,loadGame,SAVE_KEY,saveGame,setSaveSnapshotProvider} from '../src/utils/save';

let values:Map<string,string>;
beforeEach(()=>{
  values=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});
  allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();
  useGameStore.getState().hydrate({pendingCinematic:null});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
const defeat=()=>useGameStore.getState().recordEnemyDefeat('bandit-captain',0,0,'captain-varr');
const smith=()=>useGameStore.getState().hydrate({dialogue:{npcId:'joren-pike',lineIndex:0,lines:['Let us work at the forge.']}});

describe('rare boss weapons and matching duplicate enhancements',()=>{
  it('uses 25% base drops and the same 45% maximum shown in Status',()=>{
    expect(bossWeaponDropChance(BASE_ATTRIBUTES)).toBe(.25);
    const attributes={...BASE_ATTRIBUTES,luck:40};
    expect(bossWeaponDropChance(attributes)).toBe(.45);
    expect(progressionStats(attributes,[]).rareDropChance).toBe(.45);
  });
  it.each([[.249,true],[.25,false]])('uses the real drop boundary at roll %s',(roll,drops)=>{
    vi.spyOn(Math,'random').mockReturnValue(roll);defeat();
    expect(useGameStore.getState().inventory.includes('varr-rededge')).toBe(drops);
    // Heart and armor rewards are independent rolls; check only this boss weapon.
    expect(useGameStore.getState().rareLootQueue.filter(n=>n.weaponId==='varr-rededge')).toHaveLength(drops?1:0);
  });
  it('keeps one owned weapon, consumes exactly one matching duplicate and applies the upgrade',()=>{
    useGameStore.getState().hydrate({inventory:['roadwarden-sword','varr-rededge','stonejaw-edge'],
      bossMaterials:{'varr-rededge':2,'stonejaw-edge':3}});
    smith();const gold=useGameStore.getState().gold;
    useGameStore.getState().enhanceBossWeapon('joren-pike','varr-rededge');
    const state=useGameStore.getState(),base=WEAPON_BY_ID['varr-rededge'],weapon=enhancedWeapon(base.id,state.weaponUpgrades);
    expect(state.bossMaterials).toEqual({'varr-rededge':1,'stonejaw-edge':3});
    expect(state.inventory.filter(id=>id===base.id)).toHaveLength(1);
    expect(state.weaponUpgrades[base.id]).toBe(1);expect(state.gold).toBe(gold);
    expect(weapon.damage).toBe(Math.round(base.damage*1.08));expect(weapon.cooldownMs).toBe(Math.round(base.cooldownMs*.98));
    expect(enhancedProcChance(base.id,.18,state.weaponUpgrades,0)).toBeCloseTo(.19);
    expect(base.damage).toBeLessThan(weapon.damage);
    expect(saveGame()).toBe(true);
    expect(JSON.parse(values.get(SAVE_KEY)!).state.rareLootQueue).toBeUndefined();
    useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
    expect(useGameStore.getState().weaponUpgrades[base.id]).toBe(1);
    expect(useGameStore.getState().bossMaterials[base.id]).toBe(1);
  });
  it('converts duplicate drops into matching materials and does not reward replayed defeats',()=>{
    vi.spyOn(Math,'random').mockReturnValue(0);
    useGameStore.getState().hydrate({inventory:['roadwarden-sword','varr-rededge']});defeat();
    expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(1);
    expect(useGameStore.getState().rareLootQueue.find(n=>n.weaponId==='varr-rededge')).toMatchObject({weaponId:'varr-rededge',kind:'material'});
    defeat();expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(1);
    expect(useGameStore.getState().rareLootQueue.filter(n=>n.weaponId==='varr-rededge')).toHaveLength(1);
  });
  it('rejects another weapon’s material, missing service access and upgrades beyond +5',()=>{
    useGameStore.getState().hydrate({inventory:['roadwarden-sword','varr-rededge'],bossMaterials:{'stonejaw-edge':2}});
    smith();useGameStore.getState().enhanceBossWeapon('joren-pike','varr-rededge');
    expect(useGameStore.getState().weaponUpgrades).toEqual({});
    useGameStore.getState().hydrate({bossMaterials:{'varr-rededge':2},dialogue:null});
    useGameStore.getState().enhanceBossWeapon('joren-pike','varr-rededge');
    expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(2);
    smith();useGameStore.getState().hydrate({weaponUpgrades:{'varr-rededge':5}});
    useGameStore.getState().enhanceBossWeapon('joren-pike','varr-rededge');
    expect(useGameStore.getState().weaponUpgrades['varr-rededge']).toBe(5);
    expect(useGameStore.getState().bossMaterials['varr-rededge']).toBe(2);
  });
});
