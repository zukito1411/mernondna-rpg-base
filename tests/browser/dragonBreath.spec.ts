import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {Enemy} from '../../src/game/entities/Enemy';
type CombatFixture={age:number;aim:{set(x:number,y:number):unknown};enter(phase:string):void;breathPose(pose:number):void;update(delta:number):void};
for(const viewport of [{width:1280,height:720},{width:844,height:390}])test.describe('Dragon breath at '+viewport.width+'px',()=>{
test.use({viewport,hasTouch:viewport.width===844,isMobile:viewport.width===844});
test('painted breath frames attach to the jaw, aim, pause and clean up with the dragon',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 await page.evaluate(async()=>{
  const lairPath='/src/data/dragonLair.ts',storePath='/src/store/gameStore.ts';
  const {DRAGON_LAIR}=await import(lairPath),{useGameStore}=await import(storePath);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.player.restoreAt(DRAGON_LAIR.x+360,DRAGON_LAIR.y);s.streamCinematicView(DRAGON_LAIR.x,DRAGON_LAIR.y);
  s.cameras.main.stopFollow();s.cameras.main.centerOn(DRAGON_LAIR.x+120,DRAGON_LAIR.y-70);
  (s as unknown as {lastSafe:{x:number;y:number}}).lastSafe={x:s.player.x,y:s.player.y};
  useGameStore.getState().openPanel('pause');
 });
 await expect.poll(()=>page.evaluate(()=>Boolean((window.__mernondnaGame!.scene.getScene('world') as WorldScene).getCombatEnemies().find(e=>e.instanceId==='boss:varkhul')))).toBe(true);
 const art=await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const t=s.textures.get('dragon-breath'),canvas=t.getSourceImage() as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
  const fingerprints=Array.from({length:6},(_,i)=>{
   const f=t.get(i),p=ctx.getImageData(f.cutX,f.cutY,512,512).data;let hash=0;
   for(let n=0;n<p.length;n+=37)hash=(hash*31+p[n])|0;return hash;
  });
  return {distinct:new Set(fingerprints).size,cornerAlpha:ctx.getImageData(0,0,1,1).data[3]};
 });
 expect(art.distinct).toBe(6);expect(art.cornerAlpha).toBe(0);
 for(const direction of [{name:'east',x:1,y:0},{name:'west',x:-1,y:0},{name:'south',x:0,y:1}]){
  const result=await page.evaluate(async direction=>{
   const path='/src/data/dragonLair.ts',{DRAGON_LAIR}=await import(path);
   const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
   const e=s.getCombatEnemies().find(e=>e.instanceId==='boss:varkhul')!;
   (e.body as Phaser.Physics.Arcade.Body).reset(DRAGON_LAIR.x,DRAGON_LAIR.y);e.setFlipX(direction.x<0);
   s.player.restoreAt(e.x+direction.x*360-direction.y*260,e.y+direction.y*360+direction.x*260);
   s.player.clearTint();
   s.cameras.main.centerOn(e.x+direction.x*110,e.y+direction.y*110-65);
   s.cameras.main.setZoom(direction.name==='south'?.8:1);
   const c=(e as unknown as {dragonCombat:CombatFixture}).dragonCombat;c.aim.set(direction.x,direction.y);
   c.enter('breath-windup');c.age=500;c.update(0);const windup=e.frame.name;
   const windupFire=(s.children.getByName('dragon-fire:boss:varkhul') as Phaser.GameObjects.Sprite).visible;
   c.enter('breath');c.breathPose(2);c.age=500;c.update(0);
   const fire=s.children.getByName('dragon-fire:boss:varkhul') as Phaser.GameObjects.Sprite;
   const from={frame:fire.frame.name,x:fire.x,y:fire.y};c.update(80);
   return {windup,windupFire,pose:e.frame.name,texture:fire.texture.key,visible:fire.visible,from,to:{frame:fire.frame.name,x:fire.x,y:fire.y},rotation:fire.rotation,flipped:e.flipX};
  },direction);
  expect(result.texture).toBe('dragon-breath');expect(result.visible).toBe(true);
  expect(result.windupFire).toBe(false);
  expect(result.windup).not.toBe(result.pose);expect(result.from.frame).not.toBe(result.to.frame);
  expect(result.from.x).toBe(result.to.x);expect(result.from.y).toBe(result.to.y);
  if(direction.name==='west'){expect(result.flipped).toBe(true);expect(Math.abs(result.rotation)).toBeGreaterThan(2);}
  if(direction.name==='south')expect(result.rotation).toBeGreaterThan(1.5);
  // Temporarily hide the menu overlay for a gameplay screenshot, while keeping
  // the store's menu pause so the exact rendered pose remains still.
  const overlay=page.getByRole('dialog');await overlay.evaluateAll(nodes=>nodes.forEach(n=>(n as HTMLElement).style.visibility='hidden'));
  await page.screenshot({path:'test-results/dragon-breath-'+direction.name+'-'+viewport.width+'.png'});
 }
 const paused=await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world'),f=s.children.getByName('dragon-fire:boss:varkhul') as Phaser.GameObjects.Sprite;return {frame:f.frame.name,x:f.x,y:f.y,alpha:f.alpha};});
 await page.waitForTimeout(300);
 expect(await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world'),f=s.children.getByName('dragon-fire:boss:varkhul') as Phaser.GameObjects.Sprite;return {frame:f.frame.name,x:f.x,y:f.y,alpha:f.alpha};})).toEqual(paused);
 const cleanup=await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene,e=s.getCombatEnemies().find(e=>e.instanceId==='boss:varkhul')!;
  const c=(e as unknown as {dragonCombat:CombatFixture}).dragonCombat;c.age=1700;c.update(0);
  const f=s.children.getByName('dragon-fire:boss:varkhul') as Phaser.GameObjects.Sprite,fade=f.alpha;
  c.age=1800;c.update(0);const hidden=!f.visible;e.destroy();
  return {fade,hidden,remaining:s.children.list.filter(o=>o.name.startsWith('dragon-fire:')||o.name.startsWith('dragon-fire-glow:')).length};
 });
 expect(cleanup.fade).toBeCloseTo(.5);expect(cleanup.hidden).toBe(true);expect(cleanup.remaining).toBe(0);expect(errors).toEqual([]);
});
});
