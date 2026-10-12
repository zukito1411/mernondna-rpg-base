import { describe, expect, it } from 'vitest';
import { ContentChunkManager } from '../src/game/systems/ContentChunkManager';
import type { ContentState, ContentWorldState } from '../src/game/types';

const point = { x: 35000, y: 39000 };
const wolves = () => Array.from({ length: 4 }, (_, i) => ({ enemyId: 'gray-wolf', world: { x: point.x + i * 40, y: point.y } }));
function fixture() {
  let failInitialization = false;
  const saved: ContentWorldState = { states: {}, spawns: {}, nextSpawnSequence: 0 };
  const manager = new ContentChunkManager<ContentState>([], saved, {
    initialState: d => {
      if (failInitialization && d.id === 'spawn:1') throw new Error('initializer failed');
      return { ...d.world, hp: 42 };
    },
    create: (_d, state) => ({ ...state }), position: actor => actor,
    capture: (_d, actor) => ({ ...actor }), destroy: () => {},
  });
  return { manager, fail: (value: boolean) => { failInitialization = value; } };
}

describe('logical encounter batch admission', () => {
  it('registers a complete wolf pack with one identity and exactly one alpha', () => {
    const { manager } = fixture();
    expect(manager.addEncounter(wolves(), false, 4, { wolfPack: true })).toEqual(['spawn:0', 'spawn:1', 'spawn:2', 'spawn:3']);
    const snapshot = manager.snapshot();
    expect(snapshot.nextSpawnSequence).toBe(4);
    const members = Object.values(snapshot.spawns);
    expect(members.every(d => d.encounterId === 'wolf-pack:0' && d.wolfPackId === 'wolf-pack:0')).toBe(true);
    expect(members.filter(d => d.wolfAlpha)).toHaveLength(1);
    expect(manager.getActiveIds()).toHaveLength(0); // Registration is not actor creation.
  });

  it('rejects insufficient capacity, partial wolves, invalid members and invalid positions without spending IDs', () => {
    const { manager } = fixture();
    const original = manager.snapshot();
    expect(manager.addEncounter(wolves(), false, 3, { wolfPack: true })).toBeNull();
    expect(manager.addEncounter(wolves().slice(0, 3), false, 4, { wolfPack: true })).toBeNull();
    expect(manager.addEncounter([], false, 4)).toBeNull();
    expect(manager.addEncounter(wolves().map(member=>({...member,world:point})),false,4,{wolfPack:true})).toBeNull();
    expect(manager.addEncounter([{ enemyId: 'unknown', world: point }], false, 1)).toBeNull();
    expect(manager.addEncounter([{ enemyId: 'bandit-captain', world: point }], false, 1)).toBeNull();
    expect(manager.addEncounter([{ enemyId: 'gray-wolf', world: { x: NaN, y: point.y } }], false, 1)).toBeNull();
    expect(manager.addEncounter([{ enemyId: 'gray-wolf', world: { x: -1, y: point.y } }], false, 1)).toBeNull();
    expect(manager.snapshot()).toEqual(original);
  });

  it('supports mixed generic encounters without inventing wolf roles', () => {
    const { manager } = fixture();
    expect(manager.addEncounter([{ enemyId: 'road-bandit', world: point },
      { enemyId: 'cave-troll', world: { x: point.x + 100, y: point.y } }], true, 2)).toHaveLength(2);
    const members = Object.values(manager.snapshot().spawns);
    expect(members.every(d => d.encounterId === 'encounter:0' && d.eventSpawn)).toBe(true);
    expect(members.every(d => d.wolfPackId === undefined && d.wolfAlpha === undefined)).toBe(true);
  });

  it('holds the persistent cap and reuses freed records without rewinding identity sequences', () => {
    const { manager } = fixture();
    for (let i = 0; i < 510; i++) manager.addSpawn('road-bandit', point, false);
    expect(manager.addEncounter(wolves(), false, 4, { wolfPack: true })).toBeNull();
    expect(manager.getNextSpawnSequence()).toBe(510);
    manager.patchState('spawn:0', { hp: 0, defeated: true });
    manager.patchState('spawn:1', { hp: 0, defeated: true });
    expect(manager.addEncounter(wolves(), false, 4, { wolfPack: true })).toEqual(['spawn:510', 'spawn:511', 'spawn:512', 'spawn:513']);
    expect(manager.getSpawnCount()).toBe(512);
    expect(manager.getNextSpawnSequence()).toBe(514);
  });

  it('keeps every new record and index absent if initial state preparation throws', () => {
    const { manager, fail } = fixture();
    const original = manager.snapshot();
    fail(true);
    expect(() => manager.addEncounter(wolves(), false, 4, { wolfPack: true })).toThrow('initializer failed');
    expect(manager.snapshot()).toEqual(original);
    expect(manager.getDefinition('spawn:0')).toBeUndefined();
    expect(manager.getPendingCreatureCount(point.x, point.y)).toBe(0);
    fail(false);
    expect(manager.addEncounter(wolves(), false, 4, { wolfPack: true })).toHaveLength(4);
  });
});
