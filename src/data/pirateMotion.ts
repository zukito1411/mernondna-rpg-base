import type {SpriteAnimation} from './animationPacks';
import {PIRATE_TEXTURE,PIRATE_SPECIES} from './pirateArt';
import {SALT_KING_TEXTURE} from './saltKingArt';

// Columns are opposite lead legs; rows are contact, down and passing.
// Sheet order is NOT playback order. Keep a complete half-stride on each leg.
export const PIRATE_GAIT_ORDER=[0,2,4,1,3,5] as const;
export const CAPTAIN_GAIT_DURATIONS=[150,100,110,150,100,110] as const;
export const CREW_GAIT_DURATIONS=[110,80,90,110,80,90] as const;

// Separate phases let existing gameplay windup/recovery timers control the
// visible strike. Phaser frame durations override its default frame interval.
export const PIRATE_ATTACK_PHASES:SpriteAnimation[]=[
 {key:'enemy:6:attack-windup',texture:SALT_KING_TEXTURE,frames:[0,1,2],frameRate:10,repeat:0,frameDurations:[100,200,100]},
 {key:'enemy:6:attack-recovery',texture:SALT_KING_TEXTURE,frames:[3,4,5],frameRate:10,repeat:0,frameDurations:[100,100,200]},
 {key:`enemy:${PIRATE_SPECIES}:attack-windup`,texture:PIRATE_TEXTURE,frames:[24,25],frameRate:10,repeat:0,frameDurations:[100,200]},
 {key:`enemy:${PIRATE_SPECIES}:attack-recovery`,texture:PIRATE_TEXTURE,frames:[26,27,28,29],frameRate:10,repeat:0,frameDurations:[100,100,130,170]},
];
export function pirateAttackPhase(species:number,phase:'windup'|'recovery'){
 return PIRATE_ATTACK_PHASES.find(clip=>clip.key===`enemy:${species}:attack-${phase}`);
}
export function piratePhaseDuration(clip:SpriteAnimation){
 return clip.frames.reduce((sum,_,i)=>sum+(clip.frameDurations?.[i]||1000/clip.frameRate),0);
}
