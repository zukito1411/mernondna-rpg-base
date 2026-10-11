import {describe,it,expect} from 'vitest';
import {restoredEnemyHealth} from '../src/game/systems/enemyHealth';
import {StaticBoundsIndex} from '../src/game/systems/StaticBoundsIndex';
import {natureMix} from '../src/game/systems/NatureAmbience';
import {ContentChunkManager} from '../src/game/systems/ContentChunkManager';
describe('health across streamed enemy tiers',()=>{
 it('preserves a damaged scaled enemy even when HP equals its original base maximum',()=>{
  expect(restoredEnemyHealth({hp:62,hpMax:96},96)).toBe(62);
  expect(restoredEnemyHealth({hp:62},96)).toBe(62);
  expect(restoredEnemyHealth({hp:62,hpMax:62},96)).toBe(96);
  expect(restoredEnemyHealth({hp:0,hpMax:96},96)).toBe(0);
 });
 it('preserves damage proportion when moving between tiers',()=>{expect(restoredEnemyHealth({hp:48,hpMax:96},120)).toBe(60);});
 it('does not merge a fresh-spawn maximum into a legacy saved damage record',()=>{
  const definition={id:'health-fixture',kind:'creature' as const,enemyId:'gray-wolf',world:{x:100,y:100}};
  const manager=new ContentChunkManager([definition],{states:{'health-fixture':{x:100,y:100,hp:42}},spawns:{},nextSpawnSequence:0},{
   initialState:d=>({...d.world,hp:42,hpMax:42}),create:(_d,state)=>state,position:state=>state,capture:(_d,state)=>state,destroy:()=>{},
  });
  expect(manager.getState('health-fixture')?.hpMax).toBeUndefined();
  expect(restoredEnemyHealth(manager.getState('health-fixture')!,65)).toBe(42);
 });
});
describe('authored geometry broad phase',()=>{
 it('retains crossing roofs and exact boundary candidates without duplicate results',()=>{
  const roof={bounds:{left:-30,top:-20,right:700,bottom:600}},far={bounds:{left:10000,top:0,right:10100,bottom:100}};
  const index=new StaticBoundsIndex([roof,far]);
  expect(index.query({left:500,top:500,right:600,bottom:600})).toEqual([roof]);
  expect(index.query({left:-30,top:-20,right:-30,bottom:-20})).toEqual([roof]);
  expect(index.query({left:3000,top:3000,right:3100,bottom:3100})).toEqual([]);
 });
});
describe('quiet day/night soundscape',()=>{
 it('uses birds by day, and only night wildlife with no BGM after sunset',()=>{
  const day=natureMix(720,'trandum','meadow'),night=natureMix(1200,'trandum','meadow');
  expect(day.music).toBe(.24);expect(day.birds).toBeGreaterThan(0);expect(day.crickets).toBe(0);expect(day.owl).toBe(0);
  expect(night.music).toBe(0);expect(night.birds).toBe(0);expect(night.crickets).toBeGreaterThan(0);expect(night.owl).toBeGreaterThan(0);
  expect(natureMix(1079,'trandum','forest').music).toBe(.24);expect(natureMix(1080,'trandum','forest').music).toBe(0);
  expect(natureMix(359,'trandum','forest').music).toBe(0);expect(natureMix(360,'trandum','forest').music).toBe(.24);
 });
 it('keeps woodland animals out of the ocean, ice and lava regions',()=>{
  for(const region of ['darkav','dead-sea','frostlands'])for(const minute of [720,1200]){
   const mix=natureMix(minute,region,'coast');expect([mix.birds,mix.crickets,mix.owl]).toEqual([0,0,0]);
  }
 });
});
