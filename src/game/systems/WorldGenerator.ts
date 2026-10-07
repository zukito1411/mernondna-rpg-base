import { createNoise2D } from 'simplex-noise';
import type { RegionId, TerrainKind } from '../types';
import { REGIONS } from '../../data/regions';
import { ROAD_CONNECTIONS, TOWN_BY_ID, TOWNS } from '../../data/towns';
import { CHUNK_SIZE, WORLD_SEED, WORLD_WIDTH, WORLD_HEIGHT } from '../../data/world';
import { seededRandom } from '../../utils/seededRandom';
import { FARM_PLOTS } from '../../data/landmarks';
import { settlementAt, settlementTerrain, onStreet, protectedSettlementAt } from '../../data/settlements';

const noise2D = createNoise2D(seededRandom(WORLD_SEED));

const TERRAIN_INDEX: Record<TerrainKind, number> = {
  grass: 0,
  forest: 4,
  dirt: 1,
  stone: 2,
  snow: 6,
  ash: 2,
  sand: 5,
  water: 7,
  farmland: 3,
};

function ellipseContains(chunkX: number, chunkY: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (chunkX - cx) / rx;
  const dy = (chunkY - cy) / ry;
  const edgeNoise = noise2D(chunkX * 0.08, chunkY * 0.08) * 0.12;
  return dx * dx + dy * dy < 1 + edgeNoise;
}

function pointSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSq));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export class WorldGenerator {
  getRegionAt(worldX: number, worldY: number): RegionId {
    const chunkX = worldX / CHUNK_SIZE;
    const chunkY = worldY / CHUNK_SIZE;

    if (ellipseContains(chunkX, chunkY, 105, 10, 9, 8)) return 'darkav';
    if (ellipseContains(chunkX, chunkY, 99, 70, 11, 14)) return 'frostlands';
    if (ellipseContains(chunkX, chunkY, 27, 70, 13, 11)) return 'portquill';

    if (!ellipseContains(chunkX, chunkY, 55, 37, 49, 34)) return 'dead-sea';

    const mainland = REGIONS.filter((region) => !['darkav', 'frostlands', 'portquill'].includes(region.id));
    let best = mainland[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const region of mainland) {
      const dx = chunkX - region.centerChunk.x;
      const dy = chunkY - region.centerChunk.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = region;
      }
    }
    return best.id;
  }

  getTerrainAt(worldX: number, worldY: number): TerrainKind {
    const regionId = this.getRegionAt(worldX, worldY);
    if (regionId === 'dead-sea') return 'water';

    const layout = settlementAt(worldX,worldY);
    if (layout) {
      const town = TOWN_BY_ID[layout.townId];
      return settlementTerrain(layout,worldX - town.world.x,worldY - town.world.y);
    }

    if (this.isRoad(worldX, worldY)) return 'dirt';
    if (FARM_PLOTS.some(plot => Math.abs(worldX - plot.x) < plot.width / 2 && Math.abs(worldY - plot.y) < plot.height / 2)) return 'farmland';

    const region = REGIONS.find((entry) => entry.id === regionId);
    if (!region) return 'grass';

    const n = noise2D(worldX * 0.0018, worldY * 0.0018);
    const detail = noise2D(worldX * 0.008, worldY * 0.008);

    if (regionId === 'nardorous') {
      if (n > 0.1) return 'snow';
      return detail > 0.35 ? 'dirt' : 'stone';
    }
    if (regionId === 'frostlands') return n > -0.2 ? 'snow' : 'stone';
    if (regionId === 'darkav') return n > 0.15 ? 'ash' : 'stone';
    if (regionId === 'rindass') return n > 0.2 ? 'sand' : detail > 0.35 ? 'grass' : 'dirt';
    if (regionId === 'narenthil' || regionId === 'druganwoods') return n > -0.15 ? 'forest' : 'grass';
    if (regionId === 'portquill') return n > 0.25 ? 'sand' : detail > 0.45 ? 'forest' : 'grass';
    return n > 0.45 ? 'forest' : detail < -0.48 ? 'dirt' : 'grass';
  }

  getTerrainIndex(kind: TerrainKind) {
    return TERRAIN_INDEX[kind];
  }

  isWalkable(worldX: number, worldY: number) {
    return Number.isFinite(worldX) && Number.isFinite(worldY) && worldX >= 0 && worldY >= 0
      && worldX < WORLD_WIDTH && worldY < WORLD_HEIGHT && this.getTerrainAt(worldX, worldY) !== 'water';
  }

  canCreatureOccupy(worldX: number, worldY: number) {
    return this.isWalkable(worldX,worldY) && !protectedSettlementAt(worldX,worldY);
  }

  isRoad(worldX: number, worldY: number) {
    const layout = settlementAt(worldX,worldY);
    if (layout) {
      const town = TOWN_BY_ID[layout.townId];
      if (layout.streets.some(s => onStreet(worldX - town.world.x,worldY - town.world.y,s))) return true;
    }
    for (const [aId, bId] of ROAD_CONNECTIONS) {
      const a = TOWN_BY_ID[aId]?.world;
      const b = TOWN_BY_ID[bId]?.world;
      if (!a || !b) continue;
      if (pointSegmentDistance(worldX, worldY, a.x, a.y, b.x, b.y) < 45) return true;
    }
    return false;
  }

  getTownAt(worldX: number, worldY: number, radius?: number) {
    if (radius === undefined) {
      const layout = settlementAt(worldX,worldY);
      if (layout && this.getRegionAt(worldX,worldY) !== 'dead-sea') return TOWN_BY_ID[layout.townId];
    }
    let best: (typeof TOWNS)[number] | null = null;
    let bestDistance = radius ?? 420;
    for (const town of TOWNS) {
      const distance = Math.hypot(worldX - town.world.x, worldY - town.world.y);
      if (distance < bestDistance) {
        best = town;
        bestDistance = distance;
      }
    }
    return best;
  }
}
