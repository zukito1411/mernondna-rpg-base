import { describe, it, expect } from 'vitest';
import { ART_SHEETS, ART_BY_KEY, artFrameSize, artScale, actorArtLayout, PLAYER_ANIMATIONS } from '../src/data/art';
import { sampleTerrainGrid, seamlessTerrainPixels, TERRAIN_MASK_SIZE } from '../src/game/systems/terrainArt';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';

describe('high-detail rendering metadata', () => {
  it('retains texture density without changing actor collision-scale dimensions', () => {
    for (const key of ['leigneron','npcs','enemies'] as const) {
      const sheet = ART_BY_KEY[key];
      expect(sheet.frameHeight * sheet.density).toBe(key === 'enemies' ? 160 : 320);
      expect(sheet.frameHeight * sheet.density * artScale(key)).toBe(80);
      const layout = actorArtLayout(key);
      expect(layout.bodyY - sheet.frameHeight * layout.originY).toBe(-2);
      expect(layout.bodyX - sheet.frameWidth / 2).toBe(-9);
    }
    const hero = artFrameSize('leigneron',0), cottage = artFrameSize('world_objects',0);
    expect(hero.height).toBeGreaterThan(68);
    expect(cottage.height / hero.height).toBeLessThan(2);
    expect(cottage.width).toBeGreaterThan(150);
    expect(artFrameSize('world_assets',0).height).toBeGreaterThan(120);
  });
  it('matches opposite terrain borders without reflecting the panel interior', () => {
    const size = 16, source = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4; source.set([x * 12,y * 10,100,255],i);
    }
    const pixels = seamlessTerrainPixels(source,size,3);
    for (let i = 0; i < size; i++) {
      expect([...pixels.slice(i * size * 4,i * size * 4 + 4)]).toEqual([...pixels.slice((i * size + size - 1) * 4,(i * size + size) * 4)]);
      expect([...pixels.slice(i * 4,i * 4 + 4)]).toEqual([...pixels.slice(((size - 1) * size + i) * 4,((size - 1) * size + i + 1) * 4)]);
    }
    const center = (8 * size + 8) * 4;
    expect(pixels.slice(center,center + 4)).toEqual(source.slice(center,center + 4));
  });
  it('packs every atlas inside a mobile-safe 4096-pixel texture', () => {
    for (const sheet of ART_SHEETS) {
      const columns = sheet.atlasColumns ?? sheet.columns;
      expect(columns * sheet.frameWidth * sheet.density).toBeLessThanOrEqual(4096);
      expect(Math.ceil(sheet.columns / columns) * sheet.frameHeight * sheet.density).toBeLessThanOrEqual(4096);
    }
    expect(PLAYER_ANIMATIONS.find(a => a.key === 'leigneron-right')!.frames).toEqual([12,13,14,15,16,17]);
  });
  it('samples identical transition neighbors on adjacent chunk borders', () => {
    const world = new WorldGenerator(), sample = (x: number, y: number) => world.getTerrainIndex(world.getTerrainAt(x,y));
    const a = sampleTerrainGrid(22,25,sample), b = sampleTerrainGrid(23,25,sample), below = sampleTerrainGrid(22,26,sample);
    for (let i = 0; i < TERRAIN_MASK_SIZE; i++) {
      expect(a[i * TERRAIN_MASK_SIZE + TERRAIN_MASK_SIZE - 1]).toBe(b[i * TERRAIN_MASK_SIZE + 1]);
      expect(a[i * TERRAIN_MASK_SIZE + TERRAIN_MASK_SIZE - 2]).toBe(b[i * TERRAIN_MASK_SIZE]);
      expect(a[(TERRAIN_MASK_SIZE - 1) * TERRAIN_MASK_SIZE + i]).toBe(below[TERRAIN_MASK_SIZE + i]);
    }
    expect(sampleTerrainGrid(22,25,sample)).toEqual(a);
  });
});
