import { test, expect } from '@playwright/test';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { Enemy } from '../../src/game/entities/Enemy';
import type { Npc } from '../../src/game/entities/Npc';
import type { ContentChunkManager } from '../../src/game/systems/ContentChunkManager';
import type Phaser from 'phaser';

type Details = { contentManager:ContentChunkManager<Phaser.GameObjects.Sprite | Phaser.GameObjects.Text> };
test('new packs load without missing textures and drive facing, locomotion, hit, attack and death visuals', async ({ page }) => {
  const errors:string[] = [], failed:string[] = [];
  page.on('pageerror',error => errors.push(error.message));
  page.on('response',response => { if (response.url().includes('/assets/') && response.status() >= 400) failed.push(response.url()); });
  await page.goto('/?e2e');
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  const assets = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene, m = (s as unknown as Details).contentManager;
    return { error:s.registry.get('assetError'),frames:s.textures.get('enemies').getFrameNames().length,
      shrine:(m.getActor('npc:orin-bell') as Npc).texture.key,smith:(m.getActor('npc:joren-pike') as Npc).texture.key,
      smithy:(m.getActor('town:oakmere:building:3') as Phaser.GameObjects.Sprite).texture.key,
      animations:Array.from({ length:4 },(_,species) => ['idle','walk','attack','hurt','death'].filter(state => s.anims.exists(`enemy:${species}:${state}`)).length).reduce((a,b)=>a+b,0) };
  });
  expect(assets.error).toBeUndefined(); expect(assets.frames).toBe(119); expect(assets.shrine).toBe('npc_woman'); expect(assets.animations).toBe(20);
  expect(assets.smith).toBe('npc_blacksmith'); expect(assets.smithy).toBe('world_buildings');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene, m = (s as unknown as Details).contentManager;
    const guard = m.getActor('npc:elara-voss') as Npc;
    s.player.restoreAt(guard.x + 60,guard.y); guard.updatePresentation(s.player.x,s.player.y,false);
    if (Number(guard.frame.name) !== 12) throw new Error('Guard did not use its real right-facing standing art');
  });
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toContainText('Elara Voss');
  await expect(page.locator('.sprite-portrait img')).toHaveAttribute('src','assets/npcs/trandum_guard/walk_down.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const wolf = (s as unknown as Details).contentManager.getActor('creature:oakmere-wolf-east') as Enemy;
    s.player.restoreAt(wolf.x + 160,wolf.y); s.cameras.main.startFollow(s.player,true,1,1);
  });
  const animation = () => page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as Details;
    return (s.contentManager.getActor('creature:oakmere-wolf-east') as Enemy).anims.currentAnim?.key;
  });
  await expect.poll(animation).toBe('enemy:0:walk');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const wolf = (s as unknown as Details).contentManager.getActor('creature:oakmere-wolf-east') as Enemy;
    wolf.takeDamage(1,s.player.lastDirection);
  });
  await expect.poll(animation,{ intervals:[20] }).toBe('enemy:0:hurt');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const wolf = (s as unknown as Details).contentManager.getActor('creature:oakmere-wolf-east') as Enemy;
    s.player.restoreAt(wolf.x + 28,wolf.y);
  });
  await expect.poll(animation,{ intervals:[20] }).toBe('enemy:0:attack');
  await page.screenshot({ path:'test-results/new-enemy-animations.png' });
  const death = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene, m = (s as unknown as Details).contentManager;
    const wolf = m.getActor('creature:oakmere-wolf-east') as Enemy;
    wolf.takeDamage(1000,s.player.lastDirection);
    const effect = s.children.getByName('enemy-death:creature:oakmere-wolf-east') as Phaser.GameObjects.Sprite;
    return { alive:Boolean(m.getActor('creature:oakmere-wolf-east')),dead:m.getState('creature:oakmere-wolf-east')!.defeated,
      visual:effect.anims.currentAnim?.key,physical:Boolean(effect.body),saved:JSON.parse(localStorage.getItem('mernondna-save-v1')!).state.worldContent.states['creature:oakmere-wolf-east'].defeated };
  });
  expect(death).toEqual({ alive:false,dead:true,visual:'enemy:0:death',physical:false,saved:true });
  await expect.poll(() => page.evaluate(() => Boolean((window.__mernondnaGame!.scene.getScene('world') as WorldScene).children.getByName('enemy-death:creature:oakmere-wolf-east')))).toBe(false);
  expect(failed).toEqual([]); expect(errors).toEqual([]);
});

test('a missing required pack shows a useful loading error instead of a playable placeholder', async ({ page }) => {
  await page.route('**/assets/characters/leigneron/walk_down.png',route => route.abort());
  await page.goto('/?e2e');
  await page.waitForFunction(() => window.__mernondnaGame?.registry.get('assetError'));
  const boot = await page.evaluate(() => ({ error:window.__mernondnaGame!.registry.get('assetError'),
    player:Boolean((window.__mernondnaGame!.scene.getScene('world') as WorldScene).player) }));
  expect(boot.error).toContain('characters/leigneron/walk_down.png'); expect(boot.player).toBe(false);
});

test('the supplied sword poses run through the shared input path without resizing the player body', async ({ page }) => {
  await page.goto('/?e2e');
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).children.getByName('player-sword-visual'));
  const attack = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const effect = s.children.getByName('player-sword-visual') as Phaser.GameObjects.Sprite;
    const body = s.player.body as Phaser.Physics.Arcade.Body;
    return { animation:effect.anims.currentAnim?.key,texture:effect.texture.key,body:[body.width,body.height],
      physical:Boolean(effect.body),heroAlpha:s.player.alpha,stamina:s.player.stamina };
  });
  expect(attack.animation).toBe('leigneron-attack-down'); expect(attack.texture).toBe('leigneron_attack');
  expect(attack.body).toEqual([18,22]); expect(attack.physical).toBe(false); expect(attack.heroAlpha).toBe(0);
  expect(attack.stamina).toBeLessThan(100);
  await page.keyboard.press('i');
  await expect(page.getByRole('heading',{ name:'Inventory' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.alpha)).toBe(1);
  const cleanup = await page.evaluate(() => Boolean((window.__mernondnaGame!.scene.getScene('world') as WorldScene).children.getByName('player-sword-visual')));
  expect(cleanup).toBe(false);
});
