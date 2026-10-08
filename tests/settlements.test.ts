import { describe, it, expect } from 'vitest';
import { SETTLEMENT_LAYOUTS, SETTLEMENT_BY_ID, onStreet, inParcel } from '../src/data/settlements';
import { WORLD_CONTENT, CONTENT_BY_ID } from '../src/data/content';
import { TOWN_BY_ID } from '../src/data/towns';
import { NPCS } from '../src/data/npcs';
import { artFrameSize, worldPropFootprint } from '../src/data/art';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { planWildernessTrees } from '../src/game/systems/sceneryPlan';
import { FARM_PLOTS } from '../src/data/landmarks';

describe('settlement land-use and circulation', () => {
  const world = new WorldGenerator(), oak = SETTLEMENT_BY_ID.oakmere, home = TOWN_BY_ID.oakmere.world;
  it('keeps the original building IDs and connects every frontage to a street network', () => {
    for (const layout of SETTLEMENT_LAYOUTS) {
      const town = TOWN_BY_ID[layout.townId], count = layout.townId === 'highmere' ? 34 : town.kind === 'capital' ? 10 : town.kind === 'village' ? 5 : 7;
      expect(layout.buildings.length, town.id).toBe(count);
      for (let i = 0; i < count; i++) expect(CONTENT_BY_ID[`town:${town.id}:building:${i}`]).toBeTruthy();
      const reachable = new Set([0]);
      for (let pass = 0; pass < layout.streets.length; pass++) for (let i = 0; i < layout.streets.length; i++) {
        if ([...reachable].some(j => layout.streets[i].points.some(p => onStreet(p.x,p.y,layout.streets[j]))
          || layout.streets[j].points.some(p => onStreet(p.x,p.y,layout.streets[i])))) reachable.add(i);
      }
      expect(reachable.size, `${town.id} disconnected lane`).toBe(layout.streets.length);
      for (const lot of layout.buildings) expect(layout.streets.some(s => onStreet(lot.x,lot.y + 28,s)), `${town.id} inaccessible door`).toBe(true);
    }
  });
  it('leaves road centerlines open around grounded building footprints', () => {
    for (const layout of SETTLEMENT_LAYOUTS) for (const street of layout.streets) for (let segment = 1; segment < street.points.length; segment++) {
      const a = street.points[segment - 1], b = street.points[segment], steps = Math.ceil(Math.hypot(b.x - a.x,b.y - a.y) / 12);
      for (let i = 0; i <= steps; i++) {
        const x = a.x + (b.x - a.x) * i / steps, y = a.y + (b.y - a.y) * i / steps;
        for (const lot of layout.buildings) {
          const f = worldPropFootprint(lot.frame,lot.scale);
          const blocked = Math.abs(x - lot.x) < f.width / 2 + 9 && y > lot.y - f.height - 22 && y < lot.y;
          expect(blocked, `${layout.townId}/${street.id} crosses ${lot.label}`).toBe(false);
        }
      }
    }
  });
  it('places crops inside fields, with entrances and access lanes free of wheat', () => {
    for (const plot of FARM_PLOTS) {
      const crops = WORLD_CONTENT.filter(d => d.id.startsWith(`${plot.id}:wheat:`));
      expect(crops.length).toBeGreaterThanOrEqual(3);
      for (const crop of crops) {
        expect(inParcel(crop.world.x,crop.world.y,plot)).toBe(true);
        expect(world.getTerrainAt(crop.world.x,crop.world.y)).toBe('farmland');
        const town = TOWN_BY_ID[plot.townId];
        expect(SETTLEMENT_BY_ID[plot.townId].streets.some(s => onStreet(crop.world.x - town.world.x,crop.world.y - town.world.y,s,30))).toBe(false);
      }
      for (let i = 0; i < 3; i++) for (const kind of ['fence','wheat']) expect(CONTENT_BY_ID[`${plot.id}:${kind}:${i}`]).toBeTruthy();
    }
  });
  it('keeps named NPCs, spawn and interactive sites reachable without deleting saved identities', () => {
    for (const npc of NPCS) {
      const town=TOWN_BY_ID[npc.townId],layout=SETTLEMENT_BY_ID[npc.townId];
      const x = town.world.x + npc.worldOffset.x, y = town.world.y + npc.worldOffset.y;
      expect(world.isWalkable(x,y)).toBe(true);
      for (const lot of layout.buildings) {
        const f = worldPropFootprint(lot.frame,lot.scale);
        expect(Math.abs(npc.worldOffset.x - lot.x) < f.width / 2 + 9 && npc.worldOffset.y > lot.y - f.height - 22 && npc.worldOffset.y < lot.y, npc.id).toBe(false);
      }
    }
    for (const id of ['west-oak','forge-oak','east-pine','north-pine','road-boulder','farm-boulder','caravan-cargo','courtyard-oak','east-garden-pine']) expect(CONTENT_BY_ID[`detail:oakmere:${id}`]).toBeTruthy();
    expect(world.getTerrainAt(home.x,home.y)).toBe('stone');
    expect(world.getTerrainAt(home.x - 630,home.y + 500)).toBe('dirt');
    expect(world.getTownAt(home.x - 630,home.y + 500)?.id).toBe('oakmere');
  });
  it('plants trees off streets/crop beds and does not hide named NPCs under foreground canopies', () => {
    expect(oak.plantings.filter(p => p.frame === 0).length).toBeGreaterThan(8);
    expect(oak.plantings.filter(p => p.frame === 1).length).toBeGreaterThan(3);
    for (const tree of oak.plantings) {
      expect(oak.streets.some(s => onStreet(tree.x,tree.y,s,18)),tree.id).toBe(false);
      expect(oak.parcels.some(p => p.terrain === 'farmland' && inParcel(tree.x,tree.y,p))).toBe(false);
      const size = artFrameSize('world_assets',tree.frame);
      for (const npc of NPCS.filter(npc => npc.townId === 'oakmere')) {
        if (tree.y <= npc.worldOffset.y) continue; // NPC renders in front of this tree.
        const actor = artFrameSize(npc.spriteTexture ?? 'npcs',npc.spriteFrame);
        const overlapX = Math.abs(tree.x - npc.worldOffset.x) < (size.width * tree.scale + actor.width) / 2;
        const overlapY = tree.y - size.height * tree.scale < npc.worldOffset.y + 20 && tree.y > npc.worldOffset.y + 20 - actor.height;
        expect(overlapX && overlapY,`${tree.id} covers ${npc.id}`).toBe(false);
      }
    }
  });
});

describe('wilderness habitat planting', () => {
  it('is deterministic, spaced, excludes settlement parcels and respects roads/shorelines', () => {
    const world = new WorldGenerator(), trees = [];
    for (let x = 48; x < 51; x++) for (let y = 16; y < 19; y++) {
      const stand = planWildernessTrees(x,y,world,[]);
      expect(stand).toEqual(planWildernessTrees(x,y,world,[]));
      expect(stand.length).toBeLessThanOrEqual(36);
      for (const tree of stand) {
        expect(world.isWalkable(tree.x,tree.y)).toBe(true);
        expect(world.isRoad(tree.x,tree.y)).toBe(false);
        for (const other of trees) expect(Math.hypot(tree.x - other.x,tree.y - other.y)).toBeGreaterThanOrEqual(128);
        trees.push(tree);
      }
    }
    expect(trees.length).toBeGreaterThan(20);
  });
});
