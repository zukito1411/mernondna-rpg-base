import { describe, it, expect } from 'vitest';
import { SETTLEMENT_LAYOUTS, SETTLEMENT_BY_ID, buildingRenderScale, onStreet, inParcel } from '../src/data/settlements';
import { WORLD_CONTENT, CONTENT_BY_ID } from '../src/data/content';
import { TOWN_BY_ID } from '../src/data/towns';
import { NPCS } from '../src/data/npcs';
import { ART_BY_KEY,artFrameSize,worldPropFootprint,worldPropOrigin } from '../src/data/art';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';
import { planWildernessTrees } from '../src/game/systems/sceneryPlan';
import { FARM_PLOTS } from '../src/data/landmarks';
import { TOWN_SHRINE_BY_ID } from '../src/data/townShrines';
import { BUILDING_PRESENTATION_GROWTH } from '../src/data/environmentPresentation';

describe('settlement land-use and circulation', () => {
  const world = new WorldGenerator(), oak = SETTLEMENT_BY_ID.oakmere, home = TOWN_BY_ID.oakmere.world;
  it('enlarges all Elarion villas, including civic landmarks and the shrine',()=>{
    const elarion=SETTLEMENT_BY_ID.elarion;
    for(const lot of elarion.buildings.filter(candidate=>candidate.appearance?.texture==='elven_villas'))
      expect(buildingRenderScale(lot)/lot.scale).toBeGreaterThanOrEqual(1.08);
    const hall=elarion.buildings.find(lot=>lot.label==='Whitebough Hall')!;
    expect(buildingRenderScale(hall)/hall.scale).toBeGreaterThanOrEqual(1.75);
    for(const label of ['Ward Chapel','Lore Archive','Trade Hall']){
      const landmark=elarion.buildings.find(lot=>lot.label===label)!;
      expect(buildingRenderScale(landmark)/landmark.scale).toBeGreaterThanOrEqual(label==='Ward Chapel'?1.5:1.3);
    }
    for(const label of ['Livingwood Lodge','Trade Hall']){
      const lodge=elarion.buildings.find(lot=>lot.label===label)!;
      expect(buildingRenderScale(lodge)/lodge.scale).toBeGreaterThanOrEqual(1.3);
    }
    const tower=elarion.buildings.find(lot=>lot.label==='Moon Survey House')!;
    expect(buildingRenderScale(tower)/tower.scale).toBeGreaterThanOrEqual(1.6);
    const shrine=TOWN_SHRINE_BY_ID.elarion;
    expect(shrine.scale/(.8*BUILDING_PRESENTATION_GROWTH)).toBe(1.35);
    for(const lot of elarion.buildings.filter(candidate=>candidate.wardId))
      expect(lot.plot&&buildingRenderScale(lot)).toBeTruthy();
  });
  it('places continuous flower fencing along the full Whitebough Hall stone court perimeter',()=>{
    const fence=WORLD_CONTENT.filter(item=>item.kind==='prop').filter(item=>item.id.startsWith('elarion:whitebough-fence:'));
    const fenceSources=ART_BY_KEY.flower_fence.sources;
    expect(fenceSources).toHaveLength(4);
    if(!fenceSources)throw new Error('Missing flower-fence source metadata');
    expect(fence).toHaveLength(9);
    expect(fence.every(item=>item.kind==='prop'&&item.texture==='flower_fence'&&item.solid===true
      &&item.scale===1&&item.anchor==='center'&&item.rotation===undefined)).toBe(true);
    const town=TOWN_BY_ID.elarion;
    const horizontalSource=fenceSources[0];
    const verticalSource=fenceSources[1];
    const horizontalCount=2,horizontalLength=artFrameSize('flower_fence',0).width;
    const segment=230,horizontalRowInset=32,centerX=-660,centerY=-790,left=centerX-2.5*segment,right=centerX+2.5*segment,
      top=centerY-1.5*segment,bottom=centerY+1.5*segment;
    const horizontalEndInset=(segment*5-horizontalCount*horizontalLength)/2;
    expect(horizontalSource.renderScale!*horizontalSource.cell[2]).toBeCloseTo(horizontalLength);
    expect(horizontalLength*horizontalCount).toBeLessThan(segment*5);
    expect(ART_BY_KEY.flower_fence.frameWidth).toBeGreaterThan(horizontalLength);
    expect(ART_BY_KEY.flower_fence.frameHeight).toBeGreaterThan(verticalSource.renderScale!*verticalSource.cell[3]);
    expect(horizontalLength).toBeGreaterThan(segment);
    expect(verticalSource.renderScale!*463).toBeCloseTo(270);
    expect(horizontalSource.anchor).toEqual([455,150.5]);
    expect(verticalSource.anchor).toEqual([1027,254.5]);
    expect(worldPropOrigin('flower_fence',0,'center')).toEqual({x:.5,y:.5});
    const horizontal=fence.filter(item=>item.id.includes(':north:'));
    const south=fence.filter(item=>item.id.includes(':south:'));
    expect(horizontal).toHaveLength(horizontalCount);
    expect(south).toHaveLength(horizontalCount);
    expect(horizontal.every(item=>item.frame===0&&item.rotation===undefined
      &&item.footprint?.width===horizontalLength&&item.footprint.height===32)).toBe(true);
    expect(south.every(item=>item.frame===0&&item.footprint?.width===horizontalLength&&item.footprint.height===32)).toBe(true);
    for(const [side,items,y] of [['north',horizontal,top+horizontalRowInset],['south',south,bottom-horizontalRowInset]] as const){
      items.forEach((item,index)=>{
        expect(item.world.x-town.world.x).toBeCloseTo(left+horizontalEndInset+horizontalLength*(index+.5));
        expect(item.world.y-town.world.y).toBeCloseTo(y);
      });
      expect(items[0].world.x-town.world.x-horizontalLength/2).toBeCloseTo(left+horizontalEndInset);
      expect(items[0].world.x-town.world.x+horizontalLength/2)
        .toBeCloseTo(items[1].world.x-town.world.x-horizontalLength/2);
      expect(items[items.length-1].world.x-town.world.x+horizontalLength/2).toBeCloseTo(right-horizontalEndInset);
    }
    const vertical=fence.filter(item=>item.id.includes(':west:')||item.id.includes(':east:'));
    expect(vertical).toHaveLength(5);
    expect(vertical.every(item=>item.frame===1&&item.rotation===undefined
      &&item.footprint?.width===32&&item.footprint.height===segment)).toBe(true);
    vertical.forEach((item,index)=>{
      expect(item.world.y-town.world.y).toBeCloseTo(top+segment*(index%3+.5));
      expect(item.world.x-town.world.x).toBeCloseTo(index<3?left:right);
    });
    for(const side of ['west','east']){
      const items=vertical.filter(item=>item.id.includes(':'+side+':')).sort((a,b)=>a.world.y-b.world.y);
      expect(items[0].world.y-town.world.y-segment/2).toBeCloseTo(top);
      if(side==='west'){
        expect(items).toHaveLength(3);
        expect(items[items.length-1].world.y-town.world.y+segment/2).toBeCloseTo(bottom);
      }else{
        expect(items).toHaveLength(2);
        expect(items[items.length-1].world.y-town.world.y+segment/2).toBeCloseTo(bottom-segment);
        expect(bottom-(items[items.length-1].world.y-town.world.y+segment/2)).toBeCloseTo(segment);
      }
    }
  });
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
        const texture=npc.spriteTexture==='npc_royal_guard'?'npc_guard':npc.spriteTexture ?? 'npcs';
        const actor = artFrameSize(texture,npc.spriteFrame);
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
