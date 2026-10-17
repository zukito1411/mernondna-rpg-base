import {artFrameSize} from './art';
import type {ContentDefinition,WorldPropTexture} from '../game/types';

interface Replacement {texture:WorldPropTexture;frame:number;height:number;solid?:boolean}
const story=(frame:number,height:number,solid=false):Replacement=>({texture:'native_story_bare',frame,height,solid});
const landmark=(frame:number,height:number,solid=true):Replacement=>({texture:'native_quest_landmarks',frame,height,solid});
const replacements:Record<string,Replacement>={
  'training:highmere-target':story(5,82,true),
  'clue:cibar-pump':story(6,65,true),
  'collect:cibar-fitting:0':story(7,18),
  'collect:cibar-fitting:1':story(8,22),
  'collect:cibar-fitting:2':story(9,22),
  'clue:grain-receipt':story(0,55),
  'clue:weighhouse-ledger':story(2,55),
  'clue:relief-tally':story(2,58),
  'story:seed-cart-wagon':story(4,100,true),
  'story:seed-cart':story(8,26),
  'story:varr-orders':story(0,55),
  'story:varr-cargo':story(10,46),
  'story:relief-letter':story(0,55),
  'story:beacon-kit':story(1,36),
  'story:frost-lantern':story(3,32),
  'story:forge-record':{texture:'native_forge_record',frame:0,height:60},
  'story:flagship-manifest':story(9,24),
  'story:signal-fire:winter-signal':{texture:'native_civic_bare',frame:3,height:65},
  'story:signal-fire:mountain-signal':{texture:'native_civic_bare',frame:3,height:85},
  'adventure:family-deed':story(9,24),
  'adventure:soldier-letter':story(8,24),
  'adventure:poacher-snare':{texture:'native_keepsakes',frame:0,height:30},
  'adventure:sailor-locket':{texture:'native_keepsakes',frame:1,height:16},
  'loot:pirate-flagship:cargo':story(10,46),
  'loot:oakmere-road-cache':story(10,50),
  'harvest:oakmere-berries':{texture:'flora',frame:3,height:42},
  'discovery:royal-waystone':{texture:'native_keepsakes',frame:2,height:86,solid:true},
  'discovery:greenward-ruin':{texture:'native_keepsakes',frame:3,height:78,solid:true},
  'discovery:rootwater-watch':{texture:'native_keepsakes',frame:3,height:78,solid:true},
  'discovery:moon-pilgrim-grove':landmark(3,100),
  'discovery:crown-freight-camp':story(4,100,true),
  'discovery:seed-road-camp':story(4,100,true),
  'discovery:clan-road-muster':landmark(0,72),
  'discovery:pass-beacon':landmark(1,100),
  'discovery:ice-bay-outlook':landmark(1,110),
  'discovery:southern-caravan-rest':landmark(2,125),
  'discovery:salt-bay-outlook':{texture:'native_civic_bare',frame:13,height:130,solid:true},
  'discovery:darkav:burnt-chainworks':landmark(4,160),
  'discovery:darkav:ashwood-watch':{texture:'darkav_props',frame:3,height:190,solid:true},
  'discovery:darkav:cinder-pilgrim-ruin':{texture:'darkav_props',frame:3,height:190,solid:true},
  'discovery:ash-vent-watch':{texture:'climate_props',frame:10,height:125,solid:true},
  'detail:wilderness:crown-freight-camp':landmark(5,40,false),
  'detail:wilderness:seed-road-camp':landmark(5,40,false),
  'detail:wilderness:clan-road-muster':{texture:'native_civic_bare',frame:4,height:90},
  'detail:wilderness:pass-beacon':{texture:'native_region_props',frame:5,height:75,solid:true},
  'detail:wilderness:ice-bay-outlook':{texture:'climate_props',frame:3,height:65,solid:true},
  'detail:wilderness:salt-bay-outlook':{texture:'native_civic_bare',frame:7,height:40},
  'detail:wilderness:southern-caravan-rest':story(1,42),
  'detail:wilderness:moon-pilgrim-grove':{texture:'woodland_props',frame:2,height:35},
  'detail:wilderness:darkav:ashwood-watch':{texture:'native_region_props',frame:0,height:255,solid:true},
  'detail:wilderness:darkav:burnt-chainworks':{texture:'native_region_props',frame:1,height:65,solid:true},
  'detail:wilderness:darkav:cinder-pilgrim-ruin':{texture:'climate_props',frame:9,height:90,solid:true},
  'detail:wilderness:ash-vent-watch':{texture:'climate_props',frame:7,height:100,solid:true},
};

export const isNativePropReplacement=(id:string)=>Object.hasOwn(replacements,id);

/** Physical sizes relative to the 76-unit hero, independent of placeholder size.
 * New complete silhouettes are fitted afterwards, before final board placement.
 * Stable IDs retain quest hooks and saved discovery/loot progress. */
export function applyNativePropReplacements(content:ContentDefinition[]){
  for(const definition of content){
    if(!('frame' in definition))continue;
    const replacement=replacements[definition.id];if(!replacement)continue;
    const next=artFrameSize(replacement.texture,replacement.frame);
    definition.texture=replacement.texture;definition.frame=replacement.frame;
    definition.scale=replacement.height/next.height;
    definition.solid=replacement.solid??false;definition.tint=0xffffff;
    if('footprint' in definition)definition.footprint=undefined;
  }
}
