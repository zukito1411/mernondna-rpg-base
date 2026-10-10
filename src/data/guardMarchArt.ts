export const GUARD_MARCH_ART=[
 {walk:'npc_guard',texture:'npc_guard_march',path:'assets/npcs/trandum_guard/march.png',bodyHeight:170},
] as const;
export type GuardMarchTexture=typeof GUARD_MARCH_ART[number]['texture'];
export function guardMarchTexture(walk:string){return GUARD_MARCH_ART.find(a=>a.walk===walk)?.texture;}
