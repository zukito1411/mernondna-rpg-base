import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {emptyJournal,discoverCreature,parseJournal,restoreJournal} from '../src/data/journal';
import {useGameStore} from '../src/store/gameStore';
import {allowExplicitNewGame,loadGame,parseSave,SAVE_KEY,saveGame,setSaveSnapshotProvider} from '../src/utils/save';

let values:Map<string,string>;
beforeEach(()=>{
  values=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});
  allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('discovered lore and save compatibility',()=>{
  it('records encounters once, counts defeats and keeps distinct boss identities',()=>{
    const j=discoverCreature(emptyJournal(),'bandit-captain','captain-varr');
    expect(j.bosses['captain-varr']).toBe(0);expect(discoverCreature(j,'bandit-captain','captain-varr')).toBe(j);
    const killed=discoverCreature(j,'bandit-captain','captain-varr',true);
    expect(killed.creatures['bandit-captain']).toBe(1);expect(killed.bosses['captain-varr']).toBe(1);
    expect(discoverCreature(killed,'road-bandit','captain-varr').bosses['captain-varr']).toBe(1);
  });
  it('unlocks characters through dialogue and regions through actual world status',()=>{
    useGameStore.getState().hydrate({pendingCinematic:null});
    useGameStore.getState().startDialogue('joren-pike');
    expect(useGameStore.getState().journal.characters).toEqual(['joren-pike']);
    useGameStore.getState().setWorldStatus(50000,50000,'narenthil',null);
    expect(useGameStore.getState().journal.regions).toContain('narenthil');
    const journal=useGameStore.getState().journal;
    useGameStore.getState().discoverRecord('regions','narenthil');expect(useGameStore.getState().journal).toBe(journal);
    useGameStore.getState().discoverRecord('characters','missing');expect(useGameStore.getState().journal).toBe(journal);
  });
  it('restores earned boss, weapon and shrine knowledge without exposing other records',()=>{
    const j=restoreJournal(emptyJournal(),{inventory:['roadwarden-sword','varr-rededge'],defeatedBosses:['captain-varr'],regionId:'trandum',unlockedTownShrines:['elarion']});
    expect(j.weapons).toEqual(['roadwarden-sword','varr-rededge']);expect(j.bosses).toEqual({'captain-varr':1});expect(j.characters).toEqual([]);expect(j.regions).toEqual(['trandum','narenthil']);
    expect(restoreJournal(j,{inventory:[],defeatedBosses:['captain-varr'],regionId:'trandum'})).toBe(j);
  });
  it('round trips discoveries and defeat counts through the existing version-6 save',()=>{
    useGameStore.getState().discoverCreature('gray-wolf',undefined,true);useGameStore.getState().discoverCreature('gray-wolf',undefined,true);
    useGameStore.getState().discoverRecord('characters','joren-pike');
    expect(saveGame()).toBe(true);const saved=values.get(SAVE_KEY)!;
    useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
    expect(useGameStore.getState().journal.creatures['gray-wolf']).toBe(2);expect(useGameStore.getState().journal.characters).toEqual(['joren-pike']);expect(parseSave(saved)?.version).toBe(6);
  });
  it('loads old version-6 saves that have no journal field',()=>{
    expect(saveGame()).toBe(true);const data=JSON.parse(values.get(SAVE_KEY)!);delete data.state.journal;
    const loaded=parseSave(JSON.stringify(data));expect(loaded).not.toBeNull();expect(loaded?.state.journal?.weapons).toContain('roadwarden-sword');expect(loaded?.state.journal?.creatures).toEqual({});
  });
  it('rejects malformed discovery data instead of hydrating arbitrary save fields',()=>{
    for(const patch of [{creatures:{'gray-wolf':-1}},{bosses:{'captain-varr':1.5}},{characters:['toString']},{weapons:['unknown']},{regions:['trandum','trandum']},{creatures:{unknown:0}}])expect(parseJournal({...emptyJournal(),...patch})).toBeNull();
    expect(saveGame()).toBe(true);const data=JSON.parse(values.get(SAVE_KEY)!);data.state.journal.creatures['gray-wolf']='bad';expect(parseSave(JSON.stringify(data))).toBeNull();
  });
});
