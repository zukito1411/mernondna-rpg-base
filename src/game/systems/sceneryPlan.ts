import { createNoise2D } from 'simplex-noise';
import { CHUNK_SIZE } from '../../data/world';
import { settlementAt } from '../../data/settlements';
import { seededRandom } from '../../utils/seededRandom';
import type { Vec2 } from '../types';
import type { WorldGenerator } from './WorldGenerator';
import { ROAD_ROUTES } from '../../data/roadRoutes';
import { spriteBounds, rectTouchesStreet } from '../../data/settlementGeometry';

const standNoise = createNoise2D(seededRandom('mernondna:woodland-stands'));
export interface SceneryTree extends Vec2 { frame: 0 | 1; scale: number; id: string }
// Habitat bands produce stands and meadow openings; bounded cell jitter gives
// at least 128 world units between trunks, including neighboring chunk borders.
export function planWildernessTrees(chunkX: number, chunkY: number, world: WorldGenerator, reserved: Vec2[]): SceneryTree[] {
  const rng = seededRandom(`${chunkX}:${chunkY}:woodland`), trees: SceneryTree[] = [];
  for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
    const x = chunkX * CHUNK_SIZE + col * 256 + 64 + rng() * 128;
    const y = chunkY * CHUNK_SIZE + row * 256 + 64 + rng() * 128;
    if (settlementAt(x,y) || reserved.some(site => Math.hypot(x - site.x,y - site.y) < 180)) continue;
    const terrain = world.getTerrainAt(x,y), region = world.getRegionAt(x,y), stand = standNoise(x * .0015,y * .0015);
    const cold = region === 'nardorous' || region === 'frostlands';
    if (!(terrain === 'forest' && stand > -.5 || terrain === 'grass' && stand > .42 || cold && terrain === 'snow' && stand > .35)) continue;
    if ([[0,0],[-64,0],[64,0],[0,-64],[0,64]].some(([dx,dy]) => !world.isWalkable(x + dx,y + dy))
      || world.isRoad(x,y,90)) continue;
    const frame = cold || standNoise(x * .002 + 19,y * .002 - 31) > .45 ? 1 : 0;
    const scale=1.1+Math.max(0,stand)*.35,canopy=spriteBounds('world_assets',frame,scale,x,y);
    if(ROAD_ROUTES.some(road=>rectTouchesStreet(canopy,road,18))) continue;
    trees.push({ id:`scenery:${chunkX}:${chunkY}:${col}:${row}`,x,y,frame,scale });
  }
  return trees;
}
