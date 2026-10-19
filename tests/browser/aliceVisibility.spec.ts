import {expect,test} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type Phaser from 'phaser';

declare global {interface Window {__mernondnaGame?:Phaser.Game}}

test('Alice stays visible when an awakened hero masks their original sprite',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?e2e');
 await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady')===true);

 await page.evaluate(async()=>{
  // Use the SAME live module instance as the game, not Playwright's Node store.
  const source='/src/store/gameStore.ts';
  const {useGameStore}=await import(/* @vite-ignore */ source);
  useGameStore.getState().setStoryFlag('companion:alice-fen:following');
 });
 await expect.poll(()=>page.evaluate(()=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  return Boolean(scene.companionActor?.active);
 }),{timeout:20000}).toBe(true);

 const visibility=await page.evaluate(()=>{
  const scene=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const player=scene.player,main=scene.cameras.main.id;
  const system=(scene as unknown as {aliceCompanion:{update:(time:number,delta:number,blocked:boolean)=>void}}).aliceCompanion;
  // This is the exact mask applied to the ORIGINAL body while the prepared
  // awakened outfit takes its place. It must not be copied onto Alice.
  player.cameraFilter|=main;
  system.update(scene.time.now,16,false);
  const alice=scene.companionActor!;
  const result={aliceVisible:alice.visible,alpha:alice.alpha,mainCameraHidden:Boolean(alice.cameraFilter&main),
    playerOriginalMasked:Boolean(player.cameraFilter&main)};
  player.cameraFilter&=~main;
  return result;
 });
 expect(visibility).toEqual({aliceVisible:true,alpha:1,mainCameraHidden:false,playerOriginalMasked:true});
 expect(errors).toEqual([]);
});
