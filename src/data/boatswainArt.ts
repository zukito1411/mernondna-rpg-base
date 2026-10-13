import {ACTOR_DIRECTIONS,enemyLocomotionKey} from './directionalEnemyArt';
import type {SpriteAnimation} from './animationPacks';

export const BOATSWAIN_SPECIES=10;
export const BOATSWAIN_TEXTURE='enemy_pirate_boatswain' as const;
export const BOATSWAIN_ART={
  walk:{path:'assets/enemies/pirate_boatswain/walk.png',columns:7,rows:4,offset:0},
  attack:{path:'assets/enemies/pirate_boatswain/attack.png',columns:6,rows:4,offset:28},
  states:{path:'assets/enemies/pirate_boatswain/states.png',columns:6,rows:4,offset:52},
} as const;
export const BOATSWAIN_GAIT_ART={
  side:{path:'assets/enemies/pirate_boatswain/walk-side-v2.png',columns:3,rows:2},
  vertical:{path:'assets/enemies/pirate_boatswain/walk-vertical-v2.png',columns:2,rows:4},
} as const;
// Only complete contact/passing poses are used. Side support pose 4 swaps
// the carrying hand, and vertical contacts 0/1 duplicate the leading boot.
// Keep those out of playback, using the original down-contact pair instead.
export const BOATSWAIN_SIDE_GAIT=[0,2,3,5] as const;
export const BOATSWAIN_DOWN_PASSING=[2,3] as const;
export const BOATSWAIN_UP_GAIT=[4,6,5,7] as const;
// Source boot baselines, independent of the hammer's lowest/raised pixels.
// Rows follow down/left/right/up in the supplied 1536x1024 attack sheet.
export const BOATSWAIN_ATTACK_FEET=[
  [285,286,285,286,288,285],
  [550,549,552,546,554,549],
  [784,781,786,784,788,784],
  [1002,1000,1006,1005,1004,1003],
] as const;

export const BOATSWAIN_ANIMATIONS:SpriteAnimation[]=ACTOR_DIRECTIONS.flatMap((direction,row)=>{
  const walk=row*7,attack=28+row*6,state=52+row*6;
  return [
    {key:enemyLocomotionKey(BOATSWAIN_SPECIES,'idle',direction),texture:BOATSWAIN_TEXTURE,frames:[walk],frameRate:1,repeat:-1},
    {key:enemyLocomotionKey(BOATSWAIN_SPECIES,'walk',direction),texture:BOATSWAIN_TEXTURE,frames:[1,2,3,4].map(i=>walk+i),frameRate:7,repeat:-1},
    // Impact begins at 700ms; the full recovery lasts another 700ms.
    {key:`enemy:10:attack:${direction}`,texture:BOATSWAIN_TEXTURE,frames:[0,0,1,1,2,2,2,3,3,4,4,5,5,5].map(i=>attack+i),frameRate:10,repeat:0},
    {key:`enemy:10:hurt:${direction}`,texture:BOATSWAIN_TEXTURE,frames:[state,state+1,state+2],frameRate:12,repeat:0},
    {key:`enemy:10:death:${direction}`,texture:BOATSWAIN_TEXTURE,frames:[state+3,state+4,state+5],frameRate:7,repeat:0},
  ];
});
for(const state of ['idle','walk','attack','hurt','death'] as const){
  const clip=BOATSWAIN_ANIMATIONS.find(animation=>animation.key===`enemy:10:${state}:down`)!;
  BOATSWAIN_ANIMATIONS.push({...clip,key:`enemy:10:${state}`});
}
