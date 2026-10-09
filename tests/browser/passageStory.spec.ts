import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
test('docked crew, boarding, continuous passage to Darkav and safe arrival',async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 await page.evaluate(async()=>{
  const storePath='/src/store/gameStore.ts',portsPath='/src/data/ports.ts';const {useGameStore}=await import(storePath),{PORT_BY_ID}=await import(portsPath);
  useGameStore.getState().setStoryFlag('scene:highmere-arrival');
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene,p=PORT_BY_ID.highmere.landing;
  scene.player.restoreAt(p.x,p.y+36);(scene as unknown as {lastSafe:{x:number;y:number}}).lastSafe={x:p.x,y:p.y+36};scene.streamCinematicView(p.x,p.y);scene.cameras.main.centerOn(p.x,p.y);
 });
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__mernondnaGame!.scene.getScene('world').children.getByName('docked:highmere')))).toBe(true);
 await page.keyboard.press('e');await expect(page.getByRole('dialog',{name:'Harbor passage'})).toBeVisible();
 await page.screenshot({path:'test-results/highmere-docked-boat.png'});
 await page.getByRole('button',{name:'Sail to Ashen Landing · Darkav',exact:true}).click();
 await page.waitForFunction(()=>Boolean(window.__mernondnaGame!.scene.getScene('world').children.getByName('passage-vessel')));
 const before=await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world');const boat=s.children.getByName('passage-vessel') as Phaser.GameObjects.Sprite;return {x:boat.x,y:boat.y};});
 await expect.poll(()=>page.evaluate(before=>{const boat=window.__mernondnaGame!.scene.getScene('world').children.getByName('passage-vessel') as Phaser.GameObjects.Sprite;return boat?Math.hypot(boat.x-before.x,boat.y-before.y):0;},before)).toBeGreaterThan(100);
 expect(await page.evaluate(()=>Boolean(window.__mernondnaGame!.scene.getScene('world').children.getByName('passenger:passage-vessel')))).toBe(true);
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 const paused=await page.evaluate(()=>{const b=window.__mernondnaGame!.scene.getScene('world').children.getByName('passage-vessel') as Phaser.GameObjects.Sprite;return {x:b.x,y:b.y};});await page.waitForTimeout(300);
 expect(await page.evaluate(()=>{const b=window.__mernondnaGame!.scene.getScene('world').children.getByName('passage-vessel') as Phaser.GameObjects.Sprite;return {x:b.x,y:b.y};})).toEqual(paused);
 await page.getByRole('button',{name:'Resume',exact:true}).click();
 // Accelerate the voyage clock only; it still traverses the validated water
 // route through the actual boarding, streaming and landing implementation.
 await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world') as unknown as {passage:{voyage:{elapsed:number;duration:number}}};s.passage.voyage.elapsed=0;s.passage.voyage.duration=5000;});
 await page.waitForFunction(()=>!(window.__mernondnaGame!.scene.getScene('world') as unknown as {passage:{active:boolean}}).passage.active,{},{timeout:90000});
 const arrival=await page.evaluate(async()=>{
  const portsPath='/src/data/ports.ts',savePath='/src/utils/save.ts';const {PORT_BY_ID}=await import(portsPath),{saveGame,parseSave,SAVE_KEY}=await import(savePath);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;saveGame();const saved=parseSave(localStorage.getItem(SAVE_KEY)!);
  return {x:s.player.x,y:s.player.y,visible:s.player.visible,expected:PORT_BY_ID.blackspire.landing,savedX:saved?.state.worldX,savedY:saved?.state.worldY};
 });
 expect(arrival.visible).toBe(true);expect(arrival.x).toBeCloseTo(arrival.expected.x,0);expect(arrival.y).toBeCloseTo(arrival.expected.y,0);
 expect(arrival.savedX).toBeCloseTo(arrival.expected.x,0);expect(arrival.savedY).toBeCloseTo(arrival.expected.y,0);
 await page.screenshot({path:'test-results/darkav-landing.png'});expect(errors).toEqual([]);
});

test('local quest cutscene preserves position and HP; cached shadow updates stay bounded',async({page})=>{
 test.setTimeout(90000);await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 const before=await page.evaluate(async()=>{
  const path='/src/store/gameStore.ts',{useGameStore}=await import(path),s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  useGameStore.getState().hydrate({pendingCinematic:'cibar-water-restored',storyFlags:{'cibar-public-water':true}});return {x:s.player.x,y:s.player.y,hp:s.player.hp};
 });
 await expect(page.getByRole('region',{name:'Story scene'})).toBeVisible();await expect(page.getByRole('region',{name:'Story scene'})).toContainText('The Pump Turns');
 await page.screenshot({path:'test-results/cibar-cutscene.png'});await page.getByRole('button',{name:'Skip scene · Esc'}).click();await expect(page.getByRole('region',{name:'Story scene'})).toBeHidden();
 expect(await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;return {x:s.player.x,y:s.player.y,hp:s.player.hp};})).toEqual(before);
 const metrics=await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const shadows=(s as unknown as {groundShadows:{update(delta:number,hour:number,cloud:number):void}}).groundShadows;
  const texture=s.textures.get('ground-shadows') as Phaser.Textures.CanvasTexture,original=texture.refresh;let uploads=0;
  texture.refresh=function(){uploads++;return original.call(this);};const view=s.cameras.main.worldView,oldX=view.x;
  for(let i=0;i<120;i++){view.x+=.2;shadows.update(8,8,0);}texture.refresh=original;view.x=oldX;return {calls:120,uploads};
 });
 console.log('Shadow upload budget',metrics);expect(metrics.uploads).toBeLessThan(40);
 await page.screenshot({path:'test-results/oakmere-larger-houses.png'});
});
