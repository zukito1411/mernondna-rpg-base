import {describe,expect,it} from 'vitest';
import {TOWNS,TOWN_BY_ID} from '../src/data/towns';
import {TOWN_SHRINE_BY_ID} from '../src/data/townShrines';
import {WorldGenerator} from '../src/game/systems/WorldGenerator';
import {nearestRespawnTown,respawnArrivalCandidates} from '../src/game/systems/respawnLocation';

describe('region-local death and respawn destinations',()=>{
 const world=new WorldGenerator();

 it('chooses the nearest town within the death region, not Oakmere',()=>{
  for(const town of TOWNS){
   const death={x:town.world.x+75,y:town.world.y+50};
   expect(nearestRespawnTown(death,town.regionId).id).toBe(town.id);
  }
  const between={x:(TOWN_BY_ID.highmere.world.x+TOWN_BY_ID.willowcross.world.x)/2+10,
    y:TOWN_BY_ID.highmere.world.y};
  expect(nearestRespawnTown(between,'trandum').id).toBe('willowcross');
 });

 it('stays within the death region even if a different region has a closer town',()=>{
  const death={x:TOWN_BY_ID.redmesa.world.x,y:TOWN_BY_ID.redmesa.world.y};
  expect(nearestRespawnTown(death,'nardorous').id).toBe('starhold');
  expect(nearestRespawnTown(death,'rindass').id).toBe('redmesa');
 });

 it('falls back to nearest global town only for a region without any settlement',()=>{
  const death={...TOWN_BY_ID.tidewatch.world};
  expect(nearestRespawnTown(death,'dead-sea').id).toBe('tidewatch');
 });

 it('generates authored shrine arrivals and walkable alternatives in every region',()=>{
  for(const town of TOWNS){
   const candidates=respawnArrivalCandidates(town);
   expect(candidates[0]).toEqual(TOWN_SHRINE_BY_ID[town.id].arrival);
   expect(new Set(candidates.map(p=>p.x+':'+p.y)).size).toBeGreaterThan(100);
   expect(candidates.some(p=>world.getRegionAt(p.x,p.y)===town.regionId&&world.isWalkable(p.x,p.y)))
    .toBe(true);
  }
 });

 it('does not depend on the home town when choosing a destination',()=>{
  const sample=[TOWN_BY_ID.blackspire,TOWN_BY_ID.skallheim,TOWN_BY_ID.deepford];
  for(const town of sample)
   expect(nearestRespawnTown(town.world,town.regionId).id).not.toBe('oakmere');
 });
});
