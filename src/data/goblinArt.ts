import {ACTOR_DIRECTIONS,enemyLocomotionKey} from './directionalEnemyArt';
import type {SpriteAnimation} from './animationPacks';

export const GOBLIN_TEXTURE='enemy_hedge_goblin' as const;
export const GOBLIN_SPECIES=11;
export const GOBLIN_ART={
  walk:{path:'assets/enemies/hedge_goblin/walk.png',columns:5,rows:3},
  actions:{path:'assets/enemies/hedge_goblin/actions.png',columns:6,rows:3},
  complete:{path:'assets/enemies/hedge_goblin/complete-poses.png',columns:3,rows:1},
} as const;
export const GOBLIN_ANIMATIONS:SpriteAnimation[]=ACTOR_DIRECTIONS.flatMap((direction,row)=>{
  const walk=row*5,action=20+row*6;
  return [
    {key:enemyLocomotionKey(GOBLIN_SPECIES,'idle',direction),texture:GOBLIN_TEXTURE,frames:[walk],frameRate:1,repeat:-1},
    {key:enemyLocomotionKey(GOBLIN_SPECIES,'walk',direction),texture:GOBLIN_TEXTURE,frames:[1,2,3,4].map(i=>walk+i),frameRate:8,repeat:-1},
    // Two held windup frames occupy 320ms of the 800ms attack, then impact.
    {key:`enemy:11:attack:${direction}`,texture:GOBLIN_TEXTURE,frames:[0,0,1,2,2].map(i=>action+i),frameRate:6.25,repeat:0},
    {key:`enemy:11:hurt:${direction}`,texture:GOBLIN_TEXTURE,frames:[action+3],frameRate:6.25,repeat:0},
    {key:`enemy:11:death:${direction}`,texture:GOBLIN_TEXTURE,frames:[action+4,action+5],frameRate:6,repeat:0},
  ];
});
for(const state of ['idle','walk','attack','hurt','death'] as const){
  const clip=GOBLIN_ANIMATIONS.find(a=>a.key===`enemy:11:${state}:down`)!;
  GOBLIN_ANIMATIONS.push({...clip,key:`enemy:11:${state}`});
}
