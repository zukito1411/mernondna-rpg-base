import type { ContentDefinition, ContentState } from '../game/types';
import { BOSSES, ENEMY_BY_ID } from './enemies';
import { NPCS, NPC_BY_ID } from './npcs';
import { TOWNS, TOWN_BY_ID } from './towns';
import { WORLD_ASSET_FRAMES as PROPS } from './art';
import { FARM_PLOTS } from './landmarks';
import { SETTLEMENT_BY_ID, SETTLEMENT_LAYOUTS, buildingRenderScale } from './settlements';
import { TOWN_SHRINES, townShrineContent } from './townShrines';
import { HIGHMERE_RIVER, onHighmereRiver,WILDERNESS_BRIDGES } from './rivers';
import { spriteBounds, overlaps, rectTouchesStreet, propFoundation, type Rect } from './settlementGeometry';
import { ROAD_ROUTES } from './roadRoutes';
import type { ArtTextureKey } from './art';
import { ROYAL_FORTIFICATION_PROPS, fortificationBlocksPoint } from './fortifications';
import {SETTLEMENT_DEFENSE_PROPS,insideDefense} from './settlementDefenses';
import {WILDERNESS_SITES} from './wildernessSites';
import {isTreeArt} from './treeArt';

export const WORLD_CONTENT: ContentDefinition[] = [];
for (const town of TOWNS) {
  WORLD_CONTENT.push({ id: `town:${town.id}`, kind: 'settlement', townId: town.id, world: { x: town.world.x, y: town.world.y - 80 } });
  const layout = SETTLEMENT_BY_ID[town.id];
  for (const [i,lot] of layout.buildings.entries()) {
    if(lot.omitted)continue;
    const shrine = TOWN_SHRINES.find(s => s.contentId === `town:${town.id}:building:${i}`);
    if (shrine) { WORLD_CONTENT.push(townShrineContent(shrine)); continue; }
    const world = { x:town.world.x + lot.x,y:town.world.y + lot.y };
    const texture = lot.appearance?.texture ?? 'world_buildings';
    const scale = buildingRenderScale(lot);
    const footprint = propFoundation(texture,lot.appearance?.frame ?? lot.frame,scale);
    WORLD_CONTENT.push({ id: `town:${town.id}:building:${i}`, kind: 'settlement-prop', world,
      frame:lot.appearance?.frame ?? lot.frame,texture,footprint,tint:layout.profile.buildingTint,
      scale,solid:true,...(layout.authored ? { label:lot.label } : {}) });
  }
}
for (const layout of SETTLEMENT_LAYOUTS) {
  const town = TOWN_BY_ID[layout.townId];
  for (const [index,decoration] of layout.profile.decorations.entries()) {
    WORLD_CONTENT.push({ id:`detail:${town.id}:civic:${index}`,kind:'prop',
      world:{ x:town.world.x + decoration.x,y:town.world.y + decoration.y },texture:'others',frame:decoration.frame,
      scale:decoration.scale,solid:decoration.solid ?? true });
  }
  for (const [i,[x,y]] of [[-180,-80],[210,-80],[-780,580],[780,580]].entries()) {
    WORLD_CONTENT.push({ id:`detail:${town.id}:street-lamp:${i}`,kind:'prop',world:{x:town.world.x+x,y:town.world.y+y},
      texture:'others',frame:town.kind==='village'?0:i>1?2:1,scale:.5,solid:false });
  }
  if (layout.waterway) for (const [i,y] of layout.waterway.crossings.entries()) WORLD_CONTENT.push({
    id:`bridge:${town.id}:${i}`,kind:'prop',world:{x:town.world.x+layout.waterway.x,y:town.world.y+y},
    texture:'bridges',frame:2,scale:3.3,solid:false,anchor:'center',
  });
  if (town.kind==='harbor') WORLD_CONTENT.push({id:`detail:${town.id}:harbor-pier`,kind:'prop',
    world:{x:town.world.x+700,y:town.world.y+825},texture:'bridges',frame:6,scale:1.8,solid:false,anchor:'bottom'});
  WORLD_CONTENT.push({id:`detail:${town.id}:court-bench`,kind:'prop',world:{x:town.world.x-320,y:town.world.y-80},
    texture:'others',frame:7,scale:.55,solid:false});
  if(town.kind!=='village') WORLD_CONTENT.push({id:`detail:${town.id}:loading-crates`,kind:'prop',
    world:{x:town.world.x-850,y:town.world.y+540},texture:'others',frame:9,scale:.55,solid:true});
}
const highmere = TOWN_BY_ID.highmere;
const cibar=TOWN_BY_ID['cibar-plains'].world;
WORLD_CONTENT.push({id:'clue:cibar-pump',kind:'interactable',world:{x:cibar.x-360,y:cibar.y+190},texture:'others',frame:10,scale:.6,name:'Shared irrigation pump',
  description:'The intake is obstructed and the copper coupling is missing. Iren’s field report can identify the stored fittings.',repeatText:'The shared pump awaits its repaired fittings.',questTargetId:'cibar-pump',questEventType:'investigate',repeatable:true});
