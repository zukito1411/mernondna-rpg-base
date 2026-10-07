import type { ContentDefinition, ContentState } from '../game/types';
import { BOSSES, ENEMY_BY_ID } from './enemies';
import { NPCS, NPC_BY_ID } from './npcs';
import { TOWNS, TOWN_BY_ID } from './towns';
import { WORLD_ASSET_FRAMES as PROPS, worldPropFootprint } from './art';
import { FARM_PLOTS } from './landmarks';
import { SETTLEMENT_BY_ID, SETTLEMENT_LAYOUTS, onStreet } from './settlements';

export const WORLD_CONTENT: ContentDefinition[] = [];
for (const town of TOWNS) {
  WORLD_CONTENT.push({ id: `town:${town.id}`, kind: 'settlement', townId: town.id, world: { x: town.world.x, y: town.world.y - 80 } });
  const layout = SETTLEMENT_BY_ID[town.id];
  for (const [i,lot] of layout.buildings.entries()) {
    const world = { x:town.world.x + lot.x,y:town.world.y + lot.y };
    WORLD_CONTENT.push({ id: `town:${town.id}:building:${i}`, kind: 'settlement-prop', world,
      frame:lot.appearance?.frame ?? lot.frame,texture:lot.appearance?.texture,footprint:worldPropFootprint(lot.frame,lot.scale),
      scale:lot.scale,solid:true,...(layout.authored ? { label:lot.label } : {}) });
  }
}
for (const npc of NPCS) {
  const town = TOWN_BY_ID[npc.townId];
  WORLD_CONTENT.push({ id: `npc:${npc.id}`, kind: 'npc', npcId: npc.id,
    world: { x: town.world.x + npc.worldOffset.x, y: town.world.y + npc.worldOffset.y } });
}
for (const boss of BOSSES) {
  WORLD_CONTENT.push({ id: `boss:${boss.id}`, kind: 'creature', enemyId: boss.enemyId, bossId: boss.id,
    world: { x: boss.world.x, y: boss.world.y + (boss.id === 'captain-varr' ? 110 : 0) } });
}
const home = TOWN_BY_ID.oakmere.world;
const near = (x: number, y: number) => ({ x: home.x + x, y: home.y + y });
WORLD_CONTENT.push(
  { id: 'prop:east-watchtower', kind: 'prop', world: near(1400, -850), texture:'world_buildings',frame:4,scale:1.2,solid:true,footprint:worldPropFootprint(2,1.6) },
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
  { id: 'prop:old-shrine', kind: 'prop', world: near(2050, -1220), frame: 3, scale: 1.2, solid: false },
);
const details: Array<[string, keyof typeof PROPS, number, number, number]> = [
  ['road-boulder','rock',1050,-470,1.1], ['farm-boulder','rock',-940,520,1],
  ['caravan-cargo','cargo',-330,40,1],
  ['training-fence-west','fence',-220,235,.8], ['training-fence-east','fence',-145,235,.8],
];
for (const [id, frame, x, y, scale] of details) WORLD_CONTENT.push({
  id: `detail:oakmere:${id}`, kind: 'prop', world: near(x,y), texture: 'world_assets', frame: PROPS[frame], scale, solid: false,
});
for (const layout of SETTLEMENT_LAYOUTS) for (const tree of layout.plantings) {
  const town = TOWN_BY_ID[layout.townId];
  WORLD_CONTENT.push({ id:`detail:${layout.townId}:${tree.id}`,kind:'prop',texture:'world_assets',frame:tree.frame,scale:tree.scale,solid:false,
    world:{ x:town.world.x + tree.x,y:town.world.y + tree.y } });
}
for (const plot of FARM_PLOTS) {
  const layout = SETTLEMENT_BY_ID[plot.townId], town = TOWN_BY_ID[plot.townId];
  let fence = 0, wheat = 0;
  for (const side of [-1,1]) for (let x = plot.x - plot.width / 2 + 36; x < plot.x + plot.width / 2; x += 74) {
    const y = plot.y + side * (plot.height / 2 + 8);
    if (layout.streets.some(s => onStreet(x - town.world.x,y - town.world.y,s,38))) continue;
    WORLD_CONTENT.push({ id:`${plot.id}:fence:${fence++}`,kind:'prop',world:{ x,y },texture:'world_assets',frame:PROPS.fence,scale:.85,solid:false });
  }
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const x = plot.x - plot.width / 2 + 44 + col * (plot.width - 88) / 5, y = plot.y - plot.height / 2 + 44 + row * (plot.height - 88) / 2;
    if (layout.streets.some(s => onStreet(x - town.world.x,y - town.world.y,s,30))) continue;
    WORLD_CONTENT.push({ id:`${plot.id}:wheat:${wheat++}`,kind:'prop',world:{ x,y },texture:'world_assets',frame:PROPS.wheat,scale:.75,solid:false });
  }
}
export const CONTENT_BY_ID = Object.fromEntries(WORLD_CONTENT.map(d => [d.id, d])) as Record<string, ContentDefinition>;
export function initialContentState(definition: ContentDefinition): ContentState {
  return { ...definition.world,
    ...(definition.kind === 'creature' ? { hp: ENEMY_BY_ID[definition.enemyId].hp } : {}),
    ...(definition.kind === 'npc' ? { trust: NPC_BY_ID[definition.npcId].relationshipToLeigneron.trust } : {}),
  };
}
