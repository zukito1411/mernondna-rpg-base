import {describe,it,expect} from 'vitest';
import {NPCS} from '../src/data/npcs';
import {ENEMIES} from '../src/data/enemies';
import {ART_BY_KEY,NPC_ANIMATIONS} from '../src/data/art';
import {DIRECTIONAL_ENEMY_ART,ACTOR_DIRECTIONS,actorTravelDirection,enemyLocomotionKey} from '../src/data/directionalEnemyArt';
describe('complete actor walking coverage',()=>{
 it('gives every authored NPC six walk poses in all four directions',()=>{
  const families=new Map<string,number>();
  for(const npc of NPCS){
   const texture=npc.spriteTexture??'npcs';families.set(texture,(families.get(texture)??0)+1);
   const sheet=ART_BY_KEY[texture];expect(sheet.columns,npc.id).toBe(24);
   for(const direction of ACTOR_DIRECTIONS){
    const clip=NPC_ANIMATIONS.find(a=>a.key===texture+'-'+direction);
    expect(clip,npc.id+'/'+direction).toBeDefined();expect(new Set(clip!.frames).size).toBe(6);
    for(const frame of clip!.frames)expect(sheet.sources?.[frame]?.cell,npc.id).toBeDefined();
   }
  }
  console.log('NPC walking audit',NPCS.length,Object.fromEntries(families));
 });
 it('covers every enemy and boss variant with a registered directional species',()=>{
  for(const enemy of ENEMIES){
   const family=DIRECTIONAL_ENEMY_ART.find(a=>a.species===enemy.spriteFrame);
   expect(family,enemy.id).toBeDefined();expect(family!.texture).toBe(enemy.spriteTexture??'enemies');
   expect(new Set(ACTOR_DIRECTIONS.map(d=>enemyLocomotionKey(enemy.spriteFrame,'walk',d))).size).toBe(4);
  }
  console.log('Enemy walking audit',ENEMIES.length,'definitions',DIRECTIONAL_ENEMY_ART.length,'sprite families');
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
