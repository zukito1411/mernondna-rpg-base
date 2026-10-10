import manifests from 'virtual:mernondna-art-packs';
import {BANDIT_COMBAT_ART,BANDIT_COMBAT_TEXTURE} from './banditCombatArt';
const hero = manifests['characters/leigneron'], priestess = manifests['npcs/shrine_priestess'];
const wolf = manifests['enemies/gray_wolf'], bandit = manifests['enemies/road_bandit'], boar = manifests['enemies/boarfiend'], wraith = manifests['enemies/marsh_wraith'];
const troll=manifests['enemies/troll'],dragon=manifests['enemies/dragon'];

export interface PackClip {
  png:string; webp?:string; frames:number; frameRate:number; repeat:number;
  frameDurations?:readonly number[];
  frameWidth?:number; frameHeight?:number; renderScale?:number;
  imageSize?:readonly [number,number];
  regions?:readonly (readonly [number,number,number,number])[];
  frameRects?:readonly {x:number;y:number;width:number;height:number}[];
  groundAnchors?:readonly (readonly [number,number])[];
  groundY?:number;
}
export interface PackManifest { id:string; frameWidth:number; frameHeight:number; animations:Record<string,PackClip> }
export interface SpriteSource {
  path:string; cell:readonly [number,number,number,number]; imageSize:readonly [number,number]; name:string;
  renderScale?:number;
  anchor?:readonly [number,number];
  groundAnchor?:readonly [number,number];
}
export interface SpriteAnimation {
  key:string; texture:string; frames:number[]; frameRate:number; repeat:number;
  frameDurations?:readonly number[];
}
export const SPRITE_PACKS:readonly PackManifest[] = [hero,priestess,wolf,bandit,boar,wraith,troll,dragon];
export const DIRECTION_CLIPS = ['walk_down','walk_left','walk_right','walk_up'] as const;
export const ENEMY_STATES = ['idle','walk','attack','hurt','death'] as const;
export type EnemyAnimationState = typeof ENEMY_STATES[number];
export const ENEMY_PACKS:readonly PackManifest[] = [wolf,bandit,boar,wraith,troll,dragon];
const LEGACY_ENEMY_PACKS=ENEMY_PACKS.slice(0,4);
export const HERO_PACK:PackManifest = hero;
export const SHRINE_PACK:PackManifest = priestess;

export function clipSources(pack:PackManifest, state:string):SpriteSource[] {
  const clip = pack.animations[state];
  if (!clip) throw new Error(`Missing ${pack.id}/${state} animation`);
  const width = clip.frameWidth ?? pack.frameWidth, height = clip.frameHeight ?? pack.frameHeight;
  const rects=clip.frameRects;
  const imageSize:readonly [number,number]=clip.imageSize??(rects
    ? [Math.max(...rects.map(r=>r.x+r.width)),Math.max(...rects.map(r=>r.y+r.height))] : [width*clip.frames,height]);
  return Array.from({ length:clip.frames },(_,i):SpriteSource => ({ path:clip.png,
    cell:clip.regions?.[i] ?? (rects?.[i]?[rects[i].x,rects[i].y,rects[i].width,rects[i].height]:[i * width,0,width,height]),imageSize,
    name:`${pack.id}:${state}:${i}`,...(clip.renderScale ? { renderScale:clip.renderScale } : {}),
    ...(clip.groundAnchors?.[i] ? { groundAnchor:clip.groundAnchors[i] } : {}),
    ...(clip.groundY!==undefined&&clip.renderScale?{anchor:[i*width+width/2,clip.groundY-38/clip.renderScale] as const}:{}) }));
}
export function directionalSources(pack:PackManifest) { return DIRECTION_CLIPS.flatMap(state => clipSources(pack,state)); }
export function directionFrame(dx:number, dy:number) {
  return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 12 : 6 : dy < 0 ? 18 : 0;
}

