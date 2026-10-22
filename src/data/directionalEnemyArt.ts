export const ACTOR_DIRECTIONS=['down','left','right','up'] as const;
export type ActorDirection=typeof ACTOR_DIRECTIONS[number];
/** Directional families declare their complete per-facing source stride.
 * Boss variants retain their existing species art and appearance multiplier. */
export const DIRECTIONAL_ENEMY_ART=[
 {species:0,id:'gray-wolf',texture:'enemies',walkTexture:'enemy_walk_wolf',sourcePath:'assets/enemies/directional/gray-wolf.png',sourceColumns:5,framesPerDirection:5,frameCount:20,frameWidth:128,frameHeight:112},
 {species:1,id:'road-bandit',texture:'enemies',walkTexture:'enemy_walk_bandit',sourcePath:'assets/enemies/directional/road-bandit.png',sourceColumns:5,framesPerDirection:5,frameCount:20,frameWidth:128,frameHeight:112},
 {species:2,id:'boarfiend',texture:'enemies',walkTexture:'enemy_walk_boar',sourcePath:'assets/enemies/directional/boarfiend.png',sourceColumns:5,framesPerDirection:5,frameCount:20,frameWidth:144,frameHeight:112},
 {species:3,id:'marsh-wraith',texture:'enemies',walkTexture:'enemy_walk_wraith',sourcePath:'assets/enemies/directional/marsh-wraith.png',sourceColumns:5,framesPerDirection:5,frameCount:20,frameWidth:144,frameHeight:128},
 {species:4,id:'cave-troll',texture:'enemy_troll',walkTexture:'enemy_walk_troll',sourcePath:'assets/enemies/directional/cave-troll.png',sourceColumns:5,framesPerDirection:5,frameCount:20,frameWidth:240,frameHeight:160},
 // The prepacked Varkhul adapter retains the legacy slots and adds four
 // side-step slots; it owns their explicit animation order, not this grid.
 {species:5,id:'ash-dragon',texture:'enemy_dragon',walkTexture:'enemy_walk_dragon',sourcePath:'assets/enemies/directional/ash-dragon.png',sourceColumns:5,framesPerDirection:5,frameCount:24,frameWidth:384,frameHeight:288},
 {species:6,id:'salt-king',texture:'enemy_salt_king',walkTexture:'enemy_walk_salt_king',sourcePath:'assets/enemies/salt_king/walk.png',sourceColumns:5,framesPerDirection:5,frameCount:27,frameWidth:128,frameHeight:112},
 {species:8,id:'rindass-orc-raider',texture:'enemy_orc_raider',walkTexture:'enemy_walk_orc_raider',
  sourcePath:'assets/enemies/rindass_orc_raider/walk.png',sourceColumns:7,framesPerDirection:7,frameCount:28,frameWidth:160,frameHeight:128},
 {species:9,id:'rindass-orc-spearman',texture:'enemy_orc_spearman',walkTexture:'enemy_walk_orc_spearman',
  sourcePath:'assets/enemies/rindass_orc_range/walk.png',sourceColumns:7,framesPerDirection:7,frameCount:28,frameWidth:160,frameHeight:128},
] as const;
/** Reject Phaser's tiny missing-texture placeholder before silhouette extraction. */
export function validDirectionalSourceSize(width:number,height:number,columns:number):boolean {
 return Number.isInteger(width)&&Number.isInteger(height)&&width>=columns*80&&height>=400;
}
export function enemyLocomotionKey(species:number,state:'idle'|'walk',direction:ActorDirection){
 return `enemy:${species}:${state}:${direction}`;
}
/** Hysteresis at diagonal corners; very small motion retains the last facing. */
export function actorTravelDirection(x:number,y:number,previous:ActorDirection):ActorDirection{
 if(Math.hypot(x,y)<3)return previous;
 return actorAimDirection(x,y,previous);
}
/** A committed aim may be a unit vector. Never apply the walking speed dead
 * zone here: that leaves stationary casters facing their last travel heading. */
export function actorAimDirection(x:number,y:number,previous:ActorDirection):ActorDirection{
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<1e-6)return previous;
 const sideways=previous==='left'||previous==='right';
 return Math.abs(x)>Math.abs(y)*(sideways?.85:1.15)?x<0?'left':'right':y<0?'up':'down';
}
