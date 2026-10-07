import { test, expect } from '@playwright/test';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { ContentChunkManager } from '../../src/game/systems/ContentChunkManager';
import type { Npc } from '../../src/game/entities/Npc';
import type Phaser from 'phaser';

type Details = { contentManager: ContentChunkManager<Phaser.GameObjects.Sprite | Phaser.GameObjects.Text> };
test('Oakmere proportions, planted trees, connected farm lane and field boundaries', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?e2e');
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const scale = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene, m = (s as unknown as Details).contentManager;
    const npc = m.getActor('npc:aldren-vale') as Npc, house = m.getActor('town:oakmere:building:1') as Phaser.GameObjects.Sprite;
    return { actorHeight:s.player.displayHeight,npcHeight:npc.displayHeight,houseHeight:house.displayHeight,
      npcBody:[npc.body!.width,npc.body!.height,npc.body!.position.x - npc.x,npc.body!.position.y - npc.y],
      trees:m.getActiveIds().filter(id => {
        const d = m.getDefinition(id)!;
        return d.kind === 'prop' && d.texture === 'world_assets' && (d.frame === 0 || d.frame === 1);
      }).length };
  });
  expect(scale.actorHeight).toBe(80); expect(scale.npcHeight).toBe(80);
  expect(scale.houseHeight / scale.actorHeight).toBeLessThan(3);
  expect(scale.npcBody).toEqual([18,22,-9,-2]); expect(scale.trees).toBeGreaterThanOrEqual(16);
  const treeCollision = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as {
      treeBodies: Phaser.Physics.Arcade.StaticGroup; contentManager: Details['contentManager'];
    };
    const villageTree = s.contentManager.getActor('detail:oakmere:west-oak');
    return { wilderness: s.treeBodies.getChildren().length, villageTree: Boolean(villageTree && 'body' in villageTree) };
  });
  expect(treeCollision.wilderness).toBeGreaterThan(0); expect(treeCollision.villageTree).toBe(true);
  // This is a test-only survey camera; normal gameplay retains its follow camera.
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    s.cameras.main.stopFollow().setZoom(.64).centerOn(22 * 1536 + 768,25 * 1536 + 968);
  });
  await page.screenshot({ path:'test-results/oakmere-settlement-overview.png' });
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    s.player.restoreAt(22 * 1536 + 768 - 630,25 * 1536 + 768 + 375);
    s.cameras.main.setZoom(1.3).startFollow(s.player,true,1,1);
  });
  await page.keyboard.down('s');
  await expect.poll(() => page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.y)).toBeGreaterThan(25 * 1536 + 768 + 585);
  await page.keyboard.up('s');
  const field = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene, m = (s as unknown as Details).contentManager;
    return { walkable:s.isWalkable(s.player.x,s.player.y),crops:m.getActiveIds().filter(id => id.startsWith('farm:oakmere:wheat:')).length,
      fences:m.getActiveIds().filter(id => id.startsWith('farm:oakmere:fence:')).length };
  });
  expect(field.walkable).toBe(true); expect(field.crops).toBeGreaterThanOrEqual(8); expect(field.fences).toBeGreaterThanOrEqual(8);
  await page.screenshot({ path:'test-results/oakmere-fields.png' });
  expect(errors).toEqual([]);
});
