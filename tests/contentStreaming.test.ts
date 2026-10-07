import { describe, expect, it } from 'vitest';
import { ContentChunkManager } from '../src/game/systems/ContentChunkManager';
import { chunkNeighborhood } from '../src/game/systems/chunkNeighborhood';
import { CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../src/data/world';
import type { ContentDefinition, ContentState, ContentWorldState } from '../src/game/types';

const point = (cx: number, cy = 4) => ({ x: (cx + .5) * CHUNK_SIZE, y: (cy + .5) * CHUNK_SIZE });
const definitions: ContentDefinition[] = [
  { id: 'npc:mentor', kind: 'npc', npcId: 'mentor', world: point(4) },
  { id: 'creature:wolf', kind: 'creature', enemyId: 'wolf', world: point(5) },
  { id: 'prop:fence', kind: 'prop', frame: 0, solid: true, scale: 1, world: point(4) },
  { id: 'town:home', kind: 'settlement', townId: 'home', world: point(4) },
  { id: 'town:building', kind: 'settlement-prop', frame: 0, solid: true, scale: 1, world: point(4) },
  ...(['harvestable', 'loot-container', 'dungeon-entrance', 'interactable'] as const).map(kind => ({ id: kind, kind,
    world: point(4), frame: 3, name: kind, description: 'A place beside the road.', repeatText: 'Already visited.' })),
];
type Actor = ContentState & { id: string; destroyed: boolean };
const empty = (): ContentWorldState => ({ states: {}, spawns: {}, nextSpawnSequence: 0 });
function fixture(saved = empty(), budget = Infinity) {
  let created = 0, destroyed = 0;
  const manager = new ContentChunkManager<Actor>(definitions, saved, {
    initialState: d => ({ ...d.world, ...(d.kind === 'creature' ? { hp: 42 } : {}), ...(d.kind === 'npc' ? { trust: 85 } : {}) }),
    canActivate: () => created - destroyed < budget,
    create: (d, s) => { created++; return { ...s, id: d.id, destroyed: false }; },
    position: a => a,
    capture: (_d, a) => ({ x: a.x, y: a.y, ...(a.hp !== undefined ? { hp: a.hp } : {}) }),
    destroy: a => { destroyed++; a.destroyed = true; },
  });
  return { manager, counts: () => ({ created, destroyed }) };
}

describe('content streaming', () => {
  it('uses a clipped terrain neighborhood at world edges', () => {
    expect(chunkNeighborhood(1, 1).size).toBe(4);
    expect(chunkNeighborhood(WORLD_WIDTH - 1, WORLD_HEIGHT - 1).size).toBe(4);
    expect(chunkNeighborhood(point(4).x, point(4).y).size).toBe(9);
  });
  it('loads every supported kind locally, avoids duplicates, and releases all distant actors', () => {
    const { manager, counts } = fixture();
    manager.update(point(4).x, point(4).y);
    expect(manager.getActiveIds()).toHaveLength(definitions.length);
    for (let i = 0; i < 40; i++) manager.update(point(4).x, point(4).y);
    expect(counts().created).toBe(definitions.length);
    manager.update(point(20).x, point(20).y);
    expect(manager.getActiveIds()).toHaveLength(0);
    expect(counts().destroyed).toBe(definitions.length);
  });
  it('preserves HP, location and NPC trust through unload, reload, and reconstructed save state', () => {
    const { manager } = fixture();
    manager.update(point(4).x, point(4).y);
    const wolf = manager.getActor('creature:wolf')!;
    wolf.hp = 18; wolf.x += 100;
    manager.patchState('npc:mentor', { trust: 62 });
    manager.update(point(20).x, point(20).y);
    expect(wolf.destroyed).toBe(true);
    manager.update(point(4).x, point(4).y);
    expect(manager.getActor('creature:wolf')!.hp).toBe(18);
    expect(manager.getActor('creature:wolf')!.x).toBe(wolf.x);
    const restored = fixture(JSON.parse(JSON.stringify(manager.snapshot()))).manager;
    restored.update(point(4).x, point(4).y);
    expect(restored.getActor('creature:wolf')!.hp).toBe(18);
    expect(restored.getState('npc:mentor')!.trust).toBe(62);
  });
  it('retains defeated creatures and opened containers without recreating/rewarding them', () => {
    const { manager } = fixture();
    manager.update(point(4).x, point(4).y);
    manager.patchState('creature:wolf', { hp: 0, defeated: true });
    manager.patchState('loot-container', { used: true });
    manager.update(point(20).x, point(20).y);
    const restored = fixture(manager.snapshot()).manager;
    restored.update(point(4).x, point(4).y);
    expect(restored.getActor('creature:wolf')).toBeUndefined();
    expect(restored.getState('loot-container')!.used).toBe(true);
  });
  it('reindexes a creature crossing the streaming boundary and restores it at its new position', () => {
    const { manager } = fixture();
    manager.update(point(4).x, point(4).y);
    const wolf = manager.getActor('creature:wolf')!;
    wolf.x = point(7).x;
    manager.update(point(4).x, point(4).y);
    expect(manager.getActor('creature:wolf')).toBeUndefined();
    manager.update(point(7).x, point(7).y);
    expect(manager.getActor('creature:wolf')!.x).toBe(point(7).x);
  });
  it('persists event actors with stable unique IDs and tears down without collider/actor accumulation', () => {
    const { manager, counts } = fixture();
    const id = manager.addSpawn('wolf', point(4), true);
    manager.update(point(4).x, point(4).y);
    manager.getActor(id)!.hp = 12;
    for (let i = 0; i < 8; i++) {
      manager.update(point(20).x, point(20).y); manager.update(point(4).x, point(4).y);
    }
    expect(manager.getActor(id)!.hp).toBe(12);
    const restored = fixture(manager.snapshot()).manager;
    expect(restored.addSpawn('wolf', point(4), false)).not.toBe(id);
    restored.update(point(4).x, point(4).y);
    expect(restored.getActor(id)!.hp).toBe(12);
    manager.destroy();
    expect(counts().created).toBe(counts().destroyed);
  });
  it('keeps budget-deferred logical records and activates them when slots become available', () => {
    const { manager } = fixture(empty(), 2);
    manager.update(point(4).x, point(4).y);
    expect(manager.getActiveIds()).toHaveLength(2);
    const suppressed = definitions.filter(d => !manager.getActor(d.id));
    for (const definition of suppressed) expect(manager.getState(definition.id)).toBeDefined();
    for (const id of manager.getActiveIds()) manager.patchState(id, { defeated: true });
    manager.update(point(4).x, point(4).y);
    expect(suppressed.some(d => manager.getActor(d.id) !== undefined)).toBe(true);
  });
  it('applies NPC logical relocations without an old actor overwriting their position', () => {
    const { manager } = fixture();
    manager.update(point(4).x, point(4).y);
    const old = manager.getActor('npc:mentor')!;
    manager.patchState('npc:mentor', { ...point(20), trust: 60 });
    expect(old.destroyed).toBe(true);
    manager.update(point(4).x, point(4).y);
    expect(manager.getActor('npc:mentor')).toBeUndefined();
    const restored = fixture(manager.snapshot()).manager;
    restored.update(point(20).x, point(20).y);
    expect(restored.getActor('npc:mentor')!.x).toBe(point(20).x);
    expect(restored.getActor('npc:mentor')!.trust).toBe(60);
  });
});
