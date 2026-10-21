import {ACTOR_DIRECTIONS,enemyLocomotionKey} from './directionalEnemyArt';
import type {SpriteAnimation} from './animationPacks';
export const GRAND_MAGUS_SPELL_TEXTURE='grand-magus-spells';

export type M14Texture='enemy_goblin_slinger'|'enemy_thornling'|'enemy_grove_spider'|'enemy_krag_chieftain'|'enemy_frost_wyrm'|'enemy_rootfather'|'enemy_ashen_seer'|'enemy_grand_magus';
export interface M14ArtSpec {
  id:string;species:number;texture:M14Texture;region:'trandum'|'narenthil'|'rindass'|'frostlands'|'druganwoods'|'darkav';boss?:boolean;glide?:boolean;
  folder:string;height:number;frameWidth:number;frameHeight:number;
  windup:number;recovery:number;hold:number;auxiliaryTextures?:readonly string[];
}
export const M14_ART:readonly M14ArtSpec[]=[
  {id:'grand-magus',species:19,texture:'enemy_grand_magus',region:'trandum',boss:true,glide:true,folder:'grand_magus',height:112,frameWidth:224,frameHeight:224,windup:1200,recovery:800,hold:2,auxiliaryTextures:[GRAND_MAGUS_SPELL_TEXTURE]},
  {id:'goblin-stone-slinger',species:12,texture:'enemy_goblin_slinger',region:'trandum',folder:'goblin_stone_slinger',height:64,frameWidth:128,frameHeight:112,windup:600,recovery:400,hold:3},
  {id:'blighted-thornling',species:13,texture:'enemy_thornling',region:'narenthil',folder:'blighted_thornling',height:82,frameWidth:144,frameHeight:144,windup:480,recovery:320,hold:3},
  {id:'grove-spider',species:14,texture:'enemy_grove_spider',region:'narenthil',folder:'grove_spider',height:70,frameWidth:160,frameHeight:128,windup:300,recovery:450,hold:2},
  {id:'redmesa-chieftain',species:15,texture:'enemy_krag_chieftain',region:'rindass',boss:true,folder:'krag_chieftain',height:108,frameWidth:192,frameHeight:192,windup:640,recovery:1050,hold:2},
  {id:'frost-wyrm',species:16,texture:'enemy_frost_wyrm',region:'frostlands',boss:true,folder:'frost_wyrm',height:100,frameWidth:256,frameHeight:192,windup:720,recovery:1150,hold:2},
  {id:'rootfather',species:17,texture:'enemy_rootfather',region:'druganwoods',boss:true,folder:'rootfather',height:126,frameWidth:224,frameHeight:224,windup:880,recovery:1300,hold:2},
  {id:'ashen-seer',species:18,texture:'enemy_ashen_seer',region:'darkav',boss:true,glide:true,folder:'ashen_seer',height:108,frameWidth:224,frameHeight:192,windup:980,recovery:1400,hold:2},
];
/** Separate authored preparation/contact poses follow the combat controller's
 * warning and recovery durations, not the sum of both phases. */
export function m14BossAttackPhase(species:number,direction:typeof ACTOR_DIRECTIONS[number],phase:'windup'|'recovery'):SpriteAnimation|undefined{
 const spec=M14_ART.find(s=>s.species===species&&s.boss&&s.species!==19);if(!spec)return;
 const action=20+ACTOR_DIRECTIONS.indexOf(direction)*6;
 return {key:`enemy:${species}:boss-${phase}:${direction}`,texture:spec.texture,
  frames:phase==='windup'?[action]:[action+1,action+2],frameRate:10,repeat:0,
  frameDurations:phase==='windup'?[300]:[110,190]};
}
export function m14Animations(spec:M14ArtSpec):SpriteAnimation[]{
  const animations=ACTOR_DIRECTIONS.flatMap((direction,row):SpriteAnimation[]=>{
    const walk=row*5,action=20+row*6;
    const attack=[...Array<number>(spec.hold).fill(action),action+1,...Array<number>(4-spec.hold).fill(action+2)];
    return [
      {key:enemyLocomotionKey(spec.species,'idle',direction),texture:spec.texture,frames:[spec.boss?action+2:walk],frameRate:1,repeat:-1},
      {key:enemyLocomotionKey(spec.species,'walk',direction),texture:spec.texture,frames:[1,2,3,4].map(i=>walk+i),frameRate:spec.glide?6:8,repeat:-1},
      {key:`enemy:${spec.species}:attack:${direction}`,texture:spec.texture,frames:attack,frameRate:5000/(spec.windup+spec.recovery),repeat:0,
        ...(spec.boss?{frameDurations:attack.map((_,i)=>i<spec.hold?spec.windup/spec.hold:spec.recovery/(5-spec.hold))}:{})},
      {key:`enemy:${spec.species}:hurt:${direction}`,texture:spec.texture,frames:[action+3],frameRate:6,repeat:0},
      {key:`enemy:${spec.species}:death:${direction}`,texture:spec.texture,frames:spec.species===19?[52,53,54,55,56,57]:[action+4,action+5],frameRate:6,repeat:0},
    ];
  });
  for(const state of ['idle','walk','attack','hurt','death']){
    const clip=animations.find(a=>a.key===`enemy:${spec.species}:${state}:down`)!;
    animations.push({...clip,key:`enemy:${spec.species}:${state}`});
  }
  if(spec.species===19)animations.push({key:'grand-magus:bats',texture:spec.texture,frames:[58,59,60,61],frameRate:12,repeat:-1});
  for(const direction of ACTOR_DIRECTIONS)for(const phase of ['windup','recovery'] as const){
    const clip=m14BossAttackPhase(spec.species,direction,phase);if(clip)animations.push(clip);
  }
  return animations;
}
export const M14_ANIMATIONS=M14_ART.flatMap(m14Animations);
