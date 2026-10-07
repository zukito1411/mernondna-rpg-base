import manifests from 'virtual:mernondna-art-packs';
const hero = manifests['characters/leigneron'], guard = manifests['npcs/trandum_guard'], priestess = manifests['npcs/shrine_priestess'];
const wolf = manifests['enemies/gray_wolf'], bandit = manifests['enemies/road_bandit'], boar = manifests['enemies/boarfiend'], wraith = manifests['enemies/marsh_wraith'];

export interface PackClip { png:string; webp:string; frames:number; frameRate:number; repeat:number }
export interface PackManifest { id:string; frameWidth:number; frameHeight:number; animations:Record<string,PackClip> }
export interface SpriteSource {
  path:string; cell:readonly [number,number,number,number]; imageSize:readonly [number,number]; name:string;
  renderScale?:number;
}
export interface SpriteAnimation { key:string; texture:string; frames:number[]; frameRate:number; repeat:number }
export const SPRITE_PACKS:readonly PackManifest[] = [hero,guard,priestess,wolf,bandit,boar,wraith];
export const DIRECTION_CLIPS = ['walk_down','walk_left','walk_right','walk_up'] as const;
export const ENEMY_STATES = ['idle','walk','attack','hurt','death'] as const;
export type EnemyAnimationState = typeof ENEMY_STATES[number];
export const ENEMY_PACKS:readonly PackManifest[] = [wolf,bandit,boar,wraith];
export const HERO_PACK:PackManifest = hero;
export const GUARD_PACK:PackManifest = guard;
export const SHRINE_PACK:PackManifest = priestess;

export function clipSources(pack:PackManifest, state:string):SpriteSource[] {
  const clip = pack.animations[state];
  if (!clip) throw new Error(`Missing ${pack.id}/${state} animation`);
  return Array.from({ length:clip.frames },(_,i) => ({ path:clip.png,
    cell:[i * pack.frameWidth,0,pack.frameWidth,pack.frameHeight],imageSize:[pack.frameWidth * clip.frames,pack.frameHeight],
    name:`${pack.id}:${state}:${i}` }));
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
export const ENEMY_SOURCES:SpriteSource[] = ENEMY_PACKS.map(pack => enemySource(pack,'idle',0));
export const ENEMY_ANIMATIONS:SpriteAnimation[] = [];
for (const [species,pack] of ENEMY_PACKS.entries()) for (const state of ENEMY_STATES) {
  const frames = clipSources(pack,state).map((_,i) => {
    if (state === 'idle' && i === 0) return species;
    ENEMY_SOURCES.push(enemySource(pack,state,i)); return ENEMY_SOURCES.length - 1;
  });
  const clip = pack.animations[state];
  ENEMY_ANIMATIONS.push({ key:`enemy:${species}:${state}`,texture:'enemies',frames,frameRate:clip.frameRate,repeat:clip.repeat });
}
export function enemyAnimation(species:number, state:EnemyAnimationState) {
  const animation = ENEMY_ANIMATIONS.find(a => a.key === `enemy:${species}:${state}`);
  if (!animation) throw new Error(`No enemy animation for ${species}/${state}`);
  return animation;
}
export function animationDuration(animation:SpriteAnimation) { return animation.frames.length * 1000 / animation.frameRate; }
