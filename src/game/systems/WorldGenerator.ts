import { createNoise2D } from 'simplex-noise';
import type { RegionId, TerrainKind } from '../types';
import { REGIONS } from '../../data/regions';
import { TOWN_BY_ID, TOWNS } from '../../data/towns';
import { onRoadRoute } from '../../data/roadRoutes';
import { onHighmereBridge, onHighmereRiver, onSettlementRiver } from '../../data/rivers';
import { CHUNK_SIZE, WORLD_SEED, WORLD_WIDTH, WORLD_HEIGHT } from '../../data/world';
import { seededRandom } from '../../utils/seededRandom';
import { FARM_PLOTS } from '../../data/landmarks';
import { settlementAt, settlementTerrain, onStreet, protectedSettlementAt } from '../../data/settlements';
import { fortificationBlocksPoint } from '../../data/fortifications';

const noise2D = createNoise2D(seededRandom(WORLD_SEED));

const TERRAIN_INDEX: Record<TerrainKind, number> = {
  grass: 0,
  forest: 4,
  dirt: 1,
  stone: 2,
  snow: 6,
  ash: 8,
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
    if (onHighmereRiver(worldX,worldY)) return onHighmereBridge(worldX,worldY) ? 'stone' : 'water';

    const layout = settlementAt(worldX,worldY);
    if (layout) {
      const town = TOWN_BY_ID[layout.townId];
      return settlementTerrain(layout,worldX - town.world.x,worldY - town.world.y);
    }

    if(onSettlementRiver(worldX,worldY)) return 'water';

    if (this.isRoad(worldX, worldY)) return 'dirt';
    if (FARM_PLOTS.some(plot => Math.abs(worldX - plot.x) < plot.width / 2 && Math.abs(worldY - plot.y) < plot.height / 2)) return 'farmland';

    const region = REGIONS.find((entry) => entry.id === regionId);
    if (!region) return 'grass';

    const n = noise2D(worldX * 0.0018, worldY * 0.0018);
    const detail = noise2D(worldX * 0.008, worldY * 0.008);
    const cibar=TOWN_BY_ID['cibar-plains'].world;
    if(regionId==='druganwoods'&&Math.hypot((worldX-cibar.x)/1.3,worldY-cibar.y)<4200)
      return n>-.6?'grass':'forest';

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
      && worldX < WORLD_WIDTH && worldY < WORLD_HEIGHT && this.getTerrainAt(worldX, worldY) !== 'water'
      && !fortificationBlocksPoint(worldX,worldY);
  }

  canCreatureOccupy(worldX: number, worldY: number) {
    return this.isWalkable(worldX,worldY) && !protectedSettlementAt(worldX,worldY);
  }

  isRoad(worldX: number, worldY: number, clearance = 0) {
    const layout = settlementAt(worldX,worldY);
    if (layout) {
      const town = TOWN_BY_ID[layout.townId];
      if (layout.streets.some(s => onStreet(worldX - town.world.x,worldY - town.world.y,s,clearance))) return true;
    }
    return onRoadRoute(worldX,worldY,clearance);
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
