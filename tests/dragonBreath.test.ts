import {describe,it,expect} from 'vitest';
import {DRAGON_BREATH,breathPresentation,insideBreathCone,dragonMouth} from '../src/game/systems/dragonBreath';
describe('dragon breath timing and ground footprint',()=>{
 it('starts and ends without damage while the plume grows and dissipates',()=>{
  expect(breathPresentation(0)).toMatchObject({alpha:0,growth:0,damaging:false});
  expect(breathPresentation(70).alpha).toBeCloseTo(.5);
  expect(breathPresentation(140)).toMatchObject({alpha:1,growth:1,damaging:true});
  expect(breathPresentation(1600).damaging).toBe(false);
  expect(breathPresentation(1700).alpha).toBeCloseTo(.5);
  expect(breathPresentation(1800).alpha).toBe(0);
 });
 it('loops real frames on the attack clock',()=>{
  expect(Array.from({length:6},(_,i)=>breathPresentation(i*75).frame)).toEqual([0,1,2,3,4,5]);
  expect(breathPresentation(450).frame).toBe(0);
 });
 it('matches the far chord and side edges in any aim direction',()=>{
  const reach=DRAGON_BREATH.range*Math.cos(DRAGON_BREATH.halfAngle);
  for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5,.6]){
   const x=Math.cos(angle),y=Math.sin(angle);
   expect(insideBreathCone(x*300,y*300,x,y)).toBe(true);
   expect(insideBreathCone(x*(reach+1),y*(reach+1),x,y)).toBe(false);
   expect(insideBreathCone(-x*20,-y*20,x,y)).toBe(false);
   expect(insideBreathCone(x*200-y*140,y*200+x*140,x,y)).toBe(false);
  }
 });
 it('registers the nozzle to the scaled open-jaw pose and mirrors with the head',()=>{
  const right=dragonMouth(1000,1000,false,2.08),left=dragonMouth(1000,1000,true,2.08);
  expect(right.x-1000).toBeCloseTo(147.68);expect(1000-left.x).toBeCloseTo(147.68);
  expect(right.y).toBeCloseTo(891.84);expect(left.y).toBe(right.y);
  expect(dragonMouth(1000,1000,false,2.08,1).y).toBeLessThan(right.y);
 });
});
