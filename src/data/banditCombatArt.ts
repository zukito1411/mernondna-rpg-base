// Complete replacements for the old combat strips whose boots were cropped
// inside the PNGs. Locomotion artwork and timing are independent of this atlas.
export const BANDIT_COMBAT_ART=[
 {state:'attack',referencePose:5,roots:[291,796,1273,296,776,1280]},
 {state:'hurt',referencePose:0,roots:[305,809,1270,293,776,1275]},
 {state:'death',referencePose:0,roots:[286,770,1278,253,764,1275]},
] as const;
export const BANDIT_COMBAT_TEXTURE='enemy_bandit' as const;
export function banditCombatPath(state:typeof BANDIT_COMBAT_ART[number]['state']){
 return `assets/enemies/refined/road-bandit-${state}.png`;
}
