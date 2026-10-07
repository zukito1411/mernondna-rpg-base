import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ART_SHEETS, ART_BY_KEY, actorScaleForHeight, artFrameSize } from '../src/data/art';
import { SPRITE_PACKS, ENEMY_ANIMATIONS, ENEMY_SOURCES, enemyAnimation, animationDuration, directionFrame } from '../src/data/animationPacks';
import { alphaFrameBounds } from '../src/game/systems/spriteArt';
import { SPRITE_BOARDS, PLAYER_ATTACK_ANIMATIONS } from '../src/data/spriteBoards';
import { NPCS } from '../src/data/npcs';
import { CONTENT_BY_ID } from '../src/data/content';
import { worldPropFootprint } from '../src/data/art';

describe('supplied animation packs', () => {
  it('resolves every PNG/WebP and checks actual PNG dimensions against its manifest', () => {
    expect(SPRITE_PACKS).toHaveLength(7);
    for (const pack of SPRITE_PACKS) for (const [state,clip] of Object.entries(pack.animations)) {
      expect(clip.frames).toBeGreaterThan(0); expect(clip.frameRate).toBeGreaterThan(0);
      for (const format of ['png','webp'] as const) {
        expect(clip[format]).toBe(`assets/${pack.id}/${state}.${format}`);
        expect(existsSync(resolve('public',clip[format])),clip[format]).toBe(true);
      }
      const png = readFileSync(resolve('public',clip.png));
      expect(png.readUInt32BE(16),clip.png).toBe(pack.frameWidth * clip.frames);
      expect(png.readUInt32BE(20),clip.png).toBe(pack.frameHeight);
    }
    for (const sheet of ART_SHEETS) expect(existsSync(resolve('public',sheet.path)),sheet.path).toBe(true);
  });
  it('uses every enemy pose exactly once without assuming a six-frame boar attack', () => {
    expect(ENEMY_ANIMATIONS).toHaveLength(20); expect(ENEMY_SOURCES).toHaveLength(119);
    expect(new Set(ENEMY_SOURCES.map(source => source.name)).size).toBe(119);
    expect(enemyAnimation(2,'attack').frames).toHaveLength(5);
    expect(animationDuration(enemyAnimation(2,'attack'))).toBe(500);
    expect(new Set(ENEMY_ANIMATIONS.flatMap(a => a.frames)).size).toBe(119);
    for (let species = 0; species < 4; species++) {
      expect(enemyAnimation(species,'idle').frames[0]).toBe(species);
      for (const state of ['idle','walk','attack','hurt','death'] as const) {
        expect(enemyAnimation(species,state).repeat).toBe(state === 'idle' || state === 'walk' ? -1 : 0);
      }
    }
    expect(ART_BY_KEY.enemies.density).toBe(2);
  });
  it('keeps direction-specific idle poses and source cells within their images', () => {
    expect([directionFrame(0,1),directionFrame(-1,0),directionFrame(1,0),directionFrame(0,-1)]).toEqual([0,6,12,18]);
    for (const sheet of ART_SHEETS) if (sheet.sources) {
      expect(sheet.sources).toHaveLength(sheet.columns);
      for (const source of sheet.sources) {
        const [x,y,w,h] = source.cell;
        expect(x + w).toBeLessThanOrEqual(source.imageSize[0]); expect(y + h).toBeLessThanOrEqual(source.imageSize[1]);
      }
    }
  });
  it('trims transparency within each cell without consuming adjacent poses', () => {
    const pixels = new Uint8ClampedArray(8 * 4 * 4);
    const opaque = (x:number,y:number) => { pixels[(y * 8 + x) * 4 + 3] = 255; };
    opaque(1,1); opaque(2,2); opaque(6,0); opaque(7,3);
    expect(alphaFrameBounds(pixels,8,[0,0,4,4])).toEqual([1,1,2,2]);
    expect(alphaFrameBounds(pixels,8,[4,0,4,4])).toEqual([6,0,2,4]);
    expect(alphaFrameBounds(new Uint8ClampedArray(pixels.length),8,[0,0,4,4])).toBeNull();
  });
  it('preserves complete irregular board poses at a consistent scale without clipping sword extensions', () => {
    for (const board of SPRITE_BOARDS) {
      const png = readFileSync(resolve('public',board.path));
      expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([1536,1024]);
      expect(board.regions).toHaveLength(24);
      for (const [, ,width,height] of board.regions) {
        expect(width * board.scale).toBeLessThanOrEqual(board.frameWidth - 4);
        expect(height * board.scale).toBeLessThanOrEqual(board.frameHeight - 4);
      }
    }
    const sword = SPRITE_BOARDS.find(b => b.key === 'leigneron_attack')!;
    expect(sword.regions.some(([,,width]) => width > 256)).toBe(true);
    expect(PLAYER_ATTACK_ANIMATIONS.flatMap(a => a.frames)).toHaveLength(24);
    expect(ART_BY_KEY.leigneron_attack.frameHeight).toBe(104);
  });
  it('matches new architecture to existing places without changing their foundations or identities', () => {
    expect(NPCS.find(n => n.id === 'joren-pike')!.spriteTexture).toBe('npc_blacksmith');
    const smith = CONTENT_BY_ID['town:oakmere:building:3'];
    expect(smith).toMatchObject({ texture:'world_buildings',frame:2,footprint:worldPropFootprint(0,1) });
    expect(CONTENT_BY_ID['prop:east-watchtower']).toMatchObject({ texture:'world_buildings',frame:4,footprint:worldPropFootprint(2,1.6) });
    expect(CONTENT_BY_ID['shrine:oakmere-road']).toMatchObject({ texture:'world_buildings',frame:3 });
    expect(CONTENT_BY_ID['entrance:oakmere-old-cellar']).toMatchObject({ texture:'world_buildings',frame:4 });
  });
  it('renders every named NPC at the same 76-world-unit height', () => {
    for (const npc of NPCS) {
      const texture = npc.spriteTexture ?? 'npcs';
      const displayedHeight = artFrameSize(texture, npc.spriteFrame).height
        * actorScaleForHeight(texture, npc.spriteFrame, 76) * ART_BY_KEY[texture].density;
      expect(displayedHeight, npc.id).toBeCloseTo(76);
      expect(CONTENT_BY_ID[`npc:${npc.id}`]).toBeTruthy();
    }
  });
});
