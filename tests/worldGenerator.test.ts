import { describe, expect, it } from 'vitest';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { TOWN_BY_ID } from '../src/data/towns';

describe('WorldGenerator', () => {
  const world = new WorldGenerator();

  it('places Oakmere in Trandum', () => {
    const oakmere = TOWN_BY_ID.oakmere.world;
    expect(world.getRegionAt(oakmere.x, oakmere.y)).toBe('trandum');
    expect(world.isWalkable(oakmere.x, oakmere.y)).toBe(true);
  });

  it('treats the far northwest corner as ocean', () => {
    expect(world.getRegionAt(32, 32)).toBe('dead-sea');
    expect(world.isWalkable(32, 32)).toBe(false);
  });

  it('places Darkav on its volcanic island', () => {
    const darkav = TOWN_BY_ID.blackspire.world;
    expect(world.getRegionAt(darkav.x, darkav.y)).toBe('darkav');
  });
});