for(const [index,[x,y]] of [[-870,-100],[-1080,1040],[1040,1070]].entries())WORLD_CONTENT.push({
  id:'collect:cibar-fitting:'+index,kind:'loot-container',world:{x:cibar.x+x,y:cibar.y+y},texture:'others',frame:9,scale:.5,name:['Grain-store fitting','West-field fitting','East-field fitting'][index],
  description:'You recover a sealed copper fitting for Asha’s irrigation repair.',repeatText:'This store’s fitting has already been recovered.',questTargetId:'cibar-fitting',questEventType:'collect',requiredQuestId:'water-stops',
});
const cityPoint=(x:number,y:number)=>({x:highmere.world.x+x,y:highmere.world.y+y});
WORLD_CONTENT.push(
  {id:'clue:grain-receipt',kind:'interactable',world:cityPoint(-1640,1700),texture:'others',frame:6,scale:.65,name:'Lower Ward receipt',description:'A torn kitchen receipt carries Sevrin Hale’s grain-office seal. Its date is later than the river toll entry.',repeatText:'The receipt is recorded in your journal.',questTargetId:'clue:grain-receipt',questEventType:'investigate',repeatable:true},
  {id:'clue:weighhouse-ledger',kind:'interactable',world:cityPoint(-2250,2340),texture:'others',frame:9,scale:.55,name:'Hidden requisition ledger',description:'The hidden ledger lists grain diverted from Oakmere relief wagons. Tovin’s signature was copied, not written.',repeatText:'The forged requisitions are recorded.',questTargetId:'clue:weighhouse-ledger',questEventType:'investigate',repeatable:true},
  {id:'clue:watch-signals',kind:'interactable',world:cityPoint(-1960,-250),texture:'others',frame:11,scale:.6,name:'Armory watch-signal board',description:'Dawn: grain tally. Noon: bridge inspection. Evening: relief muster. The latest orders have reversed the dated sequence.',repeatText:'Oldest first: grain tally, bridge inspection, relief muster.',questTargetId:'clue:watch-signals',questEventType:'investigate',repeatable:true},
  {id:'clue:relief-tally',kind:'interactable',world:cityPoint(1790,2190),texture:'others',frame:11,scale:.55,name:'Public relief stock tally',description:'Physical stock and delivery records agree when the forged requisitions are removed. Both wards can be supplied if reserves are public.',repeatText:'The physical tally supports a public relief agreement.',questTargetId:'clue:relief-tally',questEventType:'investigate',repeatable:true},
  {id:'training:highmere-target',kind:'interactable',world:cityPoint(-1780,-320),texture:'others',frame:12,scale:.6,name:'Royal practice standard',description:'Caldus’s drill yard: three sword strokes, two dashes, then Azure Cleave. Training counts only within reach of this yard, not against citizens.',repeatText:'Practice within the marked drill yard.',repeatable:true},
  {id:'watch:relief-yard',kind:'interactable',world:cityPoint(2190,2090),texture:'others',frame:12,scale:.6,name:'Relief watch standard',description:'Hold the watch beside the marked yard for twelve seconds while Iven verifies the supplies.',repeatText:'The relief stores are kept under witness.',repeatable:true},
);
// More detail follows authored district functions; the existing clearance pass
// still checks full art bounds before admitting these roadside objects.
for(const [i,[x,y,frame,scale]] of [
  [-180,-180,10,.9],[-200,250,7,.65],[-240,410,11,.65],[-1110,-1420,12,.6],[-880,-1430,3,.55],
  [1220,-130,5,.72],[1510,-100,5,.72],[1810,150,5,.68],[1950,620,8,.6],
  [-2270,-130,3,.6],[-1940,-120,8,.65],[-2250,1160,6,.55],[-1820,2050,8,.5],[-870,2080,5,.5],
  [1270,2210,8,.65],[1590,2270,9,.65],[-1700,2090,7,.45],
].entries()) WORLD_CONTENT.push({id:'detail:highmere:district:'+i,kind:'prop',world:cityPoint(x,y),texture:'others',frame,scale,solid:![7,12].includes(frame)});
for(const [i,[x,y]] of [[-2470,80],[-1970,80],[-1470,80],[-970,80],[-600,-570],[850,-570],[1330,80],[1810,80],[2310,80],[-600,1470],[850,1470],[-2100,1980],[2400,2180],[-1000,-1180]].entries())
  WORLD_CONTENT.push({id:'detail:highmere:avenue-lamp:'+i,kind:'prop',world:cityPoint(x,y),texture:'others',frame:y>1200?0:1,scale:.55,solid:false});
