import type {RegionId} from '../game/types';
import type {ArtTextureKey} from './art';
import type {TreeTexture} from './treeArt';

export interface HabitatObject {texture:ArtTextureKey;frame:number;scale:number;solid?:boolean}
export interface RegionSceneryProfile {
  treeTexture:TreeTexture;treeHeight:number;treeVariation:number;
  groundTint:string;fogTint:readonly [number,number,number];
  meadow:readonly HabitatObject[];forest:readonly HabitatObject[];rocky:readonly HabitatObject[];
}
const w=(frame:number,scale:number,solid=false):HabitatObject=>({texture:'woodland_props',frame,scale,solid:solid||frame===5});
const d=(frame:number,scale:number,solid=false):HabitatObject=>({texture:'desert_props',frame,scale,solid});
const c=(frame:number,scale:number,solid=false):HabitatObject=>({texture:'climate_props',frame,scale,solid});
const f=(frame:number,scale:number):HabitatObject=>({texture:'flora',frame,scale});
const grass=[w(1,.3),w(4,.36),f(0,.75),f(1,.75),w(3,.35)];
const woodland=[w(2,.34),w(6,.66,true),w(7,.42,true),w(10,.24),w(5,.72),w(8,.42,true)];
const highland=[w(9,1.1,true),w(8,.6,true),w(3,.35),f(7,.85)];
/** Palettes follow the supplied world/lore plates. Sizes are physical world
 * sizes: mushrooms are not tree-sized and mature trees are not shrub-sized. */
export const REGION_SCENERY:Record<RegionId,RegionSceneryProfile>={
  trandum:{treeTexture:'world_assets',treeHeight:285,treeVariation:45,groundTint:'#b5ad69',fogTint:[190,205,185],meadow:grass,forest:woodland,rocky:highland},
  narenthil:{treeTexture:'world_assets',treeHeight:355,treeVariation:65,groundTint:'#668a65',fogTint:[164,199,183],meadow:[w(1,.34),w(4,.42),f(2,.85)],forest:[...woodland,w(3,.5),w(2,.45)],rocky:[w(9,.85,true),w(8,.65,true)]},
  nardorous:{treeTexture:'climate_props',treeHeight:300,treeVariation:50,groundTint:'#9ba8b5',fogTint:[187,204,221],meadow:highland,forest:[c(1,1.05,true),w(7,.5,true)],rocky:[c(2,.72,true),c(3,.82,true),w(9,1.25,true)]},
  rindass:{treeTexture:'world_assets',treeHeight:270,treeVariation:35,groundTint:'#c6a06a',fogTint:[200,181,149],meadow:[d(0,.72,true),d(1,.52,true),d(2,.4),d(3,.38),d(10,.4)],forest:[d(2,.5),d(3,.45)],rocky:[d(4,1,true),d(5,.85,true),d(0,.65,true)]},
  druganwoods:{treeTexture:'world_assets',treeHeight:325,treeVariation:65,groundTint:'#708569',fogTint:[163,187,184],meadow:[w(1,.32),w(4,.42),w(5,.85)],forest:[...woodland,w(6,.82,true)],rocky:highland},
  portquill:{treeTexture:'world_assets',treeHeight:285,treeVariation:40,groundTint:'#9cac82',fogTint:[190,211,214],meadow:[w(0,.38),w(4,.36),f(9,.8)],forest:[w(6,.7,true),w(2,.4),w(5,.85)],rocky:[w(9,.9,true),w(8,.6,true)]},
  frostlands:{treeTexture:'climate_props',treeHeight:320,treeVariation:55,groundTint:'#9cbdca',fogTint:[192,212,232],meadow:[c(1,1.1,true),c(3,.8,true)],forest:[c(1,1.2,true),c(3,.8,true)],rocky:[c(2,.85,true),c(3,1,true)]},
  darkav:{treeTexture:'world_assets',treeHeight:260,treeVariation:0,groundTint:'#8b6261',fogTint:[120,111,118],meadow:[c(6,.55,true),c(8,.6,true)],forest:[c(7,.95,true),c(6,.6,true)],rocky:[c(7,1.15,true),c(8,.9,true),c(6,.75,true)]},
  'dead-sea':{treeTexture:'world_assets',treeHeight:285,treeVariation:0,groundTint:'#719ba8',fogTint:[187,209,216],meadow:[],forest:[],rocky:[]},
};
