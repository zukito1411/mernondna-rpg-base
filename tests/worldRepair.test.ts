import { describe,it,expect } from 'vitest';
import { SETTLEMENT_LAYOUTS,buildingBounds } from '../src/data/settlements';
import { TOWN_BY_ID } from '../src/data/towns';
import { WORLD_CONTENT } from '../src/data/content';
import { NPCS } from '../src/data/npcs';
import { TOWN_SHRINES } from '../src/data/townShrines';
import { rectTouchesStreet,overlaps,spriteBounds,retiredBoundaryId } from '../src/data/settlementGeometry';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { ContentChunkManager } from '../src/game/systems/ContentChunkManager';
import { initialContentState } from '../src/data/content';
import { nightStrength,environmentLightPoints } from '../src/data/environmentLights';
import { ART_BY_KEY,artFrameSize,worldPropOrigin } from '../src/data/art';

describe('world visual repair',()=>{
  const world=new WorldGenerator();
  it('authors every settlement and keeps whole buildings off all roads',()=>{
    expect(SETTLEMENT_LAYOUTS).toHaveLength(11);
    for(const layout of SETTLEMENT_LAYOUTS) {
      expect(layout.authored,layout.townId).toBe(true);
      for(const [i,lot] of layout.buildings.entries()) {
        const rect=buildingBounds(lot);
        for(const road of layout.streets) expect(rectTouchesStreet(rect,road),layout.townId+'/'+i+'/'+road.id).toBe(false);
        for(const other of layout.buildings.slice(i+1)) expect(overlaps(rect,buildingBounds(other)),layout.townId+'/'+i+' overlaps '+other.label).toBe(false);
      }
    }
  });
  it('retains every named resident, shrine arrival and bridge on walkable ground',()=>{
    for(const npc of NPCS){const town=TOWN_BY_ID[npc.townId];expect(world.isWalkable(town.world.x+npc.worldOffset.x,town.world.y+npc.worldOffset.y),npc.id).toBe(true);}
    for(const shrine of TOWN_SHRINES) expect(world.isWalkable(shrine.arrival.x,shrine.arrival.y),shrine.townId).toBe(true);
    for(const bridge of WORLD_CONTENT.filter(d=>d.id.startsWith('bridge:'))) expect(world.isWalkable(bridge.world.x,bridge.world.y),bridge.id).toBe(true);
    expect(WORLD_CONTENT.some(d=>retiredBoundaryId(d.id))).toBe(false);
  });
  it('places full tree canopies clear of streets and buildings',()=>{
    for(const layout of SETTLEMENT_LAYOUTS) for(const tree of layout.plantings) {
      const rect=spriteBounds('world_assets',tree.frame,tree.scale,tree.x,tree.y);
      for(const road of layout.streets) expect(rectTouchesStreet(rect,road),layout.townId+'/'+tree.id+'/'+road.id).toBe(false);
      for(const lot of layout.buildings) expect(overlaps(rect,buildingBounds(lot)),layout.townId+'/'+tree.id+' covers '+lot.label).toBe(false);
    }
  });
  it('does not restore old static placements or retired colliders when streamed again',()=>{
    const d=WORLD_CONTENT.find(d=>d.kind==='settlement-prop')!;
    const persisted={states:{[d.id]:{x:d.world.x+900,y:d.world.y+900,used:true},'settlement:wall:oakmere:north:1':{x:100,y:100}},spawns:{},nextSpawnSequence:0};
    const manager=new ContentChunkManager(WORLD_CONTENT,persisted,{initialState:initialContentState,
      create:(_d,state)=>({...state}),position:a=>a,capture:(_d,a)=>a,destroy:()=>{}});
    manager.update(d.world.x,d.world.y);expect(manager.getState(d.id)).toMatchObject({...d.world,used:true});
    manager.update(0,0);manager.update(d.world.x,d.world.y);
    expect(manager.getActor(d.id)).toMatchObject(d.world);
    expect(manager.snapshot().states['settlement:wall:oakmere:north:1']).toBeUndefined();
  });
  it('uses full measured architecture and lamp bounds with day/night-only emission',()=>{
    expect(world.getTerrainIndex('ash')).not.toBe(world.getTerrainIndex('stone'));
    expect(ART_BY_KEY.capital_buildings.regions![2]).toEqual([772,14,189,401]);
    expect(ART_BY_KEY.others.regions![1]).toEqual([338,59,194,354]);
    expect(environmentLightPoints('others',1)).toHaveLength(1);
    expect(environmentLightPoints('leigneron',0)).toEqual([]);
    expect(nightStrength(12*60)).toBe(0);expect(nightStrength(22*60)).toBe(1);expect(nightStrength(19*60)).toBe(.5);
  });
  it('aligns the painted bridge deck to the crossing rather than atlas padding',()=>{
    const sheet=ART_BY_KEY.bridges,region=sheet.regions![2],origin=worldPropOrigin('bridges',2,'center');
    const fit=artFrameSize('bridges',2).width/region[2];
    const deckY=sheet.frameHeight-2-(region[1]+region[3]-sheet.groundPoints![2][1])*fit;
    expect(deckY-origin.y*sheet.frameHeight).toBeCloseTo(0);
    expect(origin.y).not.toBe(.5);
  });
});
