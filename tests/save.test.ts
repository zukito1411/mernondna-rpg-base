import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { loadGame, parseSave, SAVE_KEY, saveGame, setSaveSnapshotProvider, watchProgressSaves } from '../src/utils/save';

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  setSaveSnapshotProvider();
  useGameStore.getState().resetGame();
});
describe('local saves', () => {
  it('saves boss death and rewards atomically before the autosave interval', () => {
    const stop = watchProgressSaves();
    useGameStore.getState().recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    const saved = parseSave(values.get(SAVE_KEY)!);
    expect(saved?.state.defeatedBosses).toContain('captain-varr');
    expect(saved?.state.xp).toBe(110);
    stop();
    useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    expect(useGameStore.getState().defeatedBosses).toContain('captain-varr');
  });
  it('flushes current simulation vitals/position before writing', () => {
    setSaveSnapshotProvider(() => useGameStore.getState().hydrate({ hp: 73, worldX: 35000 }));
    expect(saveGame()).toBe(true);
    expect(parseSave(values.get(SAVE_KEY)!)?.state.hp).toBe(73);
    expect(parseSave(values.get(SAVE_KEY)!)?.state.worldX).toBe(35000);
  });
  it('handles corrupt, unsupported and structurally invalid saves without partial hydration', () => {
    expect(parseSave('{')).toBeNull();
    expect(parseSave('{"version":99,"state":{}}')).toBeNull();
    saveGame();
    const data = JSON.parse(values.get(SAVE_KEY)!);
    for (const patch of [{ hp: -5 }, { inventory: null }, { quests: {} }, { worldX: 'bad' }, { weaponId: 'toString' }]) {
      values.set(SAVE_KEY, JSON.stringify({ ...data, state: { ...data.state, ...patch } }));
      expect(loadGame()).toBe(false);
      expect(useGameStore.getState().hp).toBe(100);
    }
  });
  it('does not crash when storage access throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('full'); } });
    expect(loadGame()).toBe(false);
    expect(saveGame()).toBe(false);
  });
  it('does not let save data replace store methods or reopen panels', () => {
    saveGame();
    const data = JSON.parse(values.get(SAVE_KEY)!);
    data.state.setVitals = 'broken'; data.state.panel = 'map';
    data.state.quests.extra = null;
    values.set(SAVE_KEY, JSON.stringify(data));
    expect(loadGame()).toBe(true);
    expect(typeof useGameStore.getState().setVitals).toBe('function');
    expect(useGameStore.getState().panel).toBeNull();
    expect(useGameStore.getState().quests.extra).toBeUndefined();
  });
  it('migrates version 1 while preserving player, quest and defeated-boss progress', () => {
    useGameStore.getState().startDialogue('aldren-vale'); useGameStore.getState().endDialogue();
    useGameStore.getState().recordEnemyDefeat('bandit-captain', 110, 30, 'captain-varr');
    saveGame();
    const old = JSON.parse(values.get(SAVE_KEY)!);
    old.version = 1; delete old.state.worldContent;
    values.set(SAVE_KEY, JSON.stringify(old));
    useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    expect(useGameStore.getState().xp).toBe(110);
    expect(useGameStore.getState().quests['first-road'].objectiveProgress['kill-varr']).toBe(1);
    expect(useGameStore.getState().worldContent.states['boss:captain-varr'].defeated).toBe(true);
    saveGame();
    expect(JSON.parse(values.get(SAVE_KEY)!).version).toBe(3);
  });
  it('preserves allocated attributes and learned skills through save/load', () => {
    useGameStore.getState().addRewards(250, 0);
    useGameStore.getState().allocateAttribute('vitality');
    useGameStore.getState().unlockSkill('iron-heart');
    expect(saveGame()).toBe(true);
    useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    expect(useGameStore.getState()).toMatchObject({
      attributes: { strength: 0, vitality: 1, agility: 0 }, statPoints: 2, skillPoints: 0,
      learnedSkills: ['iron-heart'], maxHp: 137,
    });
  });
  it('migrates version 2 saves and grants points for levels already earned', () => {
    useGameStore.getState().addRewards(750, 0);
    saveGame();
    const old = JSON.parse(values.get(SAVE_KEY)!);
    old.version = 2;
    delete old.state.attributes; delete old.state.statPoints; delete old.state.skillPoints; delete old.state.learnedSkills;
    values.set(SAVE_KEY, JSON.stringify(old));
    useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    expect(useGameStore.getState()).toMatchObject({ level: 4, statPoints: 9, skillPoints: 3 });
  });
  it('round-trips dynamic encounter HP, loot flags, and NPC trust', () => {
    useGameStore.getState().setContentWorld({ nextSpawnSequence: 1,
      spawns: { 'spawn:0': { id: 'spawn:0', kind: 'creature', enemyId: 'gray-wolf', world: { x: 35000, y: 39000 }, eventSpawn: true } },
      states: { 'spawn:0': { x: 35100, y: 39000, hp: 12 }, 'loot:oakmere-road-cache': { x: 35120, y: 39278, used: true },
        'npc:aldren-vale': { x: 34440, y: 39248, trust: 60 } } });
    saveGame(); useGameStore.getState().resetGame();
    expect(loadGame()).toBe(true);
    expect(useGameStore.getState().worldContent.states['spawn:0'].hp).toBe(12);
    expect(useGameStore.getState().worldContent.states['npc:aldren-vale'].trust).toBe(60);
    expect(useGameStore.getState().worldContent.states['loot:oakmere-road-cache'].used).toBe(true);
  });
  it('rejects invalid content identities, dead/alive contradictions and duplicate spawn IDs', () => {
    saveGame();
    const data = JSON.parse(values.get(SAVE_KEY)!);
    for (const worldContent of [
      { states: { 'unknown': { x: 1, y: 1 } }, spawns: {}, nextSpawnSequence: 0 },
      { states: { 'boss:captain-varr': { x: 35000, y: 39000, hp: 0 } }, spawns: {}, nextSpawnSequence: 0 },
      { states: {}, spawns: { 'spawn:0': { id: 'spawn:0', kind: 'creature', enemyId: 'gray-wolf', world: { x: 35000, y: 39000 }, eventSpawn: false } }, nextSpawnSequence: 0 },
    ]) expect(parseSave(JSON.stringify({ ...data, state: { ...data.state, worldContent } }))).toBeNull();
  });
});
