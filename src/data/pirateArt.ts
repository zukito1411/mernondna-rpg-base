export const PIRATE_TEXTURE='enemy_cutlass_pirate' as const;
export const PIRATE_PATH='assets/enemies/cutlass_pirate/poses.png';
export const PIRATE_SIDE_PATH='assets/enemies/cutlass_pirate/walk-sides-v2.png';
export const PIRATE_GAIT_PATH='assets/enemies/cutlass_pirate/walk-gait-v3.png';
export const PIRATE_SPECIES=7;
export function isPirateEnemy(id:string){return id==='cutlass-pirate'||id==='salt-king'||id==='pirate-boatswain';}
import type {SpriteAnimation} from './animationPacks';
export const PIRATE_COMBAT_ANIMATIONS:SpriteAnimation[]=['attack','hurt','death'].map((state,row)=>({
  key:`enemy:${PIRATE_SPECIES}:${state}`,texture:PIRATE_TEXTURE,frames:Array.from({length:6},(_,i)=>24+row*6+i),
  frameRate:state==='attack'?10:state==='hurt'?13:8,repeat:0,
}));
