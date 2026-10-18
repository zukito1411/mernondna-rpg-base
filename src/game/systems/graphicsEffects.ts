// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
// Local visual preferences do not alter saves or world simulation.
// Graphics Low/Normal controls cadence and resolution of effects left enabled.
export const GRAPHICS_EFFECTS_EVENT='leighneron-graphics-effects';
export interface GraphicEffects {
 nightMist:boolean; daytimeFog:boolean; weatherParticles:boolean;
 cloudShadows:boolean; sunRays:boolean; treeSway:boolean; waterMotion:boolean;
 dynamicShadows:boolean; fireflies:boolean; lightBloom:boolean; nightDarkness:boolean;
 combatShake:boolean;
}
export type GraphicEffectKey=keyof GraphicEffects;
const STORAGE_KEY='leighneron:graphics-effects:v1';
const mobile=()=>typeof window!=='undefined'&&(
  window.matchMedia('(pointer: coarse)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent));
function recommended():GraphicEffects{
 return {nightMist:!mobile(),daytimeFog:true,weatherParticles:true,cloudShadows:true,
   sunRays:true,treeSway:true,waterMotion:true,dynamicShadows:true,
   fireflies:true,lightBloom:true,nightDarkness:true,
   combatShake:typeof window==='undefined'||!window.matchMedia('(prefers-reduced-motion: reduce)').matches};
}
let cache:GraphicEffects|undefined;
export function getGraphicEffects():GraphicEffects {
 if(cache)return cache;
 const value=recommended();
 try{
  const json=localStorage.getItem(STORAGE_KEY);
  if(json){const stored=JSON.parse(json) as Record<string,unknown>;
   for(const key of Object.keys(value) as GraphicEffectKey[])
    if(typeof stored[key]==='boolean')value[key]=stored[key] as boolean;
  }
 }catch{/* Some Android WebViews restrict storage. */}
 cache=value;return value;
}
function save(value:GraphicEffects){
 cache=value;
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch{}
 window.dispatchEvent(new Event(GRAPHICS_EFFECTS_EVENT));
}
export function setGraphicEffect(key:GraphicEffectKey,value:boolean){
 save({...getGraphicEffects(),[key]:value});
}
export function resetGraphicEffects(){save(recommended());}
