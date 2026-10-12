import { describe, expect, it } from 'vitest';
import { ENEMY_BY_ID } from '../src/data/enemies';
import { creatureFitsHabitat, creatureHabitatWeight, hostileCapacity, type CreatureHabitat } from '../src/game/systems/encounterAdmission';

const forest: CreatureHabitat = { region: 'narenthil', biome: 'forest', terrain: 'forest' };

describe('encounter admission foundation', () => {
  it('applies native weights and habitat to the candidate rather than the player', () => {
    const wolf = ENEMY_BY_ID['gray-wolf'];
    expect(creatureHabitatWeight(wolf, forest, false)).toBe(8);
    expect(creatureHabitatWeight(wolf, forest, true)).toBe(10);
    expect(creatureHabitatWeight(wolf, { ...forest, region: 'darkav' }, true)).toBe(0);
    expect(creatureFitsHabitat(wolf, { ...forest, biome: 'coast' })).toBe(false);
    const wraith = ENEMY_BY_ID['marsh-wraith'];
    expect(creatureFitsHabitat(wraith, { ...forest, region: 'druganwoods' })).toBe(false);
    expect(creatureFitsHabitat(wraith, { region: 'druganwoods', biome: 'wetland', terrain: 'marsh' })).toBe(true);
  });

  it('retains the boss helper exception without allowing forbidden surfaces', () => {
    const wolf = ENEMY_BY_ID['gray-wolf'];
    const snow: CreatureHabitat = { region: 'frostlands', biome: 'snowfield', terrain: 'snow' };
    expect(creatureFitsHabitat(wolf, snow)).toBe(false);
    expect(creatureFitsHabitat(wolf, snow, true)).toBe(true);
    for (const terrain of ['water', 'lava', 'farmland'] as const)
      expect(creatureFitsHabitat(wolf, { ...snow, terrain }, true)).toBe(false);
    expect(creatureFitsHabitat(wolf, { ...snow, region: 'dead-sea' }, true)).toBe(false);
    expect(creatureHabitatWeight(ENEMY_BY_ID['bandit-captain'], forest, true)).toBe(0);
  });

  it('reserves boss and reinforcement slots, including queued creature records', () => {
    expect(hostileCapacity(4, 'spawn', 1, 6, 2)).toBe(3);
    expect(hostileCapacity(4, 'summon', 1, 6, 2)).toBe(9);
    expect(hostileCapacity(14, 'spawn', 1, 2)).toBe(0);
    expect(hostileCapacity(15, 'boss', 1, 6, 8)).toBe(1);
    expect(hostileCapacity(16, 'boss', 0, 0)).toBe(0);
  });

  it('does not charge queued records twice while restoring them', () => {
    expect(hostileCapacity(4, 'restore', 1, 6, 20)).toBe(11);
    expect(hostileCapacity(4, 'spawn', 1, 6, 20)).toBe(0);
    // Density limits are independent of reserved slots, not reduced twice.
    expect(hostileCapacity(0, 'spawn', 1, 6, 0, 9)).toBe(9);
    expect(hostileCapacity(4, 'spawn', 0, 0, 2, 7)).toBe(1);
  });
});
