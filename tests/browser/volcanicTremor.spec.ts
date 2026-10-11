import {test,expect} from '@playwright/test';
import type Phaser from 'phaser';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {VolcanicTremor} from '../../src/game/systems/VolcanicTremor';
import type {VolcanicCameraShake} from '../../src/game/systems/VolcanicCameraShake';

test('Darkav recording owns the tremor clock, pause, mute, fade and region exit',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[],requests:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().endsWith('/volcanic.mp3'))requests.push(request.url());});
 await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();
 await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 expect(requests).toEqual([]);
 await page.evaluate(async()=>{
  const tp='/src/data/towns.ts',sp='/src/store/gameStore.ts';const {TOWN_BY_ID}=await import(tp),{useGameStore}=await import(sp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene,{x,y}=TOWN_BY_ID.blackspire.world;
  useGameStore.getState().hydrate({weatherAudio:true,minuteOfDay:1320});
  // Use the game's arrival path so the collision guard's last-safe position
  // belongs to Darkav rather than the previous continent.
  s.landFromPassage({x,y});
  const dayNight=(s as unknown as {dayNight:{minuteOfDay:number;syncState():void}}).dayNight;
  dayNight.minuteOfDay=1320;dayNight.syncState();
  const tremor=(s as unknown as {volcanicTremor:VolcanicTremor}).volcanicTremor as unknown as {nextTremor:number};tremor.nextTremor=0;
 });
 // A real input gesture also covers browsers that require an unlock to play.
 await page.keyboard.press('Shift');
 const get=()=>page.evaluate(async()=>{
  const p='/src/game/systems/volcanicRumbleProfile.ts';const {volcanicRumbleIntensity}=await import(p);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  const runtime=s as unknown as {volcanicTremor:{voice:HTMLAudioElement|null;playing:boolean;active:boolean;nextTremor:number};
   volcanicShake:{rumble:Phaser.Cameras.Scene2D.Effects.Shake;lastMediaTime:number}};
  const t=runtime.volcanicTremor,shake=runtime.volcanicShake,voice=t.voice;
  return{time:voice?.currentTime??0,duration:voice?.duration??0,src:voice?.src,paused:voice?.paused,muted:voice?.muted,
   active:t.active,playing:t.playing,running:shake.rumble.isRunning,intensity:shake.rumble.isRunning?shake.rumble.intensity.x:0,
   expected:volcanicRumbleIntensity(shake.lastMediaTime),sampleTime:shake.lastMediaTime,nextTremor:t.nextTremor,
   combatRunning:s.cameras.main.shakeEffect.isRunning,combatIntensity:s.cameras.main.shakeEffect.intensity.x};
 });
 await expect.poll(async()=>{const r=await get();return r.playing&&r.running&&r.time>.3;},{timeout:20000}).toBe(true);
 const started=await get();expect(started.src).toContain('assets/audio/ambience/volcanic.mp3');expect(started.duration).toBeCloseTo(12,0);
 expect(started.intensity).toBeCloseTo(started.expected,8);expect(Math.abs(started.time-started.sampleTime)).toBeLessThan(.15);
 await page.screenshot({path:'test-results/darkav-rumble-playing.png'});
 await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.cameras.main.shake(5000,.003,true);
 });
 await expect.poll(async()=>{const r=await get();return r.combatRunning&&r.running;}).toBe(true);
 await page.keyboard.press('m');await expect(page.getByRole('dialog',{name:'Mernodna world map'})).toBeVisible();
 await expect.poll(async()=>{const r=await get();return r.paused&&!r.running;}).toBe(true);
 const paused=await get();expect(paused.combatRunning).toBe(true);expect(paused.combatIntensity).toBe(.003);
 await page.waitForTimeout(400);expect((await get()).time).toBeCloseTo(paused.time,2);
 await page.evaluate(()=>{const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.cameras.main.shakeEffect.reset();});
 await page.keyboard.press('m');
 await expect.poll(async()=>{const r=await get();return !r.paused&&r.playing&&r.running&&r.time>paused.time+.15;}).toBe(true);
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
 });
 await expect.poll(async()=>{const r=await get();return r.paused&&!r.running;}).toBe(true);
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect.poll(async()=>{const r=await get();return r.playing&&r.running;}).toBe(true);
 await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as unknown as {volcanicTremor:{voice:HTMLAudioElement}};
  s.volcanicTremor.voice.currentTime=10.4;
 });
 await expect.poll(async()=>{const r=await get();return r.time>10.4&&r.playing&&r.intensity<.001;}).toBe(true);
 const fading=await get();expect(fading.intensity).toBeCloseTo(fading.expected,8);
 await expect.poll(async()=>{const r=await get();return !r.active&&r.paused&&!r.running;},{timeout:8000}).toBe(true);
 const ended=await get();expect(ended.nextTremor).toBeGreaterThanOrEqual(35000);expect(ended.nextTremor).toBeLessThanOrEqual(75000);
 await page.evaluate(async()=>{
  const sp='/src/store/gameStore.ts';const {useGameStore}=await import(sp);useGameStore.getState().hydrate({weatherAudio:false});
  const s=window.__mernondnaGame!.scene.getScene('world') as unknown as {volcanicTremor:{nextTremor:number}};s.volcanicTremor.nextTremor=0;
 });
 await expect.poll(async()=>{const r=await get();return r.muted&&r.playing&&r.running;}).toBe(true);
 await page.evaluate(async()=>{
  const tp='/src/data/towns.ts';const {TOWN_BY_ID}=await import(tp),s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;
  s.landFromPassage(TOWN_BY_ID.oakmere.world);
 });
 await expect.poll(async()=>{const r=await get();return r.paused&&!r.active&&!r.running&&r.time===0;}).toBe(true);
 const released=await page.evaluate(()=>{
  const s=window.__mernondnaGame!.scene.getScene('world') as unknown as {volcanicTremor:VolcanicTremor;volcanicShake:VolcanicCameraShake};
  const voice=(s.volcanicTremor as unknown as {voice:HTMLAudioElement}).voice;s.volcanicTremor.destroy();return voice.getAttribute('src');
 });
 expect(released).toBeNull();expect(errors).toEqual([]);
 console.log('Darkav sound sync',JSON.stringify({started,paused,fading,ended,requests:requests.length}));
});
