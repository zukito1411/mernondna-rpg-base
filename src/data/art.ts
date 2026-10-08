import { HERO_PACK, GUARD_PACK, SHRINE_PACK, directionalSources, ENEMY_SOURCES, DIRECTION_CLIPS, type SpriteSource } from './animationPacks';

import { PLAYER_EFFECTS, PLAYER_IDLE_ANIMATION, SPRITE_BOARDS, boardSources } from './spriteBoards';

import { NPC_IDLE_ART, npcIdleSources } from './npcIdleArt';

import { PLAYER_SKILL_ART, skillArtSources } from './playerSkillArt';

import type { PlayerSkillTexture } from './activeSkills';

export type ArtTextureKey = PlayerSkillTexture | typeof NPC_IDLE_ART[number]['key'] | 'leigneron' | 'leigneron_idle' | 'leigneron_attack' | 'effect_fortification' | 'effect_hit' | 'effect_heal' | 'effect_slash' | 'effect_teleport' | 'npcs' | 'npc_guard' | 'npc_woman' | 'npc_huntress' | 'npc_villager' | 'npc_royal_guard' | 'npc_blacksmith' | 'npc_adventurer' | 'npc_attendant' | 'npc_general' | 'enemies' | 'world_objects' | 'world_buildings' | 'world_assets' | 'capital_buildings' | 'bridges' | 'others' | 'walls' | 'royal_walls' | 'terrain';

export type SpriteRegion = readonly [x: number, y: number, width: number, height: number];

// Shared target for all player walking directions and the idle animation.
export const HERO_VISIBLE_HEIGHT = 76;

interface ArtSheet {

  key: ArtTextureKey; path: string; columns: number; frameWidth: number; frameHeight: number;

  blackBackground: boolean; sourceSize?: readonly [number, number]; regions?: readonly SpriteRegion[];

  density: number; atlasColumns?: number;

  sourceInset?: number;

  trimRegions?: boolean;

  groundPoints?:readonly (readonly [number,number])[];

  sources?:readonly SpriteSource[]; contentSize?:readonly [number,number];

  names: readonly string[];

}



// Logical sizes and texture density are independent of collision sizes. Keep

// source illustrations intact; measured regions also support irregular sheets.

const poseNames = ['front','left','right','back'].flatMap(direction =>

  Array.from({ length: 6 }, (_, i) => `${direction}-${i === 0 ? 'idle' : `step-${i}`}`));

// The original walk_down/up sheets are 768x144 (6 x 128x144 frames).
// Actual replacement PNGs are 2172x724, NOT the resized 2048px preview.
const heroFrameEdges = [0, 362, 724, 1086, 1448, 1810, 2172] as const;
const heroDirectionalSources: SpriteSource[] = directionalSources(HERO_PACK).map((source, index) => {
  const isSide = index >= 6 && index < 18; // down, left, right, up
  const frame = index % 6;
  if (!isSide) {
    return {
      ...source,
      imageSize: [768, 144],
      cell: [frame * 128, 0, 128, 144],
    };
  }
  // The old pack may contain anchors/scales for the 128x144 sheets.
  // Drop them so BootScene can alpha-trim and scale these 2048x682 sheets.
  const { anchor: _oldAnchor, renderScale: _oldRenderScale, ...cleanSource } = source;
  return {
    ...cleanSource,
    imageSize: [2172, 724],
    cell: [heroFrameEdges[frame]!, 0, heroFrameEdges[frame + 1]! - heroFrameEdges[frame]!, 724],
  };
});

const boardFront = (key:string):SpriteSource => boardSources(SPRITE_BOARDS.find(board => board.key === key)!)[0];

// Compatibility for content that still names one of the old eight role frames.

// Use supplied replacement art, never the removed strip or a restored backup.

// The traveler/hunter share the adventurer outfit until their dedicated art arrives.

const castSources:SpriteSource[] = [

  { ...directionalSources(GUARD_PACK)[0],renderScale:76/160 },boardFront('npc_attendant'),

  boardFront('npc_adventurer'),boardFront('npc_huntress'),boardFront('npc_blacksmith'),

  boardFront('npc_general'),boardFront('npc_adventurer'),{ ...directionalSources(SHRINE_PACK)[0],renderScale:76/160 },

];

