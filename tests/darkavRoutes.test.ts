import { describe, expect, it } from 'vitest';
import { BLACKSPIRE_LAIR_ROADS, DRAGON_LAIR, DRAGON_LAIR_TRAIL } from '../src/data/dragonLair';
import { TOWN_BY_ID } from '../src/data/towns';
import type { Vec2 } from '../src/game/types';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';

function expectContinuousWalkableRoad(world:WorldGenerator,points:Vec2[],label:string){
  for(let segment=1;segment<points.length;segment++){
    const a=points[segment-1],b=points[segment],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/80);
    for(let step=0;step<=steps;step++){
      const x=a.x+(b.x-a.x)*step/steps,y=a.y+(b.y-a.y)*step/steps;
      expect(world.isRoad(x,y),`${label} road missing at ${x},${y}`).toBe(true);
      expect(world.isWalkable(x,y),`${label} blocked at ${x},${y}`).toBe(true);
    }
  }
}

describe('Blackspire access roads',()=>{
  it('connects both settlement gates to the continuous road toward the dragon lair',()=>{
    const world=new WorldGenerator(),town=TOWN_BY_ID.blackspire.world;
    const southGate={x:town.x,y:town.y+1610},northGate={x:town.x,y:town.y-1610};
    expectContinuousWalkableRoad(world,[{x:town.x,y:town.y+1250},southGate,BLACKSPIRE_LAIR_ROADS[0][1],
      ...DRAGON_LAIR_TRAIL.slice(1)],'south gate to dragon lair');
    expectContinuousWalkableRoad(world,[{x:town.x,y:town.y-1300},...BLACKSPIRE_LAIR_ROADS[1],
      {x:town.x+5200,y:town.y-4500},DRAGON_LAIR],'north gate to dragon lair');
    expect(BLACKSPIRE_LAIR_ROADS[1][0]).toEqual(northGate);
  });
});
