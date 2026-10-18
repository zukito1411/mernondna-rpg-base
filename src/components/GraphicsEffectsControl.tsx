import {useState} from 'react';
import {getGraphicEffects,setGraphicEffect,resetGraphicEffects,type GraphicEffectKey} from '../game/systems/graphicsEffects';

// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
const OPTIONS:ReadonlyArray<{key:GraphicEffectKey;title:string;description:string}>=[
 {key:'combatShake',title:'Combat camera shake',description:'Brief, limited shakes on confirmed heavy hits and dodges. Respects reduced-motion preferences.'},
 {key:'nightMist',title:'Nighttime mist / fog',description:'Off by default for smoother nighttime traversal.'},
 {key:'daytimeFog',title:'Daytime mist / fog',description:'Morning haze and foggy-weather effects.'},
 {key:'nightDarkness',title:'Night darkness mask (extra GPU)',description:'Dynamic nighttime darkness and moving lantern cutouts. Off by default to avoid night frame spikes.'},
 {key:'lightBloom',title:'Lantern bloom / magical glow',description:'Animated lantern halos, lit windows and magical glow. Off by default to improve nighttime FPS.'},
 {key:'weatherParticles',title:'Weather particles',description:'Animated rain, snow, wind, dust and volcanic ash.'},
 {key:'cloudShadows',title:'Moving cloud shadows',description:'Soft shadows drifting over daytime landscapes.'},
 {key:'sunRays',title:'Sun rays',description:'Subtle light shafts during suitable daylight.'},
 {key:'dynamicShadows',title:'Moving actor shadows',description:'Player, NPC and enemy moving ground shadows.'},
 {key:'groundBlend',title:'Ground-color blending (extra CPU)',description:'Recolor painted soil at the bottom of scenery sprites. Off by default to prevent texture-processing spikes. Reopen the game after changing this.'},
 {key:'treeSway',title:'Animated tree leaves',description:'Light wind-driven motion in tree canopies.'},
 {key:'waterMotion',title:'Animated water',description:'Moving river foam and ocean details.'},
 {key:'fireflies',title:'Night fireflies',description:'Animated night insects and glow sprites. Off by default for smoother nighttime performance.'}
];
export function GraphicsEffectsControl(){
 const [effects,setEffects]=useState(getGraphicEffects);
 const [expanded,setExpanded]=useState(false);
 return <div className="graphics-effects-control">
  <button className="graphics-effects-expand" type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>
   Advanced graphics — individual effects {expanded?'▴':'▾'}
  </button>
  {expanded&&<div className="graphics-effects-options">
   <p className="graphics-effects-note">Disable effects independently without removing character or scenery assets. Ground-color blending and expensive nighttime glow, fireflies, mist, and darkness cutouts are off by default. You can re-enable each one. Reopen the game after changing ground-color blending.</p>
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
