import { CHUNK_TILES, CHUNK_SIZE, TILE_SIZE } from '../../data/world';

export const TERRAIN_PATTERN_SIZE = 256;
export const TERRAIN_MASK_SIZE = CHUNK_TILES + 2;

// Match opposite borders without mirroring entire panels into kaleidoscopes.
// Only a narrow edge band is cross-faded; source illustrations stay untouched.
export function seamlessTerrainPixels(source: Uint8ClampedArray, size: number, feather = 24) {
  const result = new Uint8ClampedArray(source);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const wx = Math.max(0,1 - Math.min(x,size - 1 - x) / feather) * .5;
    const wy = Math.max(0,1 - Math.min(y,size - 1 - y) / feather) * .5;
    if (!wx && !wy) continue;
    const a = (y * size + x) * 4, b = (y * size + size - 1 - x) * 4;
    const c = ((size - 1 - y) * size + x) * 4, d = ((size - 1 - y) * size + size - 1 - x) * 4;
    for (let channel = 0; channel < 4; channel++) result[a + channel] = source[a + channel] * (1 - wx) * (1 - wy)
      + source[b + channel] * wx * (1 - wy) + source[c + channel] * (1 - wx) * wy + source[d + channel] * wx * wy;
  }
  return result;
}

// One cell of neighboring terrain on every side lets independently baked
// chunks interpolate exactly the same transition at their shared boundary.
export function sampleTerrainGrid(chunkX: number, chunkY: number, sample: (x: number, y: number) => number) {
  const grid = new Uint8Array(TERRAIN_MASK_SIZE * TERRAIN_MASK_SIZE);
  for (let y = 0; y < TERRAIN_MASK_SIZE; y++) for (let x = 0; x < TERRAIN_MASK_SIZE; x++) {
    grid[y * TERRAIN_MASK_SIZE + x] = sample(chunkX * CHUNK_SIZE + (x - .5) * TILE_SIZE,
      chunkY * CHUNK_SIZE + (y - .5) * TILE_SIZE);
  }
  return grid;
}
