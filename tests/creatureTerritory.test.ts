import { describe, it, expect, vi } from 'vitest';
import { SETTLEMENT_LAYOUTS, protectedSettlementAt, SETTLEMENT_ENEMY_BUFFER } from '../src/data/settlements';
import { TOWN_BY_ID } from '../src/data/towns';
import { WORLD_CONTENT } from '../src/data/content';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { repairCreaturePlacements, findCreaturePlacement } from '../src/game/systems/creaturePlacement';
import { EventDirector } from '../src/game/systems/EventDirector';
import type { ContentWorldState } from '../src/game/types';

describe('settlement enemy exclusion', () => {
  const world = new WorldGenerator(), home = TOWN_BY_ID.oakmere.world;
  it('protects every settlement, its fields and its safety buffer without blocking the player', () => {
    for (const layout of SETTLEMENT_LAYOUTS) {
      const town = TOWN_BY_ID[layout.townId];
      expect(world.canCreatureOccupy(town.world.x,town.world.y)).toBe(false);
      for (const parcel of layout.parcels) expect(world.canCreatureOccupy(town.world.x + parcel.x,town.world.y + parcel.y)).toBe(false);
      const right = town.world.x + layout.bounds.x + layout.bounds.width / 2;
      expect(protectedSettlementAt(right + SETTLEMENT_ENEMY_BUFFER,town.world.y)?.townId).toBe(town.id);
      expect(protectedSettlementAt(right + SETTLEMENT_ENEMY_BUFFER + 1,town.world.y)).toBeUndefined();
    }
    expect(world.isWalkable(home.x,home.y)).toBe(true);
    expect(world.canCreatureOccupy(home.x - 630,home.y + 500)).toBe(false);
    for (const value of [NaN,Infinity,-1]) expect(world.canCreatureOccupy(value,home.y)).toBe(false);
  });
  it('keeps all authored creatures and quest bosses in valid wilderness territory', () => {
    for (const d of WORLD_CONTENT) if (d.kind === 'creature') expect(world.canCreatureOccupy(d.world.x,d.world.y),d.id).toBe(true);
    const varr = WORLD_CONTENT.find(d => d.id === 'boss:captain-varr')!;
    expect(varr.world).toEqual({ x:home.x + 1400,y:home.y - 740 });
  });
  it('repairs old authored/event positions without resetting health, identity, deaths or rewards', () => {
    const inside = { x:home.x,y:home.y + 80 };
    const saved: ContentWorldState = { nextSpawnSequence:1,
      spawns:{ 'spawn:0':{ id:'spawn:0',kind:'creature',enemyId:'gray-wolf',eventSpawn:true,world:inside } },
      states:{ 'creature:oakmere-wolf-east':{ ...inside,hp:17 },'spawn:0':{ ...inside,hp:9 },
        'creature:oakmere-boar-north':{ ...inside,hp:0,defeated:true },
        'npc:aldren-vale':{ ...inside,trust:61 },'loot:oakmere-road-cache':{ ...inside,used:true } } };
    const repaired = repairCreaturePlacements(WORLD_CONTENT,saved,world);
    for (const [id,hp] of [['creature:oakmere-wolf-east',17],['spawn:0',9]] as const) {
      expect(repaired.states[id].hp).toBe(hp);
      expect(world.canCreatureOccupy(repaired.states[id].x,repaired.states[id].y)).toBe(true);
    }
    expect(repaired.states['creature:oakmere-boar-north']).toEqual(saved.states['creature:oakmere-boar-north']);
    expect(repaired.states['npc:aldren-vale']).toEqual(saved.states['npc:aldren-vale']);
    expect(repaired.states['loot:oakmere-road-cache']).toEqual(saved.states['loot:oakmere-road-cache']);
    expect(repaired.spawns).toBe(saved.spawns); expect(repaired.nextSpawnSequence).toBe(1);
    expect(saved.states['spawn:0']).toEqual({ ...inside,hp:9 });
    expect(repairCreaturePlacements(WORLD_CONTENT,repaired,world)).toEqual(repaired);
  });
  it('keeps an unplaceable logical record dormant rather than deleting or defeating it', () => {
    const inside = { x:home.x,y:home.y };
    expect(findCreaturePlacement(inside,{ canCreatureOccupy:()=>false })).toBeNull();
    const saved: ContentWorldState = { states:{ 'creature:oakmere-wolf-east':{ ...inside,hp:17 } },spawns:{},nextSpawnSequence:0 };
    expect(repairCreaturePlacements(WORLD_CONTENT,saved,{ canCreatureOccupy:()=>false }).states).toEqual(saved.states);
  });
  it('does not run random attack events or announce waves while the player is in a village', () => {
    const spawnEnemy = vi.fn(() => true), notify = vi.fn();
    const director = new EventDirector({ spawnEnemy,notify,countEnemies:()=>0,isEnemyTerritory:(x,y)=>world.canCreatureOccupy(x,y) });
    for (let i = 0; i < 50; i++) director.update(28000,'trandum',20,home.x,home.y + 80);
    expect(spawnEnemy).not.toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled();
    for (let i = 0; i < 50; i++) director.update(28000,'trandum',20,home.x + 1500,home.y + 650);
    expect(spawnEnemy).toHaveBeenCalled(); expect(notify).toHaveBeenCalled();
  });
  it('does not announce an event when all its spawn candidates were rejected', () => {
    const spawnEnemy = vi.fn(() => false), notify = vi.fn();
    const director = new EventDirector({ spawnEnemy,notify,countEnemies:()=>0,isEnemyTerritory:()=>true });
    for (let i = 0; i < 50; i++) director.update(28000,'trandum',20,home.x + 1500,home.y + 650);
    expect(spawnEnemy).toHaveBeenCalled(); expect(notify).not.toHaveBeenCalled();
  });
});