// First four frames retain the existing species-frame IDs for saves/content.
// Remaining frames contain every pose exactly once, including the five-frame
// boar attack. A single bounded atlas preserves the current enemy adapter.
// The bandit artwork has a shorter human body than the wraith/boar source
// canvases. Size that species by its own 129px pose height so its person is
// comparable with Leigneron, while keeping one scale through all bandit poses.
const enemySource = (pack:PackManifest,state:string,index:number):SpriteSource => {
  const source = clipSources(pack,state)[index];
  return pack.id === 'enemies/road_bandit' ? { ...source,renderScale:76/129 } : source;
};
export const ENEMY_SOURCES:SpriteSource[] = LEGACY_ENEMY_PACKS.map(pack => enemySource(pack,'idle',0));
export const ENEMY_ANIMATIONS:SpriteAnimation[] = [];
for (const [species,pack] of LEGACY_ENEMY_PACKS.entries()) for (const state of ENEMY_STATES) {
  const frames = clipSources(pack,state).map((_,i) => {
    if (state === 'idle' && i === 0) return species;
    ENEMY_SOURCES.push(enemySource(pack,state,i)); return ENEMY_SOURCES.length - 1;
  });
  const clip = pack.animations[state];
  const banditState=species===1?BANDIT_COMBAT_ART.findIndex(art=>art.state===state):-1;
  ENEMY_ANIMATIONS.push({ key:`enemy:${species}:${state}`,texture:banditState>=0?BANDIT_COMBAT_TEXTURE:'enemies',
    frames:banditState>=0?frames.map((_,i)=>banditState*6+i):frames,frameRate:clip.frameRate,repeat:clip.repeat });
}
// Large silhouettes have their own atlases, not enlarged/clipped 96x80 cells.
// Register the torso/feet consistently instead of centering a reaching club
// or a fire plume as if it were the creature's body.
function largeEnemySources(pack:PackManifest,species:number,texture:string,fit:number,anchorX:number,anchorY:number){
  const sources:SpriteSource[]=[];
  for(const state of ENEMY_STATES){
    const clip=pack.animations[state],frames:number[]=[];
    for(const [i,source] of clipSources(pack,state).entries()){
      frames.push(sources.length);sources.push({...source,renderScale:fit,
        groundAnchor:[i*pack.frameWidth+anchorX,anchorY]});
    }
    ENEMY_ANIMATIONS.push({key:`enemy:${species}:${state}`,texture,frames,frameRate:clip.frameRate,repeat:clip.repeat});
  }
  return sources;
}
export const TROLL_SOURCES=largeEnemySources(troll,4,'enemy_troll',.8,82,136);
export const DRAGON_SOURCES=largeEnemySources(dragon,5,'enemy_dragon',1.3,100,146);
export const DRAGON_FLY_SOURCES=clipSources(dragon,'fly');
ENEMY_ANIMATIONS.push({key:'dragon-fly',texture:'enemy_dragon_fly',frames:[0,1,2,3,4,5],frameRate:dragon.animations.fly.frameRate,repeat:-1});
// The first and last source cells are intentionally empty. Only use the four
// real impact poses, preserving the original 768x128 strip dimensions.
export const TROLL_IMPACT_SOURCES:SpriteSource[]=Array.from({length:4},(_,i):SpriteSource=>({
  path:'assets/enemies/troll/club_impact.png',cell:[(i+1)*128,0,128,128],imageSize:[768,128],
  name:`troll:club-impact:${i}`,renderScale:1,groundAnchor:[(i+1)*128+64,86],
}));
ENEMY_ANIMATIONS.push({key:'effect-troll-impact',texture:'effect_troll_impact',frames:[0,1,2,3],frameRate:12,repeat:0});
export function enemyAnimation(species:number, state:EnemyAnimationState) {
  const animation = ENEMY_ANIMATIONS.find(a => a.key === `enemy:${species}:${state}`);
  if (!animation) throw new Error(`No enemy animation for ${species}/${state}`);
  return animation;
}
export function animationDuration(animation:SpriteAnimation) { return animation.frames.length * 1000 / animation.frameRate; }
