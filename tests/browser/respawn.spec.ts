import {expect,test,type Page} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import {TOWN_BY_ID} from '../../src/data/towns';
import type Phaser from 'phaser';

declare global {interface Window {__mernondnaGame?:Phaser.Game}}

async function worldReady(page:Page){
 await page.goto('/?e2e');
 await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady')===true);
}

test('lethal damage finishes on the next frame and respawns in the local region',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await worldReady(page);
 const death=await page.evaluate((destination)=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  scene.player.restoreAt(destination.x,destination.y);
  scene.player.hp=1;
  scene.player.takeDamage(999999);
  // Death may only request a transition, never destroy current combat actors.
  return {hp:scene.player.hp,x:scene.player.x,y:scene.player.y};
 },TOWN_BY_ID.elarion.world);
 expect(death.hp).toBe(0);
 await expect.poll(()=>page.evaluate(()=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  return {region:scene['worldGenerator'].getRegionAt(scene.player.x,scene.player.y),
   alive:scene.player.hp>0,positionSynced:Math.abs(scene.player.x-scene['lastSafe'].x)<1,
   paused:scene.physics.world.isPaused};
 }),{timeout:60000}).toEqual({region:'narenthil',alive:true,positionSynced:true,paused:false});
 await expect(page.locator('.status-card')).toContainText('Elarion');
 await page.keyboard.press('i');
 await expect(page.getByRole('dialog',{name:'Inventory'})).toBeVisible();
 await page.keyboard.press('i');
 await expect(page.getByRole('dialog',{name:'Inventory'})).not.toBeVisible();
 await page.keyboard.down('d');
 await expect.poll(()=>page.evaluate(()=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  return (scene.player.body as Phaser.Physics.Arcade.Body).velocity.length();
 }),{timeout:3000}).toBeGreaterThan(1);
 await page.keyboard.up('d');
 expect(errors).toEqual([]);
});

test('a death near another Trandum town does not force the Oakmere spawn',async({page})=>{
 test.setTimeout(120000);
 await worldReady(page);
 await page.evaluate((destination)=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  scene.player.restoreAt(destination.x,destination.y);
  scene.player.hp=1;
  scene.player.takeDamage(999999);
 },TOWN_BY_ID.willowcross.world);
 await expect(page.locator('.status-card')).toContainText('Willowcross',{timeout:60000});
 await expect.poll(()=>page.evaluate(()=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  return scene.player.hp>0&&!scene.physics.world.isPaused;
 }),{timeout:60000}).toBe(true);
});
