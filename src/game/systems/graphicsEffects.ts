// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
// Local visual preferences do not alter saves or world simulation.
// Graphics Low/Normal controls cadence and resolution of effects left enabled.
export const GRAPHICS_EFFECTS_EVENT='leighneron-graphics-effects';
export interface GraphicEffects {
 nightMist:boolean; daytimeFog:boolean; weatherParticles:boolean;
 cloudShadows:boolean; sunRays:boolean; treeSway:boolean; waterMotion:boolean;
 dynamicShadows:boolean; fireflies:boolean; lightBloom:boolean; nightDarkness:boolean;
 combatShake:boolean; groundBlend:boolean;
}
export type GraphicEffectKey=keyof GraphicEffects;
const STORAGE_KEY='leighneron:graphics-effects:v1';
// Previous releases saved the old enabled nighttime defaults in the same
// object. Apply the new low-cost defaults once to existing installations,
// without resetting unrelated graphics choices or saved game progress.
const NIGHT_PERFORMANCE_MIGRATION_KEY='leighneron:night-performance-defaults:v1';
function recommended():GraphicEffects{
 return {nightMist:false,daytimeFog:true,weatherParticles:true,cloudShadows:true,
   sunRays:true,treeSway:true,waterMotion:true,dynamicShadows:true,
   fireflies:false,lightBloom:false,nightDarkness:false,
   combatShake:typeof window==='undefined'||!window.matchMedia('(prefers-reduced-motion: reduce)').matches,
   // Disable dynamic ground-skirt recoloring by default on every device.
   // The unmodified full-resolution scenery textures still render.
   groundBlend:false};
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
  // One-time migration. Old persisted defaults can otherwise keep night
  // bloom, animated fireflies and the dynamic light-hole mask enabled forever.
  // Any choices made after this migration remain respected.
  if(localStorage.getItem(NIGHT_PERFORMANCE_MIGRATION_KEY)!=='1'){
   value.nightMist=false;
   value.lightBloom=false;
   value.fireflies=false;
   value.nightDarkness=false;
   localStorage.setItem(STORAGE_KEY,JSON.stringify(value));
   localStorage.setItem(NIGHT_PERFORMANCE_MIGRATION_KEY,'1');
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
