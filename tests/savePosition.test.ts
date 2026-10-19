import {describe,it,expect} from 'vitest';
import {authoritativeSavePosition} from '../src/game/systems/authoritativeSavePosition';

describe('save location after regional travel',()=>{
 const highmere={x:34560,y:39248};
 const redmesa={x:122252,y:77522};
 it('saves Red Mesa after teleport even if opening cinematic retains old Trandum outside coordinates',()=>{
  expect(authoritativeSavePosition(redmesa,{active:false,safePosition:highmere},false,{active:false,safePosition:null}))
   .toEqual(redmesa);
 });
 it('uses the outside door while actually sleeping inside an inn',()=>{
  expect(authoritativeSavePosition({x:250,y:300},{active:true,safePosition:highmere},false,null))
   .toEqual(highmere);
 });
 it('retains the pre-cutscene location during an active exterior cinematic',()=>{
  expect(authoritativeSavePosition({x:300,y:400},{active:false,safePosition:highmere},true,null))
   .toEqual(highmere);
 });
 it('saves the departure port during a live ship voyage',()=>{
  expect(authoritativeSavePosition({x:100000,y:70000},null,false,{active:true,safePosition:highmere}))
   .toEqual(highmere);
 });
 it('never favors a stale finished voyage over the current player position',()=>{
  expect(authoritativeSavePosition(redmesa,null,false,{active:false,safePosition:highmere}))
   .toEqual(redmesa);
 });
});
