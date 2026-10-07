import { expect, test, type Page } from '@playwright/test';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { Enemy } from '../../src/game/entities/Enemy';
import type { Npc } from '../../src/game/entities/Npc';
import type Phaser from 'phaser';

// The scene handle exists only in Vite development mode with ?e2e.
declare global { interface Window { __mernondnaGame?: Phaser.Game } }

async function ready(page: Page) {
  await page.goto('/?e2e');
  await page.waitForFunction(() => {
    const game = window.__mernondnaGame;
    return game && (game.scene.getScene('world') as WorldScene)?.player?.active;
  });
  await expect(page.locator('.game-canvas canvas')).toHaveCount(1);
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return { x: scene.player.x, y: scene.player.y, hp: scene.player.hp, stamina: scene.player.stamina,
      vx: (scene.player.body as Phaser.Physics.Arcade.Body).velocity.x };
  });
}
async function closeDialogue(page: Page) {
  while (await page.locator('.dialogue-panel').isVisible()) {
    await page.locator('.dialogue-panel button').click();
  }
}

test('desktop movement, sprint, dash, menus, terrain chunks and NPC conversation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await expect(page.locator('.status-card')).toContainText('Oakmere');
  const start = await snapshot(page);
  await page.keyboard.down('s');
  await expect.poll(async () => (await snapshot(page)).y).toBeGreaterThan(start.y + 15);
  await page.keyboard.up('s');
  await page.keyboard.down('d'); await page.keyboard.down('Shift');
  await expect.poll(async () => (await snapshot(page)).vx).toBeGreaterThan(220);
  await page.keyboard.down('q');
  await expect.poll(async () => (await snapshot(page)).vx, { intervals: [20] }).toBeGreaterThan(400);
  expect(await page.evaluate(() => window.__mernondnaGame!.scene.getScene('world').children.list
    .some(child => child.name === 'player-dash-afterimage'))).toBe(true);
  await page.keyboard.up('q'); await page.keyboard.up('d'); await page.keyboard.up('Shift');
  await page.waitForTimeout(200);
  const lighting = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as {
      player: { x: number; y: number }; dayNight: { minuteOfDay: number; update(delta: number, x: number, y: number): void };
      children: { list: Array<{ name: string; visible: boolean }> };
    };
    s.dayNight.minuteOfDay = 22 * 60;
    s.dayNight.update(16, s.player.x, s.player.y);
    return { playerGlow: s.children.list.some(child => child.name === 'night-player-light' && child.visible),
      fireflies: s.children.list.filter(child => child.name === 'firefly-light' && child.visible).length };
  });
  expect(lighting.playerGlow).toBe(true); expect(lighting.fireflies).toBeGreaterThan(0);
  await page.keyboard.press('m');
  await expect(page.getByRole('dialog', { name: 'Mernodna world map' })).toBeVisible();
  await expect.poll(() => page.locator('.world-map-wrap img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const clock = await page.locator('.status-meta').innerText();
  const paused = await snapshot(page);
  await page.waitForTimeout(850);
  expect((await snapshot(page)).x).toBe(paused.x);
  expect(await page.locator('.status-meta').innerText()).toBe(clock);
  await page.keyboard.press('m'); await page.keyboard.press('i');
  await expect(page.getByRole('dialog', { name: 'Inventory' })).toContainText('Roadwarden Sword');
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await expect(page.getByRole('dialog', { name: 'Character and skills' })).toContainText('Strength');
  await page.keyboard.press('c');
  await expect(page.getByRole('dialog', { name: 'Character and skills' })).not.toBeVisible();
  await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    scene.player.restoreAt(22 * 1536 + 1480, 25 * 1536 + 1000);
  });
  await page.keyboard.down('d');
  await expect.poll(async () => (await snapshot(page)).x).toBeGreaterThan(23 * 1536);
  await page.keyboard.up('d');
  await expect.poll(() => page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { chunkManager: { getActiveKeys(): string[] } };
    return s.chunkManager.getActiveKeys();
  })).toContain('24:25'); // Physics can cross just after this frame's streaming update.
  const keys = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { chunkManager: { getActiveKeys(): string[] } };
    return s.chunkManager.getActiveKeys();
  });
  expect(keys).toHaveLength(9); expect(keys).toContain('24:25'); expect(keys).not.toContain('21:25');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const npc = (s as unknown as { npcs: Npc[] }).npcs.find(n => n.definition.id === 'aldren-vale')!;
    s.player.restoreAt(npc.x + 45, npc.y);
  });
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toContainText('Aldren Vale');
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toContainText('eastern watchtower');
  await page.keyboard.press('Escape');
  await expect(page.locator('.dialogue-panel')).not.toBeVisible();
  await expect(page.locator('.quest-card')).toContainText('Defeat Captain Varr');
  await expect(page.getByLabel('Quest destination: Captain Varr')).toHaveAttribute('data-objective','kill-varr');
  await page.screenshot({ path: 'test-results/desktop-base.png' });
  expect(errors).toEqual([]);
});

