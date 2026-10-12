import { describe, expect, it } from 'vitest';
import { CHUNK_SIZE } from '../src/data/world';
import type { ContentState, ContentWorldState } from '../src/game/types';
import { ContentChunkManager } from '../src/game/systems/ContentChunkManager';

const point = (chunk = 4) => ({ x: (chunk + .5) * CHUNK_SIZE, y: 4.5 * CHUNK_SIZE });
type Actor = ContentState & { id: string };

function packSave(): ContentWorldState {
  return { states: {}, nextSpawnSequence: 4, spawns: Object.fromEntries(
    Array.from({ length: 4 }, (_, i) => [`spawn:${i}`, {
      id: `spawn:${i}`, kind: 'creature' as const, enemyId: 'gray-wolf', world: point(),
      wolfPackId: 'wolf-pack:0', wolfAlpha: i === 0,
    }]),
  ) };
}

function fixture(saved = packSave(), initialBudget = 4) {
  let live = 0, budget = initialBudget, created = 0;
  const blocked = new Set<string>();
  const manager = new ContentChunkManager<Actor>([], saved, {
    initialState: d => ({ ...d.world, hp: 42 }),
    canActivate: d => !blocked.has(d.id) && live < budget,
    canActivateGroup: members => members.length <= budget - live,
    create: (d, s) => { live++; created++; return { ...s, id: d.id }; },
    position: a => a,
    capture: (_d, a) => ({ x: a.x, y: a.y, hp: a.hp }),
    destroy: () => { live--; },
  });
  return { manager, blocked, counts: () => ({ live, created }), setBudget: (value: number) => { budget = value; } };
}

