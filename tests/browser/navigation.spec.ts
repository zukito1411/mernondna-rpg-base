import { expect, test } from '@playwright/test';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { ContentChunkManager } from '../../src/game/systems/ContentChunkManager';
import type { Npc } from '../../src/game/entities/Npc';
import type Phaser from 'phaser';

type SceneDetails = { contentManager: ContentChunkManager<Phaser.GameObjects.Sprite | Phaser.GameObjects.Text> };
for (const viewport of [{ width: 1280,height: 720 },{ width: 844,height: 390 },{ width: 390,height: 844 }]) {
test(`navigation, sprite readability and name-label lifecycle at ${viewport.width}px`, async ({ browser }) => {
  const context = await browser.newContext({ viewport,hasTouch: viewport.width !== 1280,isMobile: viewport.width !== 1280 });
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror',e => errors.push(e.message));
  await page.goto('/?e2e');
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  await expect(page.getByRole('button',{ name: 'Open world map from minimap' })).toBeVisible();
  await expect(page.getByLabel('Quest destination: Aldren Vale')).toBeVisible();
  const details = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const m = (s as unknown as SceneDetails).contentManager;
    const alphaHeights: number[] = [];
    for (const key of ['leigneron','npcs','enemies','world_objects','world_assets']) {
      const t = s.textures.get(key), f = t.get(0), image = t.getSourceImage() as HTMLCanvasElement;
      const pixels = image.getContext('2d')!.getImageData(f.cutX,f.cutY,f.cutWidth,f.cutHeight).data;
      const rows = new Set<number>();
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 32) rows.add(Math.floor((i-3)/4/f.cutWidth));
      alphaHeights.push(rows.size);
    }
    return {
      heroFrameHeight: s.player.frame.realHeight,
      heroDisplayHeight: s.player.displayHeight,
      bodySize: [(s.player.body as Phaser.Physics.Arcade.Body).width,(s.player.body as Phaser.Physics.Arcade.Body).height],
      guardTexture: (m.getActor('npc:elara-voss') as Npc).texture.key,
      cottageWidth: (m.getActor('town:oakmere:building:1') as Phaser.GameObjects.Sprite).displayWidth,
      textureFilter: s.textures.get('leigneron').source[0].scaleMode,
      names: s.children.list.filter(n => n.name.startsWith('npc-name:')).map(n => (n as Phaser.GameObjects.Text).text),
      propFrames: m.getActiveIds().flatMap(id => {
        const actor = m.getActor(id)!;
        return actor instanceof Object && 'texture' in actor && actor.texture.key === 'world_assets' ? [Number(actor.frame.name)] : [];
      }),
      alphaHeights,
    };
  });
  expect(details.names).toHaveLength(8); expect(details.names).toContain('Aldren Vale');
  expect(details.heroFrameHeight).toBe(320); expect(details.heroDisplayHeight).toBe(80);
  expect(details.bodySize).toEqual([18,22]); expect(details.guardTexture).toBe('npc_guard');
  expect(details.cottageWidth).toBeCloseTo(224); expect(details.textureFilter).toBe(0);
  expect(new Set(details.propFrames).size).toBe(8);
  for (const height of details.alphaHeights) expect(height).toBeGreaterThan(20);
  if (viewport.width !== 1280) {
    const mini = (await page.locator('.minimap-card').boundingBox())!;
    const run = (await page.getByRole('button',{ name: 'Sprint',exact: true }).boundingBox())!;
    const joystick = (await page.getByLabel('Movement joystick').boundingBox())!;
    expect(mini.y + mini.height).toBeLessThan(run.y);
    expect(mini.x).toBeGreaterThan(joystick.x + joystick.width);
    await page.getByRole('button',{ name: 'Open world map from minimap' }).tap();
  } else await page.getByRole('button',{ name: 'Open world map from minimap' }).click();
  await expect(page.getByRole('dialog',{ name: 'Mernodna world map' })).toBeVisible();
  await page.getByRole('button',{ name: 'Close',exact: true }).click();
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const npc = (s as unknown as SceneDetails).contentManager.getActor('npc:aldren-vale') as Npc;
    s.player.restoreAt(npc.x + 45,npc.y);
  });
  await expect(page.locator('.interaction-hint')).toContainText('Talk to Aldren Vale');
  await page.screenshot({ path: `test-results/navigation-${viewport.width}.png` });
  await page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.restoreAt(31*1536+768,22*1536+848));
  await expect.poll(() => page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return s.children.list.filter(n => n.name.startsWith('npc-name:')).length;
  })).toBe(0);
  await page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.restoreAt(22*1536+768,25*1536+848));
  await expect.poll(() => page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return s.children.list.filter(n => n.name.startsWith('npc-name:')).length;
  })).toBe(8);
  expect(errors).toEqual([]);
  await context.close();
});
}
