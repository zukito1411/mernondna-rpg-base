import {test,expect} from '@playwright/test';
import type {WorldScene} from '../../src/game/scenes/WorldScene';
import type {EnemySoundSystem} from '../../src/game/systems/EnemySoundSystem';
import type Phaser from 'phaser';
test('all mobs use dedicated decoded recordings and owned audio obeys pause, unload and death',async({page})=>{
 test.setTimeout(120000);await page.goto('/?e2e');await page.getByRole('button',{name:'Start New Game',exact:true}).click();await page.waitForFunction(()=>window.__mernondnaGame?.registry.get('worldReady'));
 const audit=await page.evaluate(async()=>{
  const ep='/src/data/enemies.ts',ap='/src/data/enemyAudio.ts',sp='/src/store/gameStore.ts';const {ENEMIES}=await import(ep),{enemyAudioCue,enemyVoice}=await import(ap),{useGameStore}=await import(sp);
  const s=window.__mernondnaGame!.scene.getScene('world') as WorldScene;s.scene.pause();s.physics.world.pause();useGameStore.getState().hydrate({weatherAudio:true});
  const sound=(s as unknown as {enemySounds:EnemySoundSystem}).enemySounds;sound.pause(false);
  const mappings=ENEMIES.map((enemy:typeof ENEMIES[number])=>({id:enemy.id,voice:enemyVoice(enemy),clips:['attack','growl','hurt','death'].map(cue=>{const p=enemyAudioCue(enemy,cue as 'attack');const b=s.cache.audio.get(p.key) as AudioBuffer;return{key:p.key,duration:b.duration,rate:p.rate};})}));
  const registry=sound as unknown as {voices:Map<string,{sound:Phaser.Sound.BaseSound;cue:string}>;effects:Map<string,{sound:Phaser.Sound.BaseSound}>};
  const e=ENEMIES[0],x=s.player.x,y=s.player.y,id='sound-audit';sound.play(e,id,'attack',x,y);const attack=registry.voices.get(id)!.sound;
  sound.play(e,id,'growl',x,y);const growlSkipped=registry.voices.get(id)!.sound===attack;
  sound.play(e,id,'hurt',x,y);const hurt=registry.voices.get(id)!.sound;
  sound.play(e,id,'death',x,y);const death=registry.voices.get(id)!.sound;
  sound.play(e,id,'attack',x,y);const deathRetained=registry.voices.get(id)!.sound===death;
  sound.pause(true);const paused=death.isPaused;sound.pause(false);const resumed=death.isPlaying;
  sound.forget(id);const deathFinishes=registry.voices.get(id)?.sound===death;
  sound.play(e,'unload-audit','attack',x,y);sound.forget('unload-audit');const forgotten=!registry.voices.has('unload-audit');
  sound.play(e,'far','attack',x+5000,y);const inaudible=!registry.voices.has('far');
  sound.playEffect('dragon-audit','flight',x,y,2400);const flight=registry.effects.get('dragon-audit')!.sound;
  const flightMarker=flight.markers.cue.duration;sound.playEffect('dragon-audit','breath',x,y,1660);const breathMarker=registry.effects.get('dragon-audit')!.sound.markers.cue.duration;
  sound.stopEffect('dragon-audit');const effectStopped=!registry.effects.has('dragon-audit');
  useGameStore.getState().hydrate({weatherAudio:false});sound.play(e,'muted','attack',x,y);const muted=!registry.voices.has('muted');
  useGameStore.getState().hydrate({weatherAudio:true});
  return{mappings,growlSkipped,hurtReplaced:hurt!==attack,deathRetained,deathFinishes,paused,resumed,forgotten,inaudible,muted,effectStopped,flightMarker,breathMarker};
 });
 const expected:Record<string,string>={'gray-wolf':'wolf','road-bandit':'human','bandit-captain':'human','salt-king':'human','rindass-boar':'boar','redmesa-chieftain':'boar','marsh-wraith':'wraith','moonlit-warden':'wraith','rootfather':'wraith','ashen-seer':'wraith','cave-troll':'troll','stonejaw-troll':'troll','frost-wyrm':'wyrm','ash-dragon':'dragon'};
 for(const m of audit.mappings){expect(m.voice).toBe(expected[m.id]);for(const c of m.clips){expect(c.duration).toBeGreaterThan(.1);if(m.voice==='dragon')expect(c.rate).toBe(1);}}
 for(const flag of ['growlSkipped','hurtReplaced','deathRetained','deathFinishes','paused','resumed','forgotten','inaudible','muted','effectStopped'] as const)expect(audit[flag],flag).toBe(true);
 expect(audit.flightMarker).toBe(2.4);expect(audit.breathMarker).toBe(1.66);
});
