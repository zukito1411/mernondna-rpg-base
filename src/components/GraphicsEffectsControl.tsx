import {useState} from 'react';
import {getGraphicEffects,setGraphicEffect,resetGraphicEffects,type GraphicEffectKey} from '../game/systems/graphicsEffects';

// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
const OPTIONS:ReadonlyArray<{key:GraphicEffectKey;title:string;description:string}>=[
 {key:'combatShake',title:'Combat camera shake',description:'Brief, limited shakes on confirmed heavy hits and dodges. Respects reduced-motion preferences.'},
 {key:'nightMist',title:'Nighttime mist / fog',description:'Off by default on Android. Rain and other weather can remain enabled.'},
 {key:'daytimeFog',title:'Daytime mist / fog',description:'Morning haze and foggy-weather effects.'},
 {key:'nightDarkness',title:'Night darkness mask',description:'Darkness and lantern light cutouts (visuals only).'},
 {key:'lightBloom',title:'Lantern bloom / magical glow',description:'Warm glow sprites, lit windows and rune effects.'},
 {key:'weatherParticles',title:'Weather particles',description:'Animated rain, snow, wind, dust and volcanic ash.'},
 {key:'cloudShadows',title:'Moving cloud shadows',description:'Soft shadows drifting over daytime landscapes.'},
 {key:'sunRays',title:'Sun rays',description:'Subtle light shafts during suitable daylight.'},
 {key:'dynamicShadows',title:'Moving actor shadows',description:'Player, NPC and enemy moving ground shadows.'},
 {key:'treeSway',title:'Animated tree leaves',description:'Light wind-driven motion in tree canopies.'},
 {key:'waterMotion',title:'Animated water',description:'Moving river foam and ocean details.'},
 {key:'fireflies',title:'Night fireflies',description:'Nighttime insects in selected biomes.'}
];
export function GraphicsEffectsControl(){
 const [effects,setEffects]=useState(getGraphicEffects);
 const [expanded,setExpanded]=useState(false);
 return <div className="graphics-effects-control">
  <button className="graphics-effects-expand" type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>
   Advanced graphics — individual effects {expanded?'▴':'▾'}
  </button>
  {expanded&&<div className="graphics-effects-options">
   <p className="graphics-effects-note">Disable effects independently without removing character or scenery assets. Nighttime mist defaults off on mobile.</p>
   {OPTIONS.map(option=><label className="graphics-effect-toggle" key={option.key}>
    <input type="checkbox" checked={effects[option.key]} onChange={e=>{
     setGraphicEffect(option.key,e.target.checked);setEffects({...getGraphicEffects()});
    }}/>
    <span><strong>{option.title}</strong><small>{option.description}</small></span>
   </label>)}
   <button type="button" className="graphics-effects-reset" onClick={()=>{
    resetGraphicEffects();setEffects({...getGraphicEffects()});
   }}>Restore recommended defaults</button>
  </div>}
 </div>;
}
