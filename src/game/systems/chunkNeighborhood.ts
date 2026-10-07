import { CHUNK_SIZE, STREAM_RADIUS, WORLD_CHUNKS_HEIGHT, WORLD_CHUNKS_WIDTH } from '../../data/world';

export const contentChunkKey = (x: number, y: number) => `${Math.floor(x / CHUNK_SIZE)}:${Math.floor(y / CHUNK_SIZE)}`;
export function chunkNeighborhood(x: number, y: number) {
  const keys = new Set<string>();
  const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
  for (let dy = -STREAM_RADIUS; dy <= STREAM_RADIUS; dy++) {
    for (let dx = -STREAM_RADIUS; dx <= STREAM_RADIUS; dx++) {
      const px = cx + dx, py = cy + dy;
      if (px >= 0 && py >= 0 && px < WORLD_CHUNKS_WIDTH && py < WORLD_CHUNKS_HEIGHT) keys.add(`${px}:${py}`);
    }
  }
  return keys;
}
