export const GUARD_MARCH_FRAME_GUTTER=4;
export const GUARD_MARCH_ART=[
 {walk:'npc_guard',texture:'npc_guard_march',path:'assets/npcs/trandum_guard/march.png',bodyHeight:170},
 {walk:'npc_elven_guard',texture:'npc_elven_guard_march',path:'assets/npcs/elven_guard/elven_guard.png',bodyHeight:170,grid:{columns:6,rows:4},frameGutter:GUARD_MARCH_FRAME_GUTTER},
] as const;
export function guardMarchFrameOrigin(frame:number,frameWidth:number,frameHeight:number){
 const strideX=frameWidth+2*GUARD_MARCH_FRAME_GUTTER,strideY=frameHeight+2*GUARD_MARCH_FRAME_GUTTER;
 return {x:frame%6*strideX+GUARD_MARCH_FRAME_GUTTER,y:Math.floor(frame/6)*strideY+GUARD_MARCH_FRAME_GUTTER};
}
export type GuardMarchTexture=typeof GUARD_MARCH_ART[number]['texture'];
export function guardMarchTexture(walk:string){return GUARD_MARCH_ART.find(a=>a.walk===walk)?.texture;}