export const ART_SHEETS: readonly ArtSheet[] = [

  { key:'leigneron',path:HERO_PACK.animations.walk_down.png,columns:24,atlasColumns:6,density:4,frameWidth:80,frameHeight:80,blackBackground:false,

    sources:heroDirectionalSources,contentSize:[104,128],names:poseNames },

  { key:'leigneron_idle',path:'assets/characters/leigneron/idle.png',columns:6,atlasColumns:6,density:4,

    frameWidth:80,frameHeight:80,blackBackground:false,sourceSize:[2172,724],trimRegions:true,

    regions:Array.from({ length:6 },(_,i):SpriteRegion => [heroFrameEdges[i]!,0,heroFrameEdges[i+1]! - heroFrameEdges[i]!,724]),

    names:Array.from({ length:6 },(_,i) => `idle-${i}`) },

  { key:'npc_guard',path:GUARD_PACK.animations.walk_down.png,columns:24,atlasColumns:6,density:4,frameWidth:64,frameHeight:80,blackBackground:false,

    sources:directionalSources(GUARD_PACK),contentSize:[128,160],names:poseNames },

  { key:'npc_woman',path:SHRINE_PACK.animations.walk_down.png,columns:24,atlasColumns:6,density:4,frameWidth:64,frameHeight:80,blackBackground:false,

    sources:directionalSources(SHRINE_PACK),contentSize:[128,160],names:poseNames },

  { key:'npcs',path:castSources[0].path,columns:8,density:4,frameWidth:96,frameHeight:80,blackBackground:false,sources:castSources,

    names:['guard','attendant','traveler','huntress','smith','roadwarden','hunter-provisional','shrine-keeper'] },

  { key:'enemies',path:ENEMY_SOURCES[0].path,columns:ENEMY_SOURCES.length,atlasColumns:10,density:2,frameWidth:96,frameHeight:80,blackBackground:false,

    sources:ENEMY_SOURCES,contentSize:[176,158],names:ENEMY_SOURCES.map(source => source.name) },

  { key: 'world_objects', path: 'assets/sprites/world_objects.png', columns: 4, density: 2, frameWidth: 224, frameHeight: 224, blackBackground: false,

    sourceSize: [2172, 724], regions: [[40,242,432,333],[518,119,610,456],[1155,221,536,359],[1722,210,410,381]],

    names: ['cottage','inn-townhouse','ruined-arch','road-shrine'] },

  { key:'world_buildings',path:'assets/sprites/buildings.png',columns:6,atlasColumns:3,density:2,frameWidth:224,frameHeight:224,blackBackground:false,

    sourceSize:[1448,1086],regions:[[30,117,432,387],[483,46,474,455],[991,129,437,372],[61,566,372,446],[500,633,464,390],[1040,522,327,505]],

    names:['thatched-cottage','marrow-inn','pike-smithy','road-shrine','ruined-cellar','watchtower'] },

  { key:'capital_buildings',path:'assets/sprites/capital_buildings.png',columns:10,atlasColumns:5,density:2,frameWidth:384,frameHeight:384,blackBackground:false,

    sourceSize:[1448,1086],trimRegions:true,

    regions:[[16,171,353,243],[381,102,372,314],[772,14,189,401],[969,76,463,335],

      [16,422,292,297],[317,465,382,255],[710,480,351,240],[1077,423,357,305],

      [244,714,712,359],[975,728,260,337]],

    names:['town-hall','manor','watchtower','gatehouse','chapel','smithy','stable','storehouse','castle','signal-tower'] },

  { key:'bridges',path:'assets/sprites/bridges.png',columns:9,atlasColumns:3,density:2,frameWidth:224,frameHeight:224,blackBackground:false,

    sourceSize:[1448,1086],trimRegions:true,

    regions:[[31,115,420,206],[465,114,947,242],[16,402,536,275],[572,406,436,271],

      [1010,405,420,264],[18,760,403,252],[432,708,367,319],[820,732,277,303],[1107,715,326,308]],

    groundPoints:[[241,220],[938,230],[284,472],[790,510],[1220,515],[219,870],[615,890],[958,920],[1270,925]],

    names:['timber-crossing','long-timber-bridge','stone-arch-bridge','broken-stone-bridge','rope-bridge',

      'marsh-dock','harbor-pier','stone-stairs','covered-footgate'] },

  { key:'others',path:'assets/sprites/others.png',columns:14,atlasColumns:7,density:2,frameWidth:224,frameHeight:224,blackBackground:false,

    sourceSize:[1448,1086],trimRegions:true,

    regions:[[51,49,238,365],[338,59,194,354],[604,89,239,325],[932,87,176,323],[1181,103,210,311],

      [20,443,399,325],[438,447,265,311],[721,612,257,160],[982,559,221,198],[1209,542,220,219],

      [57,820,416,224],[502,778,292,276],[930,763,181,293],[1213,775,166,284]],

    names:['hanging-lantern','stone-lamp','road-lamp','brazier','direction-sign','market-stall','village-well',

      'bench','barrels','cargo-crates','fountain','notice-board','royal-banner','beacon'] },

  { key:'royal_walls',path:'assets/sprites/walls.png',columns:5,atlasColumns:5,density:2,frameWidth:320,frameHeight:320,blackBackground:false,
    sourceSize:[1448,1086],regions:[[26,384,132,183],[794,379,137,184],[320,595,329,205],[787,593,127,199],[1045,601,375,191]],
    groundPoints:[[93,510.5],[862,511.5],[482.5,756],[850,785],[1234,770]],
    names:['rising-curtain','falling-curtain','horizontal-curtain','corner-tower','south-facing-gate'] },
  { key:'walls',path:'assets/sprites/walls.png',columns:25,atlasColumns:5,density:2,frameWidth:320,frameHeight:320,blackBackground:false,

    sourceSize:[1448,1086],trimRegions:true,

    regions:[[52,140,100,211],[164,140,107,210],[282,68,146,281],[441,71,108,273],[560,95,146,254],

      [723,106,112,243],[847,188,107,163],[974,166,124,190],[1110,145,166,199],[1287,129,148,215],

      [26,384,132,183],[175,384,171,184],[359,386,259,187],[628,379,161,191],[794,379,137,184],

      [935,378,186,197],[1140,368,238,202],[18,595,272,209],[320,595,329,205],[787,593,127,199],

      [936,601,98,191],[1045,601,375,191],[748,821,362,210],[1114,827,146,193],[1267,819,153,210]],

    names:['broken-wall-pillar','wall-corner-low','wall-bastion','wall-tower-slim','wall-tower-square',

      'wall-pillar-short','wall-pillar-ivy','wall-battlement','wall-ruin-high','wall-ruin-low',

      'wall-corner-west','wall-corner-angle','wall-corner-turn','wall-crosswall','wall-corner-east',

      'wall-battlement-low','wall-straight-tower','wall-gate-keep','wall-straight-bastion','wall-watch-post',

      'wall-royal-arch','wall-great-gate','wall-ruined-arch','wall-broken-run','wall-ivy-arch'] },

  { key: 'world_assets', path: 'assets/sprites/world_assets.png', columns: 8, density: 4, frameWidth: 128, frameHeight: 128, blackBackground: false,

    sourceSize: [2172, 724], regions: [[14,127,368,436],[386,132,254,427],[644,335,334,228],[986,370,290,193],[1291,374,223,189],[1543,319,149,244],[1696,370,188,193],[1896,368,263,188]],

    names: ['broadleaf-tree','pine','boulder','fence','wheat','signpost','campfire','cargo'] },

  { key: 'terrain', path: 'assets/tiles/terrain.png', columns: 8, density: 1, frameWidth: 256, frameHeight: 256, sourceInset: 12, blackBackground: false,

    names: ['grass','dirt','stone','farmland','forest','sand','snow','water'] },

  ...SPRITE_BOARDS.map(board => ({ key:board.key as ArtTextureKey,path:board.path,columns:24,atlasColumns:6,density:2,

    frameWidth:board.frameWidth,frameHeight:board.frameHeight,blackBackground:false,sources:boardSources(board),names:poseNames })),

  ...NPC_IDLE_ART.map(entry => ({ key:entry.key,path:entry.path,columns:6,atlasColumns:6,density:2,

    frameWidth:96,frameHeight:entry.height,blackBackground:false,sources:npcIdleSources(entry),

    names:Array.from({ length:6 },(_,i) => `idle-${i}`) })),

  ...PLAYER_SKILL_ART.map(art => ({ key:art.texture,path:art.path,columns:6,atlasColumns:3,density:2,

    frameWidth:192,frameHeight:256,blackBackground:false,sources:skillArtSources(art),

    names:Array.from({ length:6 },(_,i) => `${art.id}-${i}`) })),

  ...PLAYER_EFFECTS.map(({ name,path }) => ({ key:`effect_${name}` as ArtTextureKey,path,columns:6,atlasColumns:3,density:2,

    frameWidth:128,frameHeight:128,blackBackground:false,sourceSize:[1536,1024] as const,

    regions:Array.from({ length:6 },(_,i):SpriteRegion => [(i % 3) * 512,Math.floor(i / 3) * 512,512,512]),

    names:Array.from({ length:6 },(_,i) => `${name}-${i}`) })),

];



