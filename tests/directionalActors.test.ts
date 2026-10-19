import {describe,it,expect} from 'vitest';
import {NPCS} from '../src/data/npcs';
import {ENEMIES} from '../src/data/enemies';
import {ART_BY_KEY,NPC_ANIMATIONS} from '../src/data/art';
import {NPC_IDLE_ART} from '../src/data/npcIdleArt';
import {GUARD_MARCH_ART,GUARD_MARCH_FRAME_GUTTER,guardMarchFrameOrigin} from '../src/data/guardMarchArt';
import {DIRECTIONAL_ENEMY_ART,ACTOR_DIRECTIONS,actorTravelDirection,enemyLocomotionKey} from '../src/data/directionalEnemyArt';
import {actorSpriteGridSubjects,actorSpriteSubjects} from '../src/game/systems/spriteComponents';
import {PIRATE_SPECIES,PIRATE_TEXTURE,PIRATE_PATH,PIRATE_SIDE_PATH,PIRATE_GAIT_PATH} from '../src/data/pirateArt';
import {SALT_KING_SIDE_PATH,SALT_KING_GAIT_PATH} from '../src/data/saltKingArt';
import {BOATSWAIN_SPECIES,BOATSWAIN_TEXTURE,BOATSWAIN_ANIMATIONS} from '../src/data/boatswainArt';
import {GOBLIN_SPECIES,GOBLIN_TEXTURE,GOBLIN_ANIMATIONS} from '../src/data/goblinArt';
import {M14_ART,M14_ANIMATIONS} from '../src/data/m14Art';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
describe('complete actor walking coverage',()=>{
 it('gives every authored NPC its registered walk art or complete idle presentation',()=>{
  const families=new Map<string,number>();
  for(const npc of NPCS){
   const texture=npc.spriteTexture??'npcs',family=texture==='npc_royal_guard'?'npc_guard':texture;
   families.set(texture,(families.get(texture)??0)+1);
   const sheet=ART_BY_KEY[family];
   if(sheet?.columns!==24){
    const idle=NPC_IDLE_ART.find(entry=>entry.key===texture||entry.walk===family);
    expect(idle,npc.id).toBeDefined();
    expect(NPC_ANIMATIONS.some(clip=>clip.key===idle!.walk+'-idle'),npc.id).toBe(true);
    if(idle!.walk==='npc_elven_guard'||idle!.walk==='npc_guard')
     expect(GUARD_MARCH_ART.some(art=>art.walk===idle!.walk),npc.id).toBe(true);
    continue;
   }
   for(const direction of ACTOR_DIRECTIONS){
    const clip=NPC_ANIMATIONS.find(a=>a.key===texture+'-'+direction);
    expect(clip,npc.id+'/'+direction).toBeDefined();expect(new Set(clip!.frames).size).toBe(6);
    for(const frame of clip!.frames)expect(sheet.sources?.[frame]?.cell,npc.id).toBeDefined();
   }
  }
  console.log('NPC walking audit',NPCS.length,Object.fromEntries(families));
 });
 it('keeps neighboring grid poses separate when alpha touches frame edges',()=>{
  const width=12,height=8,pixels=new Uint8ClampedArray(width*height*4);
  for(const [x,y] of [[5,3],[11,3],[5,7],[11,7]])pixels[(y*width+x)*4+3]=255;
  const subjects=actorSpriteGridSubjects(pixels,width,height,2,2);
  expect(subjects).toHaveLength(4);
  expect(subjects.map(subject=>subject.region)).toEqual([[3,1,3,3],[9,1,3,3],[3,5,3,3],[9,5,3,3]]);
 });
 it('recovers a full directional sheet when adjacent character silhouettes touch',()=>{
  const width=64,height=48,pixels=new Uint8ClampedArray(width*height*4);
  const paint=(left:number,top:number,right:number,bottom:number)=>{
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)pixels[(y*width+x)*4+3]=255;
  };
  // Four 14x14 actors, with the two top-row actors connected by one sword.
  // The old global connected-component check counted three actors and aborted.
  for(const y of [4,28])for(const x of [8,40])paint(x,y,x+14,y+14);
  paint(21,10,41,12);
  const subjects=actorSpriteSubjects(pixels,width,height,2,2,'connected-test.png');
  expect(subjects).toHaveLength(4);
  for(let i=0;i<4;i++){
   const [x,y,w,h]=subjects[i].region;
   expect(x).toBeGreaterThanOrEqual(i%2*32);
   expect(y).toBeGreaterThanOrEqual(Math.floor(i/2)*24);
   expect(w).toBeGreaterThan(10);
   expect(h).toBeGreaterThan(10);
  }
 });
 it('reports the artwork filename and pose when a directional frame really is empty',()=>{
  const width=64,height=48,pixels=new Uint8ClampedArray(width*height*4);
  for(const [x,y] of [[8,4],[40,4],[8,28]])
   for(let dy=0;dy<14;dy++)for(let dx=0;dx<14;dx++)
    pixels[((y+dy)*width+x+dx)*4+3]=255;
  expect(()=>actorSpriteSubjects(pixels,width,height,2,2,'missing-pose.png'))
   .toThrow(/missing-pose\.png/);
 });
 it('recovers grid poses on sheets whose source width is not divisible by columns',()=>{
  const width=65,height=49,pixels=new Uint8ClampedArray(width*height*4);
  for(const y of [5,30])for(const x of [9,42])
   for(let dy=0;dy<14;dy++)for(let dx=0;dx<14;dx++)
    pixels[((y+dy)*width+x+dx)*4+3]=255;
  for(let x=22;x<43;x++)pixels[(11*width+x)*4+3]=255;
  const subjects=actorSpriteSubjects(pixels,width,height,2,2,'odd-width.png');
  expect(subjects).toHaveLength(4);
 });
 it('drops disconnected debris above a grid-isolated guard pose',()=>{
  const width=32,height=32,pixels=new Uint8ClampedArray(width*height*4);
  for(let y=14;y<25;y++)for(let x=10;x<21;x++)pixels[(y*width+x)*4+3]=255;
  for(let y=0;y<2;y++)for(let x=13;x<20;x++)pixels[(y*width+x)*4+3]=255;
  const subject=actorSpriteGridSubjects(pixels,width,height,1,1)[0];
  expect(subject.region).toEqual([8,12,15,15]);
  expect(subject.pixels.some((_,index)=>index%4===3&&subject.pixels[index]>0)).toBe(true);
  for(let y=0;y<subject.region[3];y++)for(let x=0;x<subject.region[2];x++)
   if(y<2)expect(subject.pixels[(y*subject.region[2]+x)*4+3]).toBe(0);
 });
 it('adds a transparent GPU-filtering gutter between elven guard walking frames',()=>{
  const frameWidth=256,frameHeight=288;
  const first=guardMarchFrameOrigin(0,frameWidth,frameHeight),next=guardMarchFrameOrigin(1,frameWidth,frameHeight);
  const below=guardMarchFrameOrigin(6,frameWidth,frameHeight);
  expect(first).toEqual({x:GUARD_MARCH_FRAME_GUTTER,y:GUARD_MARCH_FRAME_GUTTER});
  expect(next.x-first.x-frameWidth).toBe(GUARD_MARCH_FRAME_GUTTER*2);
  expect(below.y-first.y-frameHeight).toBe(GUARD_MARCH_FRAME_GUTTER*2);
 });
 it('covers every enemy and boss variant with a registered directional species',()=>{
  // Dedicated and on-demand atlases are registered outside the legacy loader.
  const families=[...DIRECTIONAL_ENEMY_ART,{species:PIRATE_SPECIES,texture:PIRATE_TEXTURE},
   {species:BOATSWAIN_SPECIES,texture:BOATSWAIN_TEXTURE},
   {species:GOBLIN_SPECIES,texture:GOBLIN_TEXTURE},...M14_ART];
  const dedicatedClips=[...BOATSWAIN_ANIMATIONS,...GOBLIN_ANIMATIONS,...M14_ANIMATIONS];
  expect(ART_BY_KEY[PIRATE_TEXTURE].columns).toBe(49);
  expect(ART_BY_KEY.enemy_walk_salt_king.columns).toBe(27);
  for(const path of [PIRATE_PATH,PIRATE_SIDE_PATH,PIRATE_GAIT_PATH,SALT_KING_SIDE_PATH,SALT_KING_GAIT_PATH])
   expect(existsSync(resolve('public',path)),path).toBe(true);
  for(const enemy of ENEMIES){
   const family=families.find(a=>a.species===enemy.spriteFrame);
   expect(family,enemy.id).toBeDefined();expect(family!.texture).toBe(enemy.spriteTexture??'enemies');
   expect(new Set(ACTOR_DIRECTIONS.map(d=>enemyLocomotionKey(enemy.spriteFrame,'walk',d))).size).toBe(4);
   if(enemy.spriteFrame>=BOATSWAIN_SPECIES)for(const direction of ACTOR_DIRECTIONS){
    for(const state of ['idle','walk','attack','hurt','death'] as const){
     const key=`enemy:${enemy.spriteFrame}:${state}:${direction}`;
     const clip=dedicatedClips.find(a=>a.key===key);
     expect(clip,enemy.id+'/'+key).toBeDefined();
     expect(clip!.texture).toBe(enemy.spriteTexture);
     expect(clip!.frames.length).toBeGreaterThan(0);
     expect(clip!.frames.every(frame=>Number.isInteger(frame)&&frame>=0&&frame<ART_BY_KEY[enemy.spriteTexture??'enemies'].columns)).toBe(true);
    }
   }
  }
  console.log('Enemy walking audit',ENEMIES.length,'definitions',families.length,'sprite families');
 });
 it('uses real velocity, keeps facing when stopped and avoids diagonal flicker',()=>{
  expect(actorTravelDirection(80,0,'down')).toBe('right');
  expect(actorTravelDirection(-80,0,'right')).toBe('left');
  expect(actorTravelDirection(0,-80,'left')).toBe('up');
  expect(actorTravelDirection(0,80,'up')).toBe('down');
  expect(actorTravelDirection(.2,.3,'left')).toBe('left');
  expect(actorTravelDirection(80,80,'right')).toBe('right');
  expect(actorTravelDirection(80,80,'down')).toBe('down');
  expect(actorTravelDirection(50,80,'right')).toBe('down');
 });
});
