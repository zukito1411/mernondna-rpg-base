import {describe,expect,it} from 'vitest';
import {companionCameraFilter} from '../src/game/systems/companionVisibility';

describe('Alice follower camera visibility',()=>{
 it('does not hide Alice from the main camera when her awakened player masks the original body',()=>{
  const mainCamera=1;
  // AwakenedHeroVisual deliberately hides the original hero with this bit.
  const temporarilyHiddenHero=mainCamera;
  expect(companionCameraFilter(temporarilyHiddenHero,mainCamera)).toBe(0);
 });
 it('preserves legitimate exclusions for unrelated cameras',()=>{
  const mainCamera=1,otherCameras=2|4;
  expect(companionCameraFilter(mainCamera|otherCameras,mainCamera)).toBe(otherCameras);
  expect(companionCameraFilter(otherCameras,mainCamera)).toBe(otherCameras);
 });
 it('shows the companion consistently before, during and after a cosmetic swap',()=>{
  const mainCamera=1,states=[0,1,1,0,1,0];
  expect(states.map(filter=>companionCameraFilter(filter,mainCamera))).toEqual([0,0,0,0,0,0]);
 });
});