test('full-health Captain Varr defeat, immediate reload, first quest and fresh game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const npc = (s as unknown as { npcs: Npc[] }).npcs.find(n => n.definition.id === 'aldren-vale')!;
    s.player.restoreAt(npc.x + 45, npc.y);
  });
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toContainText('Aldren Vale');
  await closeDialogue(page);
  await expect(page.locator('.quest-card')).toContainText('Defeat Captain Varr');
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    s.player.restoreAt(22 * 1536 + 768 + 1400, 25 * 1536 + 768 - 850 + 200);
  });
  await expect.poll(() => page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { enemies: Set<Enemy> };
    return [...s.enemies].some(e => e.instanceId === 'boss:captain-varr');
  })).toBe(true);
  // Fixture positions only. Each blow goes through the real Space input, stamina,
  // cooldown, facing, hit geometry, damage, death, reward and save paths.
  const bossHp = await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { enemies: Set<Enemy> };
    return [...s.enemies].find(e => e.instanceId === 'boss:captain-varr')!.hp;
  });
  expect(bossHp).toBe(210);
  for (let i = 0; i < 12; i++) {
    await page.waitForFunction(() => {
      const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      return s.time.now >= (s.player as unknown as { nextAttackAt: number }).nextAttackAt && s.player.stamina >= 8;
    });
    await page.evaluate(() => {
      const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const boss = [...(s as unknown as { enemies: Set<Enemy> }).enemies].find(e => e.instanceId === 'boss:captain-varr');
      if (boss) {
        for (let j = 0; j < 8; j++) {
          const angle = Math.PI / 2 + j * Math.PI / 4;
          const x = boss.x + Math.cos(angle) * 62, y = boss.y + Math.sin(angle) * 62;
          if (s.hasClearPath(x, y, boss.x, boss.y)) {
            (s.player.body as Phaser.Physics.Arcade.Body).reset(x, y);
            s.player.lastDirection.set(-Math.cos(angle), -Math.sin(angle));
            return;
          }
        }
        throw new Error('Boss has no exposed attack direction');
      }
    });
    await page.keyboard.down('Space');
    await expect.poll(() => page.evaluate(() => {
      const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { enemies: Set<Enemy> };
      return [...s.enemies].find(e => e.instanceId === 'boss:captain-varr')?.hp ?? 0;
    }), { intervals: [30] }).toBeLessThanOrEqual(Math.max(0, 210 - (i + 1) * 18));
    await page.keyboard.up('Space');
    // Retreat between blows rather than tanking the boss in place.
    await page.evaluate(() => {
      const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const boss = [...(s as unknown as { enemies: Set<Enemy> }).enemies].find(e => e.instanceId === 'boss:captain-varr');
      if (boss) (s.player.body as Phaser.Physics.Arcade.Body).reset(boss.x, boss.y + 180);
    });
  }
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('mernondna-save-v1');
    return raw ? JSON.parse(raw).state.defeatedBosses : [];
  })).toContain('captain-varr');
  const saved = await page.evaluate(async () => {
    const path = '/src/utils/save.ts';
    const { parseSave } = await import(path);
    const raw = localStorage.getItem('mernondna-save-v1')!;
    return { raw: JSON.parse(raw), parsed: parseSave(raw) };
  });
  expect(saved.parsed, JSON.stringify(saved.raw)).not.toBeNull();
  await page.reload();
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  await expect(page.locator('.quest-card')).toContainText('Return to Aldren');
  await expect(page.getByLabel('Quest destination: Aldren Vale')).toHaveAttribute('data-objective','return-aldren');
  expect(await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as unknown as { enemies: Set<Enemy> };
    return [...s.enemies].some(e => e.instanceId === 'boss:captain-varr');
  })).toBe(false);
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const npc = (s as unknown as { npcs: Npc[] }).npcs.find(n => n.definition.id === 'aldren-vale')!;
    s.player.restoreAt(npc.x + 45, npc.y);
  });
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toContainText('Aldren Vale');
  await closeDialogue(page);
  await expect(page.locator('.quest-card')).toContainText('No active quest');
  await expect(page.locator('.quest-guidance')).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Game saved locally');
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Start new game' }).click();
  await page.waitForFunction(() => (window.__mernondnaGame?.scene.getScene('world') as WorldScene)?.player?.active);
  await expect(page.locator('.quest-card')).toContainText('Speak with Aldren');
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
test(`mobile ${viewport.width}px joystick, multitouch sprint, dash, attack, interact and menus`, async ({ browser }) => {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  // Exercise movement on open terrain rather than dashing into Mira's solid NPC body.
  await page.evaluate(() => (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.restoreAt(22 * 1536 + 1068, 25 * 1536 + 1418));
  const cdp = await context.newCDPSession(page);
  const box = (await page.getByLabel('Movement joystick').boundingBox())!;
  const x = box.x + box.width * .85, y = box.y + box.height / 2;
  const run = (await page.getByRole('button', { name: 'Sprint', exact: true }).boundingBox())!;
  const start = await snapshot(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await expect.poll(async () => (await snapshot(page)).vx).toBeGreaterThan(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }, { x: run.x + run.width / 2, y: run.y + run.height / 2, id: 2 }] });
  await expect.poll(async () => (await snapshot(page)).vx).toBeGreaterThan(200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await snapshot(page)).vx).toBe(0);
  expect((await snapshot(page)).x).toBeGreaterThan(start.x);
  const beforeDash = (await snapshot(page)).x;
  await page.getByRole('button', { name: 'Dash', exact: true }).tap();
  await expect.poll(async () => (await snapshot(page)).x).toBeGreaterThan(beforeDash + 25);
  const beforeAttack = await page.evaluate(() => {
    const player = (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player;
    return (player as unknown as { nextAttackAt: number }).nextAttackAt;
  });
  await page.getByRole('button', { name: 'Attack', exact: true }).tap();
  await expect.poll(() => page.evaluate(() => {
    const player = (window.__mernondnaGame!.scene.getScene('world') as WorldScene).player;
    return (player as unknown as { nextAttackAt: number }).nextAttackAt;
  })).toBeGreaterThan(beforeAttack);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await expect.poll(async () => (await snapshot(page)).vx).toBeGreaterThan(100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect.poll(async () => (await snapshot(page)).vx).toBe(0);
  await page.getByRole('button', { name: /^Map\b/ }).tap();
  await expect(page.getByRole('dialog', { name: 'Mernodna world map' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await page.getByRole('button', { name: 'Gear' }).tap();
  await expect(page.getByRole('dialog', { name: 'Inventory' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await page.getByRole('button', { name: 'Status' }).tap();
  await expect(page.getByRole('dialog', { name: 'Character and skills' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await page.evaluate(() => {
    const s = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const npc = (s as unknown as { npcs: Npc[] }).npcs.find(n => n.definition.id === 'aldren-vale')!;
    s.player.restoreAt(npc.x + 45, npc.y);
  });
  await expect(page.locator('.interaction-hint')).toContainText('Talk to Aldren Vale');
  await page.getByRole('button', { name: 'Interact', exact: true }).tap();
  await expect(page.locator('.dialogue-panel')).toContainText('Aldren Vale');
  await closeDialogue(page);
  await page.screenshot({ path: `test-results/mobile-${viewport.width}-base.png` });
  expect(errors).toEqual([]);
  await context.close();
});
}
