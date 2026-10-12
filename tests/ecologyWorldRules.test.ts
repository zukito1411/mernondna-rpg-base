import { describe, expect, it } from 'vitest';
import { WORLD_CONTENT } from '../src/data/content';
import { ENEMIES } from '../src/data/enemies';
import { SETTLEMENT_LAYOUTS } from '../src/data/settlements';
import { TOWN_BY_ID } from '../src/data/towns';
import { CHUNK_SIZE, WORLD_CHUNKS_WIDTH, WORLD_CHUNKS_HEIGHT } from '../src/data/world';
import { LAVA_FLOW } from '../src/data/worldLandscape';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { repairCreaturePlacements } from '../src/game/systems/creaturePlacement';
import { creatureHabitatWeight, type CreatureHabitat } from '../src/game/systems/encounterAdmission';

describe('M01 actual world rules', () => {
  const world = new WorldGenerator();
  it('excludes every settlement center and authored land parcel from hostile occupancy', () => {
    for (const layout of SETTLEMENT_LAYOUTS) {
      const town = TOWN_BY_ID[layout.townId];
      expect(world.canCreatureOccupy(town.world.x, town.world.y), town.id).toBe(false);
      for (const parcel of layout.parcels)
        expect(world.canCreatureOccupy(town.world.x + parcel.x, town.world.y + parcel.y), `${town.id} parcel`).toBe(false);
    }
  });

  it('retains all authored encounter IDs while repairing their positions into valid territory', () => {
    const repaired = repairCreaturePlacements(WORLD_CONTENT, { states: {}, spawns: {}, nextSpawnSequence: 0 }, world);
    for (const definition of WORLD_CONTENT) {
      if (definition.kind !== 'creature') continue;
      const position = repaired.states[definition.id] ?? definition.world;
      expect(world.canCreatureOccupy(position.x, position.y), definition.id).toBe(true);
    }
    expect(repaired.nextSpawnSequence).toBe(0);
    expect(repaired.spawns).toEqual({});
  });

  it('uses actual candidate regions and surfaces across the map rather than inherited player weights', () => {
    const regions = new Set<string>(), surfaces = new Set<string>();
    for (let cy = 0; cy < WORLD_CHUNKS_HEIGHT; cy += 3) for (let cx = 0; cx < WORLD_CHUNKS_WIDTH; cx += 3) {
      const x = (cx + .5) * CHUNK_SIZE, y = (cy + .5) * CHUNK_SIZE;
      const habitat: CreatureHabitat = { region: world.getRegionAt(x, y), biome: world.getBiomeAt(x, y), terrain: world.getTerrainAt(x, y) };
      regions.add(habitat.region); surfaces.add(habitat.terrain);
      for (const enemy of ENEMIES) {
        const weight = creatureHabitatWeight(enemy, habitat, true);
        if (enemy.boss || !enemy.regionWeights[habitat.region] || ['water', 'lava', 'farmland'].includes(habitat.terrain))
          expect(weight, `${enemy.id} / ${habitat.region} / ${habitat.terrain}`).toBe(0);
      }
    }
    expect(regions.size).toBe(9);
    expect(surfaces.has('water')).toBe(true);
    // Narrow lava channels can fall between the coarse regional grid samples.
    const lava = LAVA_FLOW.slice(1).map((point, i) => ({ x: (point.x + LAVA_FLOW[i].x) / 2,
      y: (point.y + LAVA_FLOW[i].y) / 2 })).find(point => world.getTerrainAt(point.x, point.y) === 'lava');
    expect(lava).toBeDefined();
    const habitat: CreatureHabitat = { region: world.getRegionAt(lava!.x, lava!.y),
      biome: world.getBiomeAt(lava!.x, lava!.y), terrain: world.getTerrainAt(lava!.x, lava!.y) };
    expect(world.canCreatureOccupy(lava!.x, lava!.y)).toBe(false);
    for (const enemy of ENEMIES) expect(creatureHabitatWeight(enemy, habitat, true)).toBe(0);
  });
});