export const ART_BY_KEY = Object.fromEntries(ART_SHEETS.map(sheet => [sheet.key, sheet])) as Record<ArtTextureKey, ArtSheet>;

export function artScale(key: ArtTextureKey) { return 1 / ART_BY_KEY[key].density; }

export function actorScaleForHeight(key: ArtTextureKey, frame: number, height: number) {

  return artScale(key) * height / Math.max(1, artFrameSize(key, frame).height);

}

// Keep feet and gameplay bodies at their old world coordinates even when the

// illustration above them gets larger. Origins are measured in logical units.

export function actorArtLayout(key: ArtTextureKey) {

  const sheet = ART_BY_KEY[key];

  return { originY: (sheet.frameHeight - 22) / sheet.frameHeight,

    bodyX: sheet.frameWidth / 2 - 9, bodyY: sheet.frameHeight - 24,

    labelY: -(sheet.frameHeight - 22) - 12 };

}

export function artFrameSize(key: ArtTextureKey, frame: number) {
  // Gameplay calculations must agree with the standardized render height.
  if (key === 'leigneron') return { width: frame >= 6 && frame < 18 ? 69 : 59, height: HERO_VISIBLE_HEIGHT };
  if (key === 'leigneron_idle') return { width: 59, height: HERO_VISIBLE_HEIGHT };

  const sheet = ART_BY_KEY[key], region = sheet.regions?.[frame];

  const source = sheet.sources?.[frame];

  if (source?.renderScale) return { width:source.cell[2] * source.renderScale,height:source.cell[3] * source.renderScale };

  if (sheet.contentSize) {

    const [width,height] = sheet.contentSize, fit = Math.min((sheet.frameWidth - 4) / width,(sheet.frameHeight - 4) / height);

    return { width:width * fit,height:height * fit };

  }

  const fit = sheet.regions ? Math.min((sheet.frameWidth - 4) / Math.max(...sheet.regions.map(r => r[2])),

    (sheet.frameHeight - 4) / Math.max(...sheet.regions.map(r => r[3]))) : 1;

  return { width: region ? region[2] * fit : sheet.frameWidth, height: region ? region[3] * fit : sheet.frameHeight };

}

