export const DRAGON_BREATH = {
  range: 540, halfAngle: .5, windupMs: 1000, ignitionMs: 140,
  burningMs: 1600, fadeMs: 200, frameMs: 75, frames: 6,
} as const;
const smooth=(p:number)=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
/** The authored breath-release head faces sideways. Do not aim the plume
 * vertically while leaving that head pointing left/right. Lock at cast start. */
export function dragonBreathDirection(flipped:boolean){
  return {x:flipped?-1:1,y:0,angle:flipped?Math.PI:0};
}
/** A local attack clock keeps frame animation, growth and damage in sync. */
export function breathPresentation(age:number){
  const growth=smooth(age/DRAGON_BREATH.ignitionMs);
  const fade=1-smooth((age-DRAGON_BREATH.burningMs)/DRAGON_BREATH.fadeMs);
  return {frame:Math.floor(Math.max(0,age)/DRAGON_BREATH.frameMs)%DRAGON_BREATH.frames,
    growth,alpha:growth*fade,damaging:age>=DRAGON_BREATH.ignitionMs&&age<DRAGON_BREATH.burningMs};
}
export function insideBreathCone(dx:number,dy:number,aimX:number,aimY:number,range:number=DRAGON_BREATH.range){
  const forward=dx*aimX+dy*aimY,side=Math.abs(dx*aimY-dy*aimX);
  return forward>=0&&forward<=range*Math.cos(DRAGON_BREATH.halfAngle)
    &&side<=forward*Math.tan(DRAGON_BREATH.halfAngle);
}
// Original 192x152 dragon cells register the feet at (100,146). The sustained
// breath uses the open-jaw, forward-leaning pose, without its old baked fire.
export const DRAGON_JAW = [{x:163,y:98},{x:148,y:64},{x:171,y:94}] as const;
export function dragonMouth(x:number,y:number,flipX:boolean,sourceScale:number,pose=2){
  const mouth=DRAGON_JAW[pose];
  return {x:x+(flipX?-1:1)*(mouth.x-100)*sourceScale,y:y+(mouth.y-146)*sourceScale};
}
