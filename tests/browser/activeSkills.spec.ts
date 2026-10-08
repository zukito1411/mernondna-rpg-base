import { expect, test, type Page } from '@playwright/test';
import type { WorldScene } from '../../src/game/scenes/WorldScene';
import type { Enemy } from '../../src/game/entities/Enemy';
import type Phaser from 'phaser';

declare global { interface Window { __mernondnaGame?: Phaser.Game } }

async function ready(page: Page) {
  await page.goto('/?e2e');
  await page.waitForFunction(() => {
    const scene = window.__mernondnaGame?.scene.getScene('world') as WorldScene | undefined;
    return scene?.player?.active;
  });
}

test('combat arts cast, hit, spend stamina, cool down and show Rally effects', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  const staminaBefore = await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    const wolf = (scene as unknown as { contentManager: { getActor(id: string): Enemy } })
      .contentManager.getActor('creature:oakmere-wolf-east');
    scene.player.restoreAt(wolf.x + 70, wolf.y);
    scene.player.lastDirection.set(-1, 0);
    wolf.hp = 1000;
    return scene.player.stamina;
  });

  for (const slot of ['1', '2', '4']) {
    await page.evaluate(() => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const wolf = (scene as unknown as { contentManager: { getActor(id: string): Enemy } })
        .contentManager.getActor('creature:oakmere-wolf-east');
      wolf.hp = 1000;
      scene.player.restoreAt(wolf.x + 70, wolf.y);
      scene.player.lastDirection.set(-1, 0);
    });
    await page.keyboard.press(slot);
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      return scene.player.skills.snapshot().casting;
    })).not.toBeNull();
    const visual = await page.evaluate((key) => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const ids = { '1': 'azure-cleave', '2': 'skyfall-slam', '4': 'crescent-flurry' } as const;
      const skill = ids[key as keyof typeof ids];
      const sprite = scene.children.getByName(`player-skill:${skill}`) as Phaser.GameObjects.Sprite | null;
      return { animation: sprite?.anims.currentAnim?.key, playerAlpha: scene.player.alpha };
    }, slot);
    const skillId = { '1': 'azure-cleave', '2': 'skyfall-slam', '4': 'crescent-flurry' }[slot as '1' | '2' | '4'];
    expect(visual.animation).toBe(`player-skill:${skillId}`);
    expect(visual.playerAlpha).toBe(0);
    const spent=await page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.stamina);
    expect(spent).toBeLessThan(staminaBefore);
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as unknown as {
        contentManager: { getActor(id: string): Enemy };
      };
      return scene.contentManager.getActor('creature:oakmere-wolf-east').hp;
    })).toBeLessThan(1000);
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      return scene.player.skills.snapshot().casting;
    })).toBeNull();
    await expect.poll(() => page.evaluate((key) => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const ids = { '1': 'azure-cleave', '2': 'skyfall-slam', '4': 'crescent-flurry' } as const;
      return { alpha: scene.player.alpha, visual: scene.children.getByName(`player-skill:${ids[key as keyof typeof ids]}`) };
    }, slot)).toEqual({ alpha: 1, visual: null });
    const status = await page.evaluate((key) => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      const ids = { '1': 'azure-cleave', '2': 'skyfall-slam', '4': 'crescent-flurry' } as const;
      return { stamina: scene.player.stamina, cooldown: scene.player.skills.snapshot().cooldowns[ids[key as keyof typeof ids]] };
    }, slot);
    expect(status.cooldown).toBeGreaterThan(0);
    if(slot==='1') {
      await page.keyboard.press('1');
      await expect(page.locator('.toast')).toContainText('Azure Cleave is recovering');
      expect(await page.evaluate(()=>(window.__mernondnaGame!.scene.getScene('world') as WorldScene).player.skills.snapshot().casting)).toBeNull();
    }
  }

  const rally = await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    scene.player.hp = 50;
    return scene.player.stamina;
  });
  await page.keyboard.press('3');
  await expect.poll(() => page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return scene.player.hp;
  })).toBeGreaterThan(50);
  const rallyEffect = await page.evaluate(() => {
    const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
    return { multiplier: scene.player.skills.incomingDamageMultiplier, stamina: scene.player.stamina };
  });
  expect(rallyEffect.multiplier).toBe(0.5);
  expect(rallyEffect.stamina).toBeLessThan(rally);

  await page.keyboard.press('c');
  const panel = page.getByRole('dialog', { name: 'Character and skills' });
  await expect(panel.getByRole('heading', { name: 'Combat arts' })).toBeVisible();
  await expect(panel).toContainText('Azure Cleave');
  await expect(panel).toContainText('Skyfall Slam');
  await expect(panel).toContainText('Crown Rally');
  await expect(panel).toContainText('Crescent Flurry');
  await expect(panel).toContainText('Cooldown');
  expect(errors).toEqual([]);
});

test('landscape touch combat-art buttons cast skills and fit inside screen margins', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await ready(page);
    await expect(page.getByRole('button', { name: /Azure Cleave/ })).toBeVisible();
    const bounds = await page.evaluate(() => {
      const joystick = document.querySelector('.joystick')!.getBoundingClientRect();
      const actions = document.querySelector('.touch-actions')!.getBoundingClientRect();
      return {
        joystickLeft: joystick.left, joystickBottom: innerHeight - joystick.bottom,
        actionsRight: innerWidth - actions.right, actionsBottom: innerHeight - actions.bottom,
        overlaps: joystick.right >= actions.left,
      };
    });
    expect(bounds.joystickLeft).toBeGreaterThanOrEqual(24);
    expect(bounds.joystickBottom).toBeGreaterThanOrEqual(16);
    expect(bounds.actionsRight).toBeGreaterThanOrEqual(24);
    expect(bounds.actionsBottom).toBeGreaterThanOrEqual(16);
    expect(bounds.overlaps).toBe(false);
    await page.getByRole('button', { name: /Azure Cleave/ }).tap();
    await expect.poll(() => page.evaluate(() => {
      const scene = window.__mernondnaGame!.scene.getScene('world') as WorldScene;
      return scene.player.skills.snapshot().cooldowns['azure-cleave'];
    })).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
