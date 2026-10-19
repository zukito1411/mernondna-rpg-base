import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useGameStore} from '../src/store/gameStore';
import {CONTENT_BY_ID,WORLD_CONTENT,initialContentState} from '../src/data/content';
import {ContentChunkManager} from '../src/game/systems/ContentChunkManager';
import {QUEST_BY_ID} from '../src/data/quests';
import {allowExplicitNewGame,createSaveBackupExport,getSaveRecoveryNotice,hasSavedGame,importSaveBackup,
  inspectSaveImport,loadGame,parseSave,SAVE_KEY,saveGame,setSaveSnapshotProvider,watchProgressSaves} from '../src/utils/save';

let values:Map<string,string>;
let storage:{getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
let stopWatching:(()=>void)|undefined;
beforeEach(()=>{
  vi.useFakeTimers();
  values=new Map();
  storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};
  vi.stubGlobal('localStorage',storage);
  allowExplicitNewGame();setSaveSnapshotProvider();useGameStore.getState().resetGame();
});
afterEach(()=>{
  stopWatching?.();stopWatching=undefined;setSaveSnapshotProvider();
  vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();
});

describe('save, restore and recovery',()=>{
  it('round-trips the real world ledger, quest evidence and discoveries through new authored placements',()=>{
    const states=Object.fromEntries(WORLD_CONTENT.map(d=>[d.id,initialContentState(d)]));
    for(const id of ['collect:cibar-fitting:0','story:frost-lantern','loot:pirate-flagship:cargo','discovery:clan-road-muster'])
      states[id]={x:1,y:1,used:true}; // Coordinates from a previous art/layout revision.
    states['detail:retired-art-decoration']={x:1,y:1};
    const quest=useGameStore.getState().quests['first-road'];
    const objective=QUEST_BY_ID['first-road'].objectives[0];
    useGameStore.getState().hydrate({gold:281,hp:73,stamina:41,day:9,minuteOfDay:1234,
      inventory:['roadwarden-sword','verdant-adderblade'],weaponId:'verdant-adderblade',
      consumables:{'healing-potion':3,'stamina-potion':2},unlockedTownShrines:['oakmere','elarion'],
      worldContent:{states,spawns:{},nextSpawnSequence:0},
      quests:{...useGameStore.getState().quests,'first-road':{...quest,objectiveProgress:{[objective.id]:objective.amount}}},
      storyFlags:{...useGameStore.getState().storyFlags,'encounter:winter-signal:complete':true},
      storyChoices:{'first-road':'leigneron-protector'},trackedQuestId:'first-road'});
    useGameStore.getState().discoverCreature('gray-wolf',undefined,true);
    useGameStore.getState().discoverRecord('characters','joren-pike');
    expect(saveGame()).toBe(true);
    useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    const loaded=useGameStore.getState();
    expect(loaded).toMatchObject({gold:281,hp:73,stamina:41,day:9,minuteOfDay:1234,
      weaponId:'verdant-adderblade',consumables:{'healing-potion':3,'stamina-potion':2},
      unlockedTownShrines:['oakmere','elarion'],storyChoices:{'first-road':'leigneron-protector'},trackedQuestId:'first-road'});
    expect(loaded.quests['first-road'].objectiveProgress[objective.id]).toBe(objective.amount);
    expect(loaded.journal.creatures['gray-wolf']).toBe(1);
    expect(loaded.journal.characters).toContain('joren-pike');
    expect(loaded.worldContent.states['detail:retired-art-decoration']).toBeUndefined();
    const manager=new ContentChunkManager(WORLD_CONTENT,loaded.worldContent,{initialState:initialContentState,
      create:(_d,state)=>({...state}),position:actor=>actor,capture:(_d,actor)=>actor,destroy:()=>{}});
    for(const id of ['collect:cibar-fitting:0','story:frost-lantern','loot:pirate-flagship:cargo','discovery:clan-road-muster']){
      const d=CONTENT_BY_ID[id];manager.update(d.world.x,d.world.y);
      expect(manager.getState(id)).toMatchObject({...d.world,used:true});
    }
    useGameStore.getState().setContentWorld(manager.snapshot());
    expect(saveGame()).toBe(true);
    expect(parseSave(values.get(SAVE_KEY)!)).not.toBeNull();
  });

  it('coalesces ordinary progress and flushes the latest simulation snapshot',()=>{
    const write=vi.spyOn(storage,'setItem');
    const initialGold=useGameStore.getState().gold;
    stopWatching=watchProgressSaves();
    setSaveSnapshotProvider(()=>useGameStore.getState().hydrate({hp:67,worldX:35000}));
    useGameStore.getState().addRewards(0,1);
    vi.advanceTimersByTime(500);
    useGameStore.getState().addRewards(0,2);
    vi.advanceTimersByTime(999);
    expect(values.has(SAVE_KEY)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(parseSave(values.get(SAVE_KEY)!)?.state).toMatchObject({gold:initialGold+3,hp:67,worldX:35000});
    expect(write.mock.calls.filter(([key])=>key===SAVE_KEY)).toHaveLength(1);
  });

  it('recovers a valid last-good save while retaining an unreadable primary',()=>{
    useGameStore.getState().hydrate({gold:111});expect(saveGame()).toBe(true);
    const backup=values.get(SAVE_KEY)!;
    values.set(SAVE_KEY+':last-good',backup);values.set(SAVE_KEY,'{broken');
    useGameStore.getState().resetGame();
    expect(hasSavedGame()).toBe(true);expect(loadGame()).toBe(true);
    expect(useGameStore.getState().gold).toBe(111);
    expect(values.get(SAVE_KEY+':unreadable-backup')).toBe('{broken');
    expect(getSaveRecoveryNotice()).toContain('Recovered');
    expect(saveGame()).toBe(true);
    expect(parseSave(values.get(SAVE_KEY)!)?.state.gold).toBe(111);
  });

  it('blocks overwrite if storage silently fails to preserve an unreadable primary',()=>{
    expect(saveGame()).toBe(true);
    values.set(SAVE_KEY+':last-good',values.get(SAVE_KEY)!);values.set(SAVE_KEY,'{broken');
    vi.spyOn(storage,'setItem').mockImplementation((key,value)=>{
      if(!key.includes(':unreadable-backup'))values.set(key,value);
    });
    expect(loadGame()).toBe(true);
    expect(getSaveRecoveryNotice()).toContain('Saving is blocked');
    expect(saveGame()).toBe(false);expect(values.get(SAVE_KEY)).toBe('{broken');
  });

  it('exports only unchanged stored recovery copies during a failed world load',()=>{
    useGameStore.getState().hydrate({gold:341});
    expect(saveGame()).toBe(true);
    const stored=values.get(SAVE_KEY)!;
    values.set(SAVE_KEY+':last-good',stored);
    let touchedWorld=false;
    setSaveSnapshotProvider(()=>{touchedWorld=true;throw new Error('world still loading');});
    const backup=createSaveBackupExport(false);
    const archive=JSON.parse(backup.json);
    expect(touchedWorld).toBe(false);
    expect(backup.copies).toBe(2);
    expect(archive.copies).toEqual([
      {slot:'primary',raw:stored},
      {slot:'last-good',raw:stored},
    ]);
    expect(values.get(SAVE_KEY)).toBe(stored);
    expect(inspectSaveImport(backup.json).level).toBe(useGameStore.getState().level);
  });

  it('exports, imports and reloads a portable backup without a stale-session overwrite',()=>{
    useGameStore.getState().hydrate({gold:123});expect(saveGame()).toBe(true);
    const exported=createSaveBackupExport(),preview=inspectSaveImport(exported.json);
    useGameStore.getState().hydrate({gold:456});expect(saveGame()).toBe(true);
    const previous=values.get(SAVE_KEY)!;
    importSaveBackup(preview);
    expect(values.get(SAVE_KEY+':pre-import-backup')).toBe(previous);
    expect(saveGame()).toBe(false); // pagehide/visibility cannot undo the import.
    useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
    expect(useGameStore.getState().gold).toBe(123); // Imported primary beats a newer backup.
    expect(saveGame()).toBe(true);
  });

  it('preserves the primary and all recovery copies when an import backup cannot be written',()=>{
    expect(saveGame()).toBe(true);
    const preview=inspectSaveImport(values.get(SAVE_KEY)!);
    useGameStore.getState().hydrate({gold:500});expect(saveGame()).toBe(true);
    const primary=values.get(SAVE_KEY)!;
    vi.spyOn(storage,'setItem').mockImplementation((key,value)=>{
      if(key.endsWith(':pre-import-backup'))throw new Error('quota exceeded');
      values.set(key,value);
    });
    expect(()=>importSaveBackup(preview)).toThrow('Cannot protect your existing save');
    expect(values.get(SAVE_KEY)).toBe(primary);
    expect(useGameStore.getState().gold).toBe(500);
  });

  it('retains the previous valid snapshot when new progress is invalid or storage is full',()=>{
    expect(saveGame()).toBe(true);const prior=values.get(SAVE_KEY)!;
    useGameStore.getState().hydrate({hp:0});expect(saveGame()).toBe(false);
    expect(values.get(SAVE_KEY)).toBe(prior);
    useGameStore.getState().hydrate({hp:73});
    vi.spyOn(storage,'setItem').mockImplementation(()=>{throw new Error('quota exceeded');});
    expect(saveGame()).toBe(false);expect(values.get(SAVE_KEY)).toBe(prior);
    useGameStore.getState().resetGame();expect(loadGame()).toBe(true);
  });
});