for (const [index,bridgeY] of HIGHMERE_RIVER.bridgeY.entries()) {
  const y = highmere.world.y + bridgeY;
  const segmentIndex = HIGHMERE_RIVER.points.slice(1).findIndex((point,i) =>
    y >= Math.min(HIGHMERE_RIVER.points[i].y,point.y) && y <= Math.max(HIGHMERE_RIVER.points[i].y,point.y));
  if (segmentIndex < 0) throw new Error(`Highmere bridge ${index} is outside the river survey.`);
  const start = HIGHMERE_RIVER.points[segmentIndex], end = HIGHMERE_RIVER.points[segmentIndex + 1];
  const t = end.y === start.y ? 0 : (y - start.y) / (end.y - start.y);
  WORLD_CONTENT.push({ id:`bridge:highmere:${index}`,kind:'prop',world:{ x:start.x + (end.x - start.x) * t,y },
    texture:'bridges',frame:2,scale:3.3,solid:false,anchor:'center' });
}
for (const npc of NPCS) {
  const town = TOWN_BY_ID[npc.townId];
  WORLD_CONTENT.push({ id: `npc:${npc.id}`, kind: 'npc', npcId: npc.id,
    world: { x: town.world.x + npc.worldOffset.x, y: town.world.y + npc.worldOffset.y } });
}
for (const boss of BOSSES) {
  // Keep authored boss territories outside the larger settlement boundaries.
  const town = TOWNS.find(t => insideDefense(t.id,boss.world.x,boss.world.y,160));
  const layout = town ? SETTLEMENT_BY_ID[town.id] : undefined;
  const inside = town && layout && insideDefense(town.id,boss.world.x,boss.world.y,160);
  let world={x:boss.world.x,y:boss.world.y+(boss.id==='captain-varr'?110:0)};
  if(inside&&town&&layout){const dx=world.x-town.world.x,dy=world.y-town.world.y,length=Math.max(1,Math.hypot(dx,dy));
    for(let step=96;step<20000;step+=96){const candidate={x:world.x+(dx||1)/length*step,y:world.y+dy/length*step};
      if(!TOWNS.some(t=>insideDefense(t.id,candidate.x,candidate.y,180))){world=candidate;break;}}}
  WORLD_CONTENT.push({ id: `boss:${boss.id}`, kind: 'creature', enemyId: boss.enemyId, bossId: boss.id,
    world });
}
const home = TOWN_BY_ID.oakmere.world;
const near = (x: number, y: number) => ({ x: home.x + x, y: home.y + y });
WORLD_CONTENT.push(
  { id: 'prop:east-watchtower', kind: 'prop', world: near(1400, -850), texture:'world_buildings',frame:4,scale:1.2,solid:true,footprint:propFoundation('world_buildings',4,1.2) },
  { id: 'creature:oakmere-wolf-east', kind: 'creature', world: near(1300, 450), enemyId: 'gray-wolf' },
  { id: 'creature:oakmere-boar-north', kind: 'creature', world: near(-650, -1150), enemyId: 'rindass-boar' },
  { id: 'sign:oakmere-east-road', kind: 'interactable', world: near(500, -100), texture: 'world_assets', frame: PROPS.sign, scale: .8, name: 'East road marker',
    description: 'Old watchtower: northeast of Oakmere. Highmere: follow the crown road north. Aldren marked the watchtower route on this stone.',
    repeatText: 'The watchtower stands northeast of Oakmere; the crown road runs north toward Highmere.' },
  { id: 'loot:oakmere-road-cache', kind: 'loot-container', world: near(560, 110), texture: 'world_assets', frame: PROPS.cargo, scale: 1, name: 'Roadwarden supply cache', rewardGold: 12,
    description: 'Aldren left twelve coins here for road supplies. The cache is now empty.', repeatText: 'The roadwarden cache is empty.' },
  { id: 'harvest:oakmere-berries', kind: 'harvestable', world: near(-500, 220), texture: 'world_assets', frame: PROPS.tree, scale: .45, name: 'Wild berry patch', restoreHp: 12,
    description: 'You gather the ripe berries and recover a little health.', repeatText: 'There are no ripe berries left on this patch.' },
  { id: 'entrance:oakmere-old-cellar', kind: 'dungeon-entrance', world: near(650, -500), texture:'world_buildings',frame:4,name: 'Sealed roadwarden cellar',
    description: 'The old cellar entrance is sealed by fallen stone. You record the site for a future expedition.',
    repeatText: 'The cellar remains sealed. It will need excavation before anyone can enter.' },
  { id: 'shrine:oakmere-road', kind: 'interactable', world: near(40, -270), texture:'world_buildings',frame:3,scale:.8,name: 'Oakmere road shrine',
    description: 'A small lantern burns for travelers. Orin tends this shrine and records the omens brought from the road.',
    repeatText: 'The lantern still burns. Orin keeps watch over the road.' },
  { id: 'camp:oakmere-fire', kind: 'interactable', world: near(-380, 280), texture: 'world_assets', frame: PROPS.fire, scale: 1, name: 'Travelers’ campfire', restoreHp: 14,
    description: 'You rest beside the travelers’ fire and recover a little health.', repeatText: 'The embers glow softly. You have already rested here.' },
  { id: 'creature:old-shrine-wraith', kind: 'creature', world: near(2000, -1150), enemyId: 'marsh-wraith' },
  { id: 'prop:old-shrine', kind: 'prop', world: near(2050, -1220), frame: 3, scale: 1.2, solid: true },
);
const varrSite=WORLD_CONTENT.find(d=>d.id==='boss:captain-varr')!.world;
const watchtower=WORLD_CONTENT.find(d=>d.id==='prop:east-watchtower')!;
watchtower.world={x:varrSite.x,y:varrSite.y-110};
// Preserve the existing Oakmere shrine ID and the capital's shrine building ID.
// Every other settlement gets an accessible shrine beside its central street.
for (const shrine of TOWN_SHRINES) {
  const index = WORLD_CONTENT.findIndex(d => d.id === shrine.contentId);
  if (index >= 0) WORLD_CONTENT[index] = townShrineContent(shrine);
  else WORLD_CONTENT.push(townShrineContent(shrine));
}
const details: Array<[string, keyof typeof PROPS, number, number, number]> = [
  ['road-boulder','rock',1050,-470,1.1], ['farm-boulder','rock',-940,520,1],
  ['caravan-cargo','cargo',-330,40,1],
  ['training-fence-west','fence',-220,235,.8], ['training-fence-east','fence',-145,235,.8],
];
for (const [id, frame, x, y, scale] of details) WORLD_CONTENT.push({
  id: `detail:oakmere:${id}`, kind: 'prop', world: near(x,y), texture: 'world_assets', frame: PROPS[frame], scale, solid: true,
});
for (const layout of SETTLEMENT_LAYOUTS) for (const tree of layout.plantings) {
  const town = TOWN_BY_ID[layout.townId];
  WORLD_CONTENT.push({ id:`detail:${layout.townId}:${tree.id}`,kind:'prop',texture:tree.texture??'world_assets',frame:tree.frame,scale:tree.scale,solid:false,
    world:{ x:town.world.x + tree.x,y:town.world.y + tree.y } });
}
for (const plot of FARM_PLOTS) {
  const layout = SETTLEMENT_BY_ID[plot.townId], town = TOWN_BY_ID[plot.townId];
  let fence = 0, wheat = 0;
  for (const side of [-1,1]) for (let x = plot.x - plot.width / 2 + 36; x < plot.x + plot.width / 2; x += 74) {
    const y = plot.y + side * (plot.height / 2 + 8);
    const rect=spriteBounds('world_assets',PROPS.fence,.85,x-town.world.x,y-town.world.y);
    if (layout.streets.some(s => rectTouchesStreet(rect,s,12))
      ||![rect.left,rect.right].every(px=>[rect.top,rect.bottom].every(py=>insideDefense(town.id,town.world.x+px,town.world.y+py,-24)))) continue;
    WORLD_CONTENT.push({ id:`${plot.id}:fence:${fence++}`,kind:'prop',world:{ x,y },texture:'world_assets',frame:PROPS.fence,scale:.85,solid:true });
  }
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const x = plot.x - plot.width / 2 + 44 + col * (plot.width - 88) / 5, y = plot.y - plot.height / 2 + 44 + row * (plot.height - 88) / 2;
    const rect=spriteBounds('world_assets',PROPS.wheat,.75,x-town.world.x,y-town.world.y);
    if (layout.streets.some(s => rectTouchesStreet(rect,s,12))) continue;
    WORLD_CONTENT.push({ id:`${plot.id}:wheat:${wheat++}`,kind:'prop',world:{ x,y },texture:'world_assets',frame:PROPS.wheat,scale:.75,solid:false });
  }
}
// Place loose objects alongside circulation, never on it. Full visible bounds
// protect roofs, canopies, named residents, shrine forecourts and other props.
const placed:Rect[] = WORLD_CONTENT.filter(d=>d.kind==='settlement-prop' || d.kind==='npc' || 'townShrineId' in d || d.id.startsWith('detail:') && 'frame' in d && isTreeArt(d.texture??'',d.frame))
  .map(d=>d.kind==='npc' ? {left:d.world.x-32,right:d.world.x+32,top:d.world.y-76,bottom:d.world.y+35}
    : 'frame' in d ? spriteBounds(d.texture??'world_objects',d.frame,'scale' in d?d.scale??1:1,d.world.x,d.world.y) : {left:0,right:0,top:0,bottom:0});
