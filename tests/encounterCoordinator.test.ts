import { describe, expect, it } from 'vitest';
import { EncounterCoordinator } from '../src/game/systems/EncounterCoordinator';
import type { EncounterBehavior } from '../src/game/types';

const behavior:EncounterBehavior={home:{x:0,y:0},station:{x:0,y:0},leashRadius:900,role:'leader',slot:0};
describe('bounded encounter coordination',()=>{
  it('shares alerts only inside the same group and the existing 510-unit response distance',()=>{
    const c=new EncounterCoordinator();c.register('wolves','alpha');c.register('wolves','sibling');c.register('other','stranger');
    expect(c.decide('wolves','alpha',behavior,{x:0,y:0},{x:100,y:0},10,true,true)).toBe('pursue');
    expect(c.decide('wolves','sibling',behavior,{x:-200,y:0},{x:100,y:0},11,false,true)).toBe('pursue');
    expect(c.decide('other','stranger',behavior,{x:-200,y:0},{x:100,y:0},11,false,true)).toBe('idle');
    expect(c.decide('wolves','sibling',behavior,{x:-300,y:0},{x:300,y:0},12,false,true)).toBe('idle');
  });
  it('returns the whole alerted group when the player crosses the leash, without immediately re-engaging',()=>{
    const c=new EncounterCoordinator();c.register('g','a');c.register('g','b');
    c.decide('g','a',behavior,{x:100,y:0},{x:150,y:0},0,true,true);
    expect(c.decide('g','a',behavior,{x:100,y:0},{x:1000,y:0},1,false,true)).toBe('return');
    expect(c.decide('g','b',behavior,{x:100,y:0},{x:150,y:0},2,true,true)).toBe('return');
    expect(c.decide('g','b',behavior,{x:10,y:0},{x:150,y:0},3,true,true)).toBe('pursue');
  });
  it('respects settlement protection and expires old alerts rather than retaining combat forever',()=>{
    const c=new EncounterCoordinator();c.register('g','a');
    c.decide('g','a',behavior,{x:100,y:0},{x:150,y:0},0,true,true);
    expect(c.decide('g','a',behavior,{x:100,y:0},{x:150,y:0},1,true,false)).toBe('return');
    c.arrived('a');c.decide('g','a',behavior,{x:100,y:0},{x:150,y:0},2,true,true);
    expect(c.decide('g','a',behavior,{x:100,y:0},{x:700,y:0},6000,false,true)).toBe('return');
  });
  it('cleans alerts and retreat state when the last live member unloads or dies',()=>{
    const c=new EncounterCoordinator();c.register('g','a');
    c.decide('g','a',behavior,{x:0,y:0},{x:100,y:0},0,true,true);c.forget('g','a');c.register('g','a');
    expect(c.decide('g','a',behavior,{x:0,y:0},{x:100,y:0},1,false,true)).toBe('idle');
    expect(c.decide('g','a',behavior,{x:901,y:0},{x:100,y:0},2,true,true)).toBe('return');
  });
});
