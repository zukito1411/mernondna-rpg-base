import Phaser from 'phaser';
import { CHUNK_SIZE, TILE_SIZE } from '../../data/world';
import { WorldGenerator } from './WorldGenerator';
import { sampleTerrainGrid, seamlessTerrainPixels, TERRAIN_MASK_SIZE, TERRAIN_PATTERN_SIZE } from './terrainArt';

export class TerrainBaker {
  private readonly patterns: CanvasPattern[] = [];
  private readonly layer = document.createElement('canvas');
  private readonly mask = document.createElement('canvas');

  constructor(scene: Phaser.Scene) {
    this.layer.width = this.layer.height = CHUNK_SIZE;
    this.mask.width = this.mask.height = TERRAIN_MASK_SIZE;
    const source = scene.textures.get('terrain').getSourceImage() as CanvasImageSource;
    const size = TERRAIN_PATTERN_SIZE;
    for (let frame = 0; frame < 9; frame++) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = size;
      const ctx = tile.getContext('2d')!;
      ctx.drawImage(source,(frame===8?2:frame) * size,0,size,size,0,0,size,size);
      const pixels = ctx.getImageData(0,0,size,size);
      pixels.data.set(seamlessTerrainPixels(pixels.data,size));
      ctx.putImageData(pixels,0,0);
      if(frame===8){ctx.globalCompositeOperation='multiply';ctx.fillStyle='#777c89';ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation='source-over';}
      this.patterns.push(this.layer.getContext('2d')!.createPattern(tile, 'repeat')!);
    }
  }

  draw(ctx: CanvasRenderingContext2D, world: WorldGenerator, chunkX: number, chunkY: number) {
    const grid = sampleTerrainGrid(chunkX, chunkY, (x, y) => world.getTerrainIndex(world.getTerrainAt(x, y)));
    const layerCtx = this.layer.getContext('2d')!, maskCtx = this.mask.getContext('2d')!;
    const pixels = maskCtx.createImageData(TERRAIN_MASK_SIZE, TERRAIN_MASK_SIZE);
    ctx.fillStyle = this.patterns[0]; ctx.fillRect(0, 0, CHUNK_SIZE, CHUNK_SIZE);
    // Roads and cultivated ground sit over the natural vegetation.
    for (const frame of [4, 5, 6, 7, 8, 2, 1, 3]) {
      if (!grid.includes(frame)) continue;
      for (let i = 0; i < grid.length; i++) {
        pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
        pixels.data[i * 4 + 3] = grid[i] === frame ? 255 : 0;
      }
      maskCtx.putImageData(pixels, 0, 0);
      layerCtx.globalCompositeOperation = 'copy';
      layerCtx.fillStyle = this.patterns[frame]; layerCtx.fillRect(0, 0, CHUNK_SIZE, CHUNK_SIZE);
      layerCtx.globalCompositeOperation = 'destination-in';
      layerCtx.imageSmoothingEnabled = true;
      // Bilinear mask interpolation feathers the edge by one logical cell.
      layerCtx.imageSmoothingQuality = 'low';
      layerCtx.drawImage(this.mask, -TILE_SIZE, -TILE_SIZE, TERRAIN_MASK_SIZE * TILE_SIZE, TERRAIN_MASK_SIZE * TILE_SIZE);
      layerCtx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.layer, 0, 0);
    }
  }

  destroy() {
    this.patterns.length = 0;
    this.layer.width = this.layer.height = this.mask.width = this.mask.height = 1;
  }
}