for(const d of WORLD_CONTENT) {
  if(!('frame' in d)||d.kind==='settlement-prop'||'townShrineId' in d||d.id.startsWith('farm:')||d.id.startsWith('bridge:')
    ||d.id.endsWith('harbor-pier')||isTreeArt(d.texture??'',d.frame)&&d.id.startsWith('detail:')) continue;
  const texture:ArtTextureKey=d.texture??'world_objects',scale=d.scale??1;
  const layout=SETTLEMENT_LAYOUTS.find(s=>{const t=TOWN_BY_ID[s.townId];return Math.abs(d.world.x-t.world.x)<s.bounds.width/2+600&&Math.abs(d.world.y-t.world.y)<s.bounds.height/2+600;});
  if(!layout) continue;
  const town=TOWN_BY_ID[layout.townId],preferred={...d.world};
  const slots:Array<{x:number;y:number}>=[];
  for(let dy=-512;dy<=512;dy+=32) for(let dx=-512;dx<=512;dx+=32) slots.push({x:preferred.x+dx,y:preferred.y+dy});
  slots.sort((a,b)=>Math.hypot(a.x-preferred.x,a.y-preferred.y)-Math.hypot(b.x-preferred.x,b.y-preferred.y));
  const position=slots.find(p=>{
    const rect=spriteBounds(texture,d.frame,scale,p.x,p.y);
    const local={left:rect.left-town.world.x,right:rect.right-town.world.x,top:rect.top-town.world.y,bottom:rect.bottom-town.world.y};
    return !fortificationBlocksPoint(p.x,p.y,45) && !layout.streets.some(s=>rectTouchesStreet(local,s,12))&&!ROAD_ROUTES.some(r=>rectTouchesStreet(rect,r,12))
      && ![rect.left,(rect.left+rect.right)/2,rect.right].some(x=>[rect.top,(rect.top+rect.bottom)/2,rect.bottom].some(y=>onHighmereRiver(x,y)))
      && (!layout.waterway || local.right<layout.waterway.x-layout.waterway.width/2-16 || local.left>layout.waterway.x+layout.waterway.width/2+16)
      && !placed.some(r=>overlaps(rect,r,16)) && !layout.parcels.some(p=>p.terrain==='water' && overlaps(local,{left:p.x-p.width/2,right:p.x+p.width/2,top:p.y-p.height/2,bottom:p.y+p.height/2}));
  });
  if(!position) throw new Error('No clear roadside location for '+d.id);
  d.world=position;placed.push(spriteBounds(texture,d.frame,scale,position.x,position.y));
}
// Ward furniture was fitted against complete street/roof/tree bounds in the
// shared layout, not scattered by the older core-only roadside repair pass.
for(const layout of SETTLEMENT_LAYOUTS){const town=TOWN_BY_ID[layout.townId];
  for(const detail of layout.details??[])WORLD_CONTENT.push({id:`detail:${town.id}:${detail.id}`,kind:'prop',
    world:{x:town.world.x+detail.x,y:town.world.y+detail.y},texture:detail.texture,frame:detail.frame,
    scale:detail.scale,solid:detail.solid,footprint:propFoundation(detail.texture,detail.frame,detail.scale),...(detail.label?{label:detail.label}:{})});
}
for(const bridge of WILDERNESS_BRIDGES)WORLD_CONTENT.push({id:bridge.id,kind:'prop',world:{x:bridge.x,y:bridge.y},texture:'bridges',frame:2,scale:3.3,solid:false,anchor:'center'});
for(const site of WILDERNESS_SITES){
  WORLD_CONTENT.push({id:'discovery:'+site.id,kind:'interactable',world:site.world,texture:'others',frame:11,scale:.58,name:site.name,
    description:site.description,repeatText:site.description,repeatable:true,discoveryId:site.id,questTargetId:site.id,questEventType:'investigate'});
  WORLD_CONTENT.push({id:'detail:wilderness:'+site.id,kind:'prop',world:{x:site.world.x-150,y:site.world.y-110},
    texture:site.style==='ruin'?'world_buildings':site.style==='camp'?'world_assets':'others',frame:site.style==='ruin'?4:site.style==='camp'?6:7,
    scale:site.style==='ruin'?.8:.65,solid:site.style==='ruin'});
}
WORLD_CONTENT.push(...ROYAL_FORTIFICATION_PROPS,...SETTLEMENT_DEFENSE_PROPS);
export const CONTENT_BY_ID = Object.fromEntries(WORLD_CONTENT.map(d => [d.id, d])) as Record<string, ContentDefinition>;
export function initialContentState(definition: ContentDefinition): ContentState {
  return { ...definition.world,
    ...(definition.kind === 'creature' ? { hp: ENEMY_BY_ID[definition.enemyId].hp } : {}),
    ...(definition.kind === 'npc' ? { trust: NPC_BY_ID[definition.npcId].relationshipToLeigneron.trust } : {}),
  };
}
