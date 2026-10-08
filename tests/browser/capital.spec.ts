import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { ContentChunkManager } from '../../src/game/systems/ContentChunkManager';

declare global { interface Window { __mernondnaGame?: Phaser.Game } }

test('Highmere streams its residents, stone wards and walkable bridges; grounded props block movement', async ({ page }) => {
  await page.goto('/?e2e');
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const capital = { x: 31 * 1536 + 768, y: 22 * 1536 + 768 };
  await page.evaluate(({ x, y }) => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.restoreAt(x - 600, y), capital);
  await page.getByRole('button',{name:'Skip scene · Esc'}).click();
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return scene.children.list.filter(child => child.name.startsWith('npc-name:')).length;
  })).toBeGreaterThanOrEqual(16);
  const city = await page.evaluate(({ x, y }) => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const world = (scene as unknown as { worldGenerator: { getTerrainAt(x:number,y:number):string } }).worldGenerator;
    return { square:world.getTerrainAt(x - 600,y), river:world.getTerrainAt(x + 420,y + 110),
      bridge:world.getTerrainAt(x + 420,y), resident:scene.children.list.some(child => child.name === 'npc-name:captain-yselle-ward') };
  }, capital);
  expect(city).toEqual({ square:'stone', river:'water', bridge:'stone', resident:true });
  await page.waitForFunction(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return Math.abs(scene.cameras.main.midPoint.x - scene.player.x) < 5;
  });
  await page.screenshot({ path:'test-results/highmere-capital.png' });
  await page.evaluate(({ x,y }) => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.restoreAt(x + 420,y), capital);
  await expect.poll(()=>page.evaluate(()=>{
    const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return Math.abs(s.cameras.main.midPoint.x-s.player.x);
  }),{timeout:10000}).toBeLessThan(5);
  await page.screenshot({ path:'test-results/highmere-bridge.png' });

  await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    scene.player.restoreAt(22 * 1536 + 768,25 * 1536 + 768);
  });
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const manager = (scene as unknown as { contentManager:ContentChunkManager<Phaser.GameObjects.Sprite | Phaser.GameObjects.Text> }).contentManager;
    return Boolean(manager.getActor('detail:oakmere:road-boulder'));
  })).toBe(true);
  const obstacle = await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const manager = (scene as unknown as { contentManager:ContentChunkManager<Phaser.GameObjects.Sprite | Phaser.GameObjects.Text> }).contentManager;
    const rock = manager.getActor('detail:oakmere:road-boulder') as Phaser.Physics.Arcade.Sprite;
    const body = rock.body as Phaser.Physics.Arcade.StaticBody;
    const candidate = { x:body.left - 34, y:(body.top + body.bottom) / 2 + 8 };
    scene.player.restoreAt(candidate.x,candidate.y);
    return { left:body.left, width:body.width, start:scene.player.x,
      walkable:scene.isWalkable(candidate.x,candidate.y), bodyY:(body.top + body.bottom) / 2, rockY:rock.y };
  });
  expect(obstacle.width).toBeGreaterThan(20);
  expect(obstacle.walkable,JSON.stringify(obstacle)).toBe(true);
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  const playerX = await page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.x);
  expect(playerX).toBeGreaterThan(obstacle.start + 5);
  expect(playerX).toBeLessThan(obstacle.left);
});
