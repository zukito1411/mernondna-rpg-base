import type {SpriteAnimation} from './animationPacks';
export const SALT_KING_STATES=['attack','hurt','death'] as const;
export const SALT_KING_TEXTURE='enemy_salt_king' as const;
export const SALT_KING_WALK_TEXTURE='enemy_walk_salt_king' as const;
export const SALT_KING_SIDE_PATH='assets/enemies/salt_king/walk-sides-v2.png';
export const SALT_KING_GAIT_PATH='assets/enemies/salt_king/walk-gait-v3.png';
export const saltKingArtPath=(state:'walk'|typeof SALT_KING_STATES[number])=>`assets/enemies/salt_king/${state}.png`;
export const SALT_KING_ANIMATIONS:SpriteAnimation[]=[
 {key:'enemy:6:idle',texture:SALT_KING_WALK_TEXTURE,frames:[10],frameRate:1,repeat:-1},
 {key:'enemy:6:walk',texture:SALT_KING_WALK_TEXTURE,frames:[11,12,13,14],frameRate:8,repeat:-1},
 ...SALT_KING_STATES.map((state,row)=>({key:`enemy:6:${state}`,texture:SALT_KING_TEXTURE,
  frames:Array.from({length:6},(_,i)=>row*6+i),frameRate:state==='attack'?10:state==='hurt'?10:8,repeat:0})),
];
