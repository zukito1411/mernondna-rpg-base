import type {ArtTextureKey} from './art';

/** Material describes the ground painted INTO the sprite, not its destination.
 * Bounds are relative to the complete visible illustration, never atlas cells. */
export type PropGroundMaterial='sand'|'vegetation'|'snow'|'ash';
export interface PropGroundProfile {
  material:PropGroundMaterial;
  top:number;
  /** Protect solid objects which share the soil's palette (wood/sandstone). */
  protect?:readonly (readonly [left:number,top:number,right:number,bottom:number])[];
}
const band=(material:PropGroundMaterial,top:number,protect?:PropGroundProfile['protect']):PropGroundProfile=>({material,top,protect});
const green=(count:number,top=.86)=>Array.from({length:count},()=>band('vegetation',top));
const PROFILES:Partial<Record<ArtTextureKey,readonly (PropGroundProfile|undefined)[]>>={
  desert_props:[
    band('sand',.72),band('sand',.72),band('sand',.70),band('sand',.68),
    band('sand',.76,[[.06,0,.94,.88]]),band('sand',.73,[[.12,0,.88,.87]]),
    band('sand',.75,[[.12,0,.90,.86]]),band('sand',.74,[[.32,0,.72,.88]]),
    band('sand',.78,[[.05,0,.94,.88]]),band('sand',.83,[[.13,0,.90,.91]]),
    band('sand',.72),band('sand',.80,[[.04,0,.34,.94],[.67,0,.97,.94],[.02,0,.98,.56]]),
  ],
  woodland_props:green(12,.84),flora:[...green(7,.84),band('sand',.78),band('sand',.78),band('sand',.80),...green(2,.84)],
  world_assets:green(8,.86),others:green(14,.87),
  climate_props:[band('snow',.82),band('snow',.80),band('snow',.82),band('snow',.78),band('snow',.78),band('snow',.81),
    band('ash',.86),band('ash',.88),band('ash',.86),band('ash',.88),band('ash',.90)],
  // The molten pool (climate frame 11) is an intentional surface, not a skirt.
  darkav_props:Array.from({length:4},()=>band('ash',.88)),
  native_region_props:[band('ash',.90),band('ash',.82),band('ash',.84),band('vegetation',.84),band('sand',.80),band('vegetation',.87)],
  native_keepsakes:[band('vegetation',.86),undefined,band('vegetation',.88),band('vegetation',.88)],
  native_story_props:[...green(3,.87),band('snow',.83),...green(8,.87)],native_quest_landmarks:green(6,.88),
  world_buildings:green(6,.94),capital_buildings:green(10,.94),elven_villas:green(10,.94),
  elarion_tree:[band('vegetation',.94)],flower_fence:green(4,.94),
};
export function propGroundProfile(texture:ArtTextureKey,frame:number){return PROFILES[texture]?.[frame];}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const groundSmoothstep=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};

/** Soft masks preserve ivory bones, green cactus bodies, flowers, neutral
 * desert stones, blue ice crystals and saturated volcanic fire/runes. */
export function propGroundColorWeight(material:PropGroundMaterial,r:number,g:number,b:number){
  if(material==='sand')return clamp((r-g*1.075)/22)*clamp((g-b*1.25)/26)*clamp((r-65)/65);
  if(material==='snow')return clamp((Math.min(r,g,b)-105)/50)*clamp((90-(Math.max(r,g,b)-Math.min(r,g,b)))/35)
    *clamp((b-r*.9)/15)*clamp((g-r*.84)/18);
  if(material==='ash'){
    const range=Math.max(r,g,b)-Math.min(r,g,b),luma=r*.2126+g*.7152+b*.0722;
    return clamp((55-range)/25)*clamp((180-luma)/55);
  }
  const vegetation=clamp((g-r*.88)/18)*clamp((g-b*1.18)/20)*clamp((g-22)/35);
  const earth=clamp((r-g*.95)/22)*clamp((g-b*1.18)/24)*clamp((95-r)/25);
  return Math.max(vegetation,earth*.8);
}
