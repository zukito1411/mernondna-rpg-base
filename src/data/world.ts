export const TILE_SIZE = 32;
export const CHUNK_TILES = 48;
export const CHUNK_SIZE = TILE_SIZE * CHUNK_TILES;
export const WORLD_CHUNKS_WIDTH = 120;
export const WORLD_CHUNKS_HEIGHT = 90;
export const WORLD_WIDTH = WORLD_CHUNKS_WIDTH * CHUNK_SIZE;
export const WORLD_HEIGHT = WORLD_CHUNKS_HEIGHT * CHUNK_SIZE;
export const WORLD_SEED = 18472311;
export const STREAM_RADIUS = 1;

export const chunkCenter = (chunkX: number, chunkY: number) => ({
  x: chunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
  y: chunkY * CHUNK_SIZE + CHUNK_SIZE / 2,
});
