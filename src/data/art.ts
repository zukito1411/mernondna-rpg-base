import { HERO_PACK, GUARD_PACK, SHRINE_PACK, directionalSources, ENEMY_SOURCES, DIRECTION_CLIPS, type SpriteSource } from './animationPacks';
import { SPRITE_BOARDS, boardSources } from './spriteBoards';
export type ArtTextureKey = 'leigneron' | 'leigneron_attack' | 'npcs' | 'npc_guard' | 'npc_woman' | 'npc_huntress' | 'npc_villager' | 'npc_royal_guard' | 'npc_blacksmith' | 'npc_adventurer' | 'npc_attendant' | 'npc_general' | 'enemies' | 'world_objects' | 'world_buildings' | 'world_assets' | 'terrain';
export type SpriteRegion = readonly [x: number, y: number, width: number, height: number];
interface ArtSheet {
  key: ArtTextureKey; path: string; columns: number; frameWidth: number; frameHeight: number;
  blackBackground: boolean; sourceSize?: readonly [number, number]; regions?: readonly SpriteRegion[];
  density: number; atlasColumns?: number;
  sourceInset?: number;
  sources?:readonly SpriteSource[]; contentSize?:readonly [number,number];
  names: readonly string[];
}

// Logical sizes and texture density are independent of collision sizes. Keep
// source illustrations intact; measured regions also support irregular sheets.
const poseNames = ['front','left','right','back'].flatMap(direction =>
  Array.from({ length: 6 }, (_, i) => `${direction}-${i === 0 ? 'idle' : `step-${i}`}`));
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
  { key:'leigneron',path:HERO_PACK.animations.walk_down.png,columns:24,atlasColumns:6,density:4,frameWidth:64,frameHeight:80,blackBackground:false,
    sources:directionalSources(HERO_PACK),contentSize:[104,128],names:poseNames },
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
  { key: 'world_assets', path: 'assets/sprites/world_assets.png', columns: 8, density: 4, frameWidth: 128, frameHeight: 128, blackBackground: false,
    sourceSize: [2172, 724], regions: [[14,127,368,436],[386,132,254,427],[644,335,334,228],[986,370,290,193],[1291,374,223,189],[1543,319,149,244],[1696,411,188,152],[1896,368,263,188]],
    names: ['broadleaf-tree','pine','boulder','fence','wheat','signpost','campfire','cargo'] },
  { key: 'terrain', path: 'assets/tiles/terrain.png', columns: 8, density: 1, frameWidth: 256, frameHeight: 256, sourceInset: 12, blackBackground: false,
    names: ['grass','dirt','stone','farmland','forest','sand','snow','water'] },
  ...SPRITE_BOARDS.map(board => ({ key:board.key as ArtTextureKey,path:board.path,columns:24,atlasColumns:6,density:2,
    frameWidth:board.frameWidth,frameHeight:board.frameHeight,blackBackground:false,sources:boardSources(board),names:poseNames })),
];

export const ART_BY_KEY = Object.fromEntries(ART_SHEETS.map(sheet => [sheet.key, sheet])) as Record<ArtTextureKey, ArtSheet>;
export function artScale(key: ArtTextureKey) { return 1 / ART_BY_KEY[key].density; }
// Keep feet and gameplay bodies at their old world coordinates even when the
// illustration above them gets larger. Origins are measured in logical units.
export function actorArtLayout(key: ArtTextureKey) {
  const sheet = ART_BY_KEY[key];
  return { originY: (sheet.frameHeight - 22) / sheet.frameHeight,
    bodyX: sheet.frameWidth / 2 - 9, bodyY: sheet.frameHeight - 24,
    labelY: -(sheet.frameHeight - 22) - 12 };
}
export function artFrameSize(key: ArtTextureKey, frame: number) {
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

export const WORLD_ASSET_FRAMES = { tree: 0, pine: 1, rock: 2, fence: 3, wheat: 4, sign: 5, fire: 6, cargo: 7 } as const;

export const PLAYER_ANIMATIONS = DIRECTION_CLIPS.map((state,direction) => ({ key:`leigneron-${state.slice(5)}`,texture:'leigneron',
  frames:Array.from({ length:HERO_PACK.animations[state].frames },(_,i) => direction * 6 + i),
  frameRate:HERO_PACK.animations[state].frameRate,repeat:HERO_PACK.animations[state].repeat }));

// Board frames use the same direction/stride layout as the manifest packs.
// Every named NPC with a 24-pose sheet can actually walk when its routine moves.
export const NPC_ANIMATIONS = ART_SHEETS.filter(sheet => sheet.key.startsWith('npc_') && sheet.columns === 24)
  .flatMap(sheet => DIRECTION_CLIPS.map((clip,direction) => ({
    key:`${sheet.key}-${clip.slice(5)}`,texture:sheet.key,
    frames:Array.from({ length:6 },(_,i) => direction * 6 + i),
    frameRate:sheet.key === 'npc_guard' ? GUARD_PACK.animations[clip].frameRate
      : sheet.key === 'npc_woman' ? SHRINE_PACK.animations[clip].frameRate : 9,
    repeat:-1,
  })));
