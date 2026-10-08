import { createNoise2D } from 'simplex-noise';
import type { RegionId, TerrainKind } from '../types';
import { REGIONS } from '../../data/regions';
import { TOWN_BY_ID, TOWNS } from '../../data/towns';
import { onRoadRoute,roadSurfaceAt } from '../../data/roadRoutes';
import { onHighmereBridge, onHighmereRiver, onSettlementRiver,onWildernessBridge } from '../../data/rivers';
import {drainageDistance,harborBay,harborShoreDistance,LAVA_FLOW,pathDistance,RIDGES} from '../../data/worldLandscape';
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
  marsh:9,lava:10,
};

function ellipseContains(chunkX: number, chunkY: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (chunkX - cx) / rx;
  const dy = (chunkY - cy) / ry;
  const edgeNoise = noise2D(chunkX * 0.08, chunkY * 0.08) * 0.12;
  return dx * dx + dy * dy < 1 + edgeNoise;
}

export class WorldGenerator {
  getBiomeAt(x:number,y:number){
    const region=this.getRegionAt(x,y),cx=x/CHUNK_SIZE,cy=y/CHUNK_SIZE;
    if(region==='dead-sea'||harborBay(x,y))return 'coast';
    const island=region==='portquill'?[27,70,13,11]:region==='frostlands'?[99,70,11,14]:region==='darkav'?[105,10,9,8]:[55,37,49,34];
    const coast=Math.abs(1-Math.hypot((cx-island[0])/island[2],(cy-island[1])/island[3]))*Math.min(island[2],island[3])*CHUNK_SIZE;
    if(coast<1100||harborShoreDistance(x,y)<750)return 'coast';
    if(region==='darkav')return 'volcanic';
    if(region==='frostlands')return 'snowfield';
    if(drainageDistance(x,y)<750&&region==='druganwoods'&&cy>58)return 'wetland';
    if(region==='nardorous')return pathDistance(x,y,RIDGES)<5500?'snowfield':'highland';
    if(region==='rindass')return drainageDistance(x,y)<500?'meadow':'dryland';
    const cibar=TOWN_BY_ID['cibar-plains'].world;
    if(Math.hypot((x-cibar.x)/1.3,y-cibar.y)<6500)return 'meadow';
    const cover=noise2D(x*.00012,y*.00012);
    const crown=Math.hypot(cx-25,cy-23),wood=Math.min(Math.hypot(cx-56,cy-16),Math.hypot(cx-58,cy-62));
    const transition=Math.max(0,Math.min(1,.5+(crown-wood)/18));
    return cover>.48-.83*transition?'forest':'meadow';
  }
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
    if(harborBay(worldX,worldY))return 'water';

    const layout = settlementAt(worldX,worldY);
    if (layout) {
      const town = TOWN_BY_ID[layout.townId];
      return settlementTerrain(layout,worldX - town.world.x,worldY - town.world.y);
    }

    if(onSettlementRiver(worldX,worldY)) return onWildernessBridge(worldX,worldY)?'stone':'water';

    const road=roadSurfaceAt(worldX,worldY);if(road)return road;
    if (FARM_PLOTS.some(plot => Math.abs(worldX - plot.x) < plot.width / 2 && Math.abs(worldY - plot.y) < plot.height / 2)) return 'farmland';

    const region = REGIONS.find((entry) => entry.id === regionId);
    if (!region) return 'grass';

    const biome=this.getBiomeAt(worldX,worldY),n=noise2D(worldX*.0002,worldY*.0002);
    if(biome==='coast')return regionId==='frostlands'?'snow':regionId==='darkav'?'stone':'sand';
    if(biome==='wetland')return n>.35?'grass':'marsh';
    if(biome==='snowfield')return n<-.45?'stone':'snow';
    if(biome==='highland')return n>.2?'grass':'stone';
    if(biome==='volcanic')return pathDistance(worldX,worldY,LAVA_FLOW,220)<110?'lava':n>.1?'ash':'stone';
    if(biome==='dryland')return n<-.25?'dirt':'sand';
    return biome==='forest'?'forest':'grass';
  }

  getTerrainIndex(kind: TerrainKind) {
    return TERRAIN_INDEX[kind];
  }

  isWalkable(worldX: number, worldY: number) {
    return Number.isFinite(worldX) && Number.isFinite(worldY) && worldX >= 0 && worldY >= 0
      && worldX < WORLD_WIDTH && worldY < WORLD_HEIGHT && !['water','lava'].includes(this.getTerrainAt(worldX, worldY))
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
