export const AWAKENED_HERO_DENSITY=3;
/** Separate original-sized animation sources; never a many-animation art sheet. */
export const AWAKENED_HERO_STATES=[
 {state:'walk-down',key:'leigneron',frames:6,offset:0},
 {state:'walk-side',key:'leigneron',frames:6,offset:6},
 {state:'walk-side',key:'leigneron',frames:6,offset:12},
 {state:'walk-up',key:'leigneron',frames:6,offset:18},
 {state:'idle-front',key:'leigneron_idle',frames:6,offset:0},
 {state:'idle-side',key:'leigneron_idle_sides',frames:6,offset:0},
 {state:'run-side',key:'leigneron_running',frames:6,offset:0},
 {state:'attack',key:'leigneron_attack',frames:24,offset:0},
 {state:'azure-cleave',key:'skill_azure_cleave',frames:6,offset:0},
 {state:'skyfall-slam',key:'skill_skyfall_slam',frames:6,offset:0},
 {state:'crown-rally',key:'skill_crown_rally',frames:6,offset:0},
 {state:'crescent-flurry',key:'skill_crescent_flurry',frames:6,offset:0},
 {state:'ember-snare',key:'skill_ember_snare',frames:6,offset:0},
 {state:'iron-rush',key:'skill_iron_rush',frames:6,offset:0},
 {state:'iron-rush-up',key:'skill_iron_rush_up',frames:6,offset:0},
 {state:'iron-rush-down',key:'skill_iron_rush_down',frames:6,offset:0},
] as const;
export interface AwakenedPoseFrame {
 x:number;y:number;width:number;height:number;originX:number;originY:number;
 /** Uniform clip calibration; independent of transparent padding and effects. */
 bodyScale?:number;bodyOffsetY?:number;
 grip?:{x:number;y:number;angle:number;behind?:boolean};
}
export interface AwakenedHeroManifest {version:1;density:3;states:Record<string,{width:number;height:number;frames:AwakenedPoseFrame[]}>}