describe('wolf group streaming admission', () => {
  it('repairs duplicate legacy alpha flags without discarding identities or damage',()=>{
    const saved=packSave();saved.spawns['spawn:1'].wolfAlpha=true;saved.states['spawn:1']={...point(),hp:17};
    const {manager}=fixture(saved);
    expect(Object.values(manager.snapshot().spawns).filter(d=>d.wolfAlpha)).toHaveLength(1);
    expect(manager.getDefinition('spawn:1')).toMatchObject({wolfAlpha:false,encounterBehavior:{role:'flanker'}});
    expect(manager.getState('spawn:1')!.hp).toBe(17);
  });
  it('persists legacy homes and stable flank slots rather than reanchoring them to a chased position',()=>{
    const {manager}=fixture();
    const before=manager.getDefinition('spawn:2')!;
    expect(before).toMatchObject({encounterBehavior:{role:'flanker',slot:2,home:point()}});
    manager.patchState('spawn:2',{x:point().x+500,y:point().y,hp:17});
    const restored=fixture(JSON.parse(JSON.stringify(manager.snapshot()))).manager;
    expect(restored.getDefinition('spawn:2')).toMatchObject({encounterBehavior:(before as import('../src/game/types').CreatureContentDefinition).encounterBehavior});
    expect(restored.getState('spawn:2')!.hp).toBe(17);
  });
  it('admits a generic non-wolf encounter together and keeps its identity after reconstruction', () => {
    const saved = packSave();
    for (const definition of Object.values(saved.spawns)) {
      definition.enemyId = 'road-bandit';
      definition.encounterId = 'encounter:0';
      delete definition.wolfPackId;
      delete definition.wolfAlpha;
    }
    const { manager, counts, setBudget } = fixture(saved, 3);
    manager.update(point().x, point().y);
    expect(counts().created).toBe(0);
    setBudget(4);
    manager.update(point().x, point().y);
    expect(manager.getEncounterActors('encounter:0')).toHaveLength(4);
    const restored = fixture(JSON.parse(JSON.stringify(manager.snapshot())));
    restored.manager.update(point().x, point().y);
    expect(restored.manager.getEncounterActors('encounter:0')).toHaveLength(4);
    expect(restored.manager.getWolfPackActors('encounter:0')).toHaveLength(0);
  });

  it('keeps a wolf pack together when legacy and extended records are mixed', () => {
    const saved = packSave();
    for (const [id, definition] of Object.entries(saved.spawns)) {
      if (id !== 'spawn:0') definition.encounterId = definition.wolfPackId;
    }
    const { manager, counts, setBudget } = fixture(saved, 3);
    manager.update(point().x, point().y);
    expect(counts().created).toBe(0);
    setBudget(4);
    manager.update(point().x, point().y);
    expect(manager.getWolfPackActors('wolf-pack:0')).toHaveLength(4);
  });

  it('does not merge a non-wolf encounter with a wolf pack using the same textual ID', () => {
    const saved = packSave();
    saved.spawns['spawn:4'] = { id: 'spawn:4', kind: 'creature', enemyId: 'road-bandit', world: point(),
      encounterId: 'wolf-pack:0' };
    saved.nextSpawnSequence = 5;
    const { manager, setBudget } = fixture(saved, 4);
    manager.update(point().x, point().y);
    expect(manager.getWolfPackActors('wolf-pack:0')).toHaveLength(4);
    expect(manager.getEncounterActors('wolf-pack:0')).toHaveLength(0);
    setBudget(5);
    manager.update(point().x, point().y);
    expect(manager.getEncounterActors('wolf-pack:0')).toHaveLength(1);
  });

  it('defers the whole pack until all required actor slots are available', () => {
    const { manager, counts, setBudget } = fixture(packSave(), 3);
    for (let i = 0; i < 5; i++) manager.update(point().x, point().y);
    expect(counts()).toEqual({ live: 0, created: 0 });
    expect(Object.keys(manager.snapshot().spawns)).toHaveLength(4);
    setBudget(4);
    manager.update(point().x, point().y);
    expect(counts()).toEqual({ live: 4, created: 4 });
    manager.update(point().x, point().y);
    expect(counts().created).toBe(4);
  });

  it('rejects the entire pending group if one member has a blocked position', () => {
    const { manager, blocked, counts } = fixture();
    blocked.add('spawn:2');
    manager.update(point().x, point().y);
    expect(counts().created).toBe(0);
    blocked.clear();
    manager.update(point().x, point().y);
    expect(counts().live).toBe(4);
  });

  it('restores surviving members with their saved HP and alpha identity', () => {
    const { manager, counts } = fixture();
    manager.update(point().x, point().y);
    manager.getActor('spawn:0')!.hp = 18;
    manager.patchState('spawn:1', { hp: 0, defeated: true });
    manager.update(point(20).x, point().y);
    expect(counts().live).toBe(0);
    const restored = fixture(JSON.parse(JSON.stringify(manager.snapshot())), 3);
    restored.manager.update(point().x, point().y);
    expect(restored.counts().live).toBe(3);
    expect(restored.manager.getActor('spawn:1')).toBeUndefined();
    expect(restored.manager.getActor('spawn:0')!.hp).toBe(18);
    expect(restored.manager.getDefinition('spawn:0')).toMatchObject({ wolfPackId: 'wolf-pack:0', wolfAlpha: true });
  });

  it('does not load distant members or partially activate a boundary-spanning pending pack', () => {
    const saved = packSave();
    saved.states['spawn:3'] = point(6);
    const { manager, counts } = fixture(saved);
    manager.update(point(4).x, point().y);
    expect(counts().created).toBe(0);
    manager.update(point(5).x, point().y); // Both chunks 4 and 6 now lie inside the neighborhood.
    expect(counts().live).toBe(4);
  });

  it('rejoins existing active members without duplicates after individual boundary unloading', () => {
    const { manager, counts } = fixture();
    manager.update(point().x, point().y);
    manager.getActor('spawn:3')!.x = point(6).x;
    manager.update(point(4).x, point().y);
    expect(counts().live).toBe(3);
    expect(manager.getActor('spawn:3')).toBeUndefined();
    manager.update(point(5).x, point().y);
    expect(counts()).toEqual({ live: 4, created: 5 });
    expect(new Set(manager.getActiveIds()).size).toBe(4);
    manager.destroy();
    expect(counts().live).toBe(0);
  });
});
