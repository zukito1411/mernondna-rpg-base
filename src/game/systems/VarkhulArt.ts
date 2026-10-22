import Phaser from 'phaser';
import {VARKHUL_ATLAS_PAGES,VARKHUL_DENSITY,VARKHUL_SIDE_WALK_FRAMES,VARKHUL_WALK_CYCLE_MS} from '../../data/varkhulArt';
import {ACTOR_DIRECTIONS,enemyLocomotionKey} from '../../data/directionalEnemyArt';
import type {SpriteAnimation} from '../../data/animationPacks';

/** Reuse the normal texture manager and animation system. No source decoding,
 * silhouette extraction or per-frame fitting is performed during gameplay. */
export function prepareVarkhulArt(scene:Phaser.Scene):SpriteAnimation[]{
 for(const page of VARKHUL_ATLAS_PAGES){
  const key='varkhul-source:'+page.texture;
  // Rename the loader texture in place: do not upload the same page twice.
  const texture=scene.textures.get(key);
  scene.textures.renameTexture(key,page.texture);
  for(const [id,entry] of Object.entries(page.frames)){
   const [x,y,w,h]=entry.rect,[fw,fh,tx,ty,tw,th]=entry.trim;
   const frame=texture.add(Number(id),0,x,y,w,h)!;
   frame.setTrim(fw,fh,tx,ty,tw,th);
   frame.customData={fullSprite:true,isolatedSubject:true,visibleBounds:entry.visibleBounds,
    density:VARKHUL_DENSITY,...('mouth' in entry?{mouth:entry.mouth}:{})};
  }
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 return ACTOR_DIRECTIONS.flatMap((direction,row)=>[
  {key:enemyLocomotionKey(5,'idle',direction),texture:'enemy_walk_dragon',frames:[row*5],frameRate:1,repeat:-1},
  // Same deliberate cycle duration in every direction. The shared actor
  // locomotion code mirrors only the left-facing presentation.
  {key:enemyLocomotionKey(5,'walk',direction),texture:'enemy_walk_dragon',
   frames:direction==='left'||direction==='right'?VARKHUL_SIDE_WALK_FRAMES:[1,2,3,4].map(i=>row*5+i),
   frameRate:(direction==='left'||direction==='right'?VARKHUL_SIDE_WALK_FRAMES.length:4)*1000/VARKHUL_WALK_CYCLE_MS,repeat:-1},
 ]);
}