export function worldPropFootprint(frame: number, scale: number) {

  const size = artFrameSize('world_objects', frame);

  return { width: size.width * scale * .72, height: Math.min(56, size.height * scale * .25) };

}



/** Centered crossings anchor their actual deck, never empty atlas padding. */

export function worldPropOrigin(key:ArtTextureKey,frame:number,anchor:'center'|'bottom') {

  if(anchor==='bottom') return {x:.5,y:1};

  const sheet=ART_BY_KEY[key],point=sheet.groundPoints?.[frame],region=sheet.regions?.[frame];

  const size=artFrameSize(key,frame);

  if(point&&region){const fit=size.width/region[2];return {

    x:(sheet.frameWidth/2+(point[0]-region[0]-region[2]/2)*fit)/sheet.frameWidth,

    y:(sheet.frameHeight-2-(region[1]+region[3]-point[1])*fit)/sheet.frameHeight,

  };}

  return {x:.5,y:(sheet.frameHeight-2-size.height/2)/sheet.frameHeight};

}



export const WORLD_ASSET_FRAMES = { tree: 0, pine: 1, rock: 2, fence: 3, wheat: 4, sign: 5, fire: 6, cargo: 7 } as const;



export const PLAYER_ANIMATIONS = [...DIRECTION_CLIPS.map((state,direction) => ({ key:`leigneron-${state.slice(5)}`,texture:'leigneron',

  frames:Array.from({ length:HERO_PACK.animations[state].frames },(_,i) => direction * 6 + i),

  frameRate:HERO_PACK.animations[state].frameRate,repeat:HERO_PACK.animations[state].repeat })),PLAYER_IDLE_ANIMATION];



// Board frames use the same direction/stride layout as the manifest packs.

// Every named NPC with a 24-pose sheet can actually walk when its routine moves.

export const NPC_ANIMATIONS = ART_SHEETS.filter(sheet => sheet.key.startsWith('npc_') && sheet.columns === 24)

  .flatMap(sheet => DIRECTION_CLIPS.map((clip,direction) => ({

    key:`${sheet.key}-${clip.slice(5)}`,texture:sheet.key,

    frames:Array.from({ length:6 },(_,i) => direction * 6 + i),

    frameRate:sheet.key === 'npc_guard' ? GUARD_PACK.animations[clip].frameRate

      : sheet.key === 'npc_woman' ? SHRINE_PACK.animations[clip].frameRate : 9,

    repeat:-1,

  }))).concat(NPC_IDLE_ART.map(entry => ({ key:`${entry.walk}-idle`,texture:entry.key,

    frames:Array.from({ length:6 },(_,i) => i),frameRate:2.5,repeat:-1 })));
