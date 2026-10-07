import type { TerrainKind, Vec2, TownDefinition } from '../game/types';
import { TOWNS, TOWN_BY_ID, ROAD_CONNECTIONS } from './towns';
import { worldPropFootprint } from './art';

export interface LandParcel { id: string; purpose: string; x: number; y: number; width: number; height: number; terrain: TerrainKind }
export interface Street { id: string; width: number; points: Vec2[] }
export interface BuildingLot extends Vec2 { frame: number; scale: number; label: string; purpose: string; appearance?:{ texture:'world_buildings'; frame:number } }
export interface Planting extends Vec2 { id: string; frame: 0 | 1; scale: number; purpose: string }
export interface SettlementLayout {
  townId: string; authored: boolean; bounds: LandParcel; baseTerrain: TerrainKind;
  parcels: LandParcel[]; streets: Street[]; buildings: BuildingLot[]; plantings: Planting[];
}
export const inParcel = (x: number, y: number, p: LandParcel) => Math.abs(x - p.x) <= p.width / 2 && Math.abs(y - p.y) <= p.height / 2;
export function segmentDistance(x: number, y: number, a: Vec2, b: Vec2) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}
export function onStreet(x: number, y: number, street: Street, margin = 0) {
  return street.points.slice(1).some((point, i) => segmentDistance(x, y, street.points[i], point) <= street.width / 2 + margin);
}
const street = (id: string, width: number, points: number[][]): Street => ({ id, width, points: points.map(([x,y]) => ({ x,y })) });
const parcel = (id: string, purpose: string, terrain: TerrainKind, x: number, y: number, width: number, height: number): LandParcel => ({ id,purpose,terrain,x,y,width,height });

// The atlas establishes regional land use, not village-level survey coordinates.
// Oakmere is an authored road-and-farm settlement inside Trandum's cleared belt.
const oakmere: SettlementLayout = {
  townId: 'oakmere', authored: true, baseTerrain: 'grass',
  bounds: parcel('village-edge','Cleared settlement and agricultural fringe','grass',0,100,2000,1800),
  buildings: [
    { x:350,y:220,frame:1,scale:.98,label:'Marrow Inn',purpose:'Travelers and trade beside the eastern road',appearance:{ texture:'world_buildings',frame:1 } },
    { x:-250,y:-220,frame:0,scale:1,label:'Guard Post',purpose:'Watch the western entrance and crown-road approach',appearance:{ texture:'world_buildings',frame:5 } },
    { x:-430,y:240,frame:0,scale:.98,label:'West Cottages',purpose:'Homes between the village and orchard',appearance:{ texture:'world_buildings',frame:0 } },
    { x:310,y:-205,frame:0,scale:1,label:'Pike Smithy',purpose:'Stone work apron separated from crops and dwellings',appearance:{ texture:'world_buildings',frame:2 } },
    { x:520,y:330,frame:0,scale:.98,label:'Ranger Lodge',purpose:'Eastern edge facing the woodland and hunting route',appearance:{ texture:'world_buildings',frame:0 } },
  ],
  parcels: [
    parcel('square','Road junction and public meeting place','stone',0,0,170,140),
    parcel('shrine-court','Quiet ritual court beside the shrine grove','stone',20,-235,190,130),
    parcel('smith-apron','Non-flammable repair and loading surface','stone',270,-105,230,100),
    parcel('caravan-yard','Turn and unload carts near Torren','dirt',-300,35,160,145),
    parcel('training-ground','Open sparring ground beside Aldren','dirt',-140,125,180,145),
    parcel('inn-court','Travelers approach the south-facing inn door','dirt',350,260,260,95),
    parcel('herb-garden','Tended beds beside Mira and the east footpath','farmland',230,150,100,90),
    parcel('orchard','Food trees on the residential/agricultural fringe','grass',-650,195,240,270),
    parcel('farm:oakmere','Cleared crop field with a central access lane','farmland',-630,500,520,288),
    parcel('west-copse','Woodland retained beyond the guard post','forest',-740,-390,280,240),
    parcel('north-copse','Shrine woodland separated from the forge','forest',-100,-520,500,220),
  ],
  streets: [
    street('west-east-road',84,[[-1000,0],[1000,0]]),
    street('shrine-walk',56,[[0,0],[0,-200],[40,-270]]),
    street('south-walk',64,[[0,0],[0,400]]),
    street('training-walk',56,[[0,120],[-120,120],[-180,180]]),
    street('guard-access',56,[[-180,0],[-180,-90],[-250,-90],[-250,-180]]),
    street('west-home-access',56,[[-320,0],[-320,280],[-430,280],[-430,264]]),
    street('smith-access',56,[[240,0],[240,-100],[310,-100],[310,-181]]),
    street('inn-access',56,[[0,260],[170,260],[170,0]]),
    street('inn-frontage',56,[[170,260],[350,260],[350,244]]),
    street('ranger-access',56,[[620,0],[620,370],[520,370],[520,354]]),
    street('farm-lane',64,[[-320,280],[-320,400],[-630,400],[-630,720]]),
  ],
  plantings: [
    { id:'west-oak',x:-380,y:95,frame:0,scale:1.35,purpose:'Gate shade; keep the trunk off the road and the canopy off Torren' },
    { id:'courtyard-oak',x:-250,y:310,frame:0,scale:1.45,purpose:'Shade on the south edge, not over the trainer' },
    { id:'shrine-oak',x:-140,y:-200,frame:0,scale:1.4,purpose:'Separate quiet shrine court from western traffic' },
    { id:'shrine-pine',x:180,y:-300,frame:1,scale:1.4,purpose:'Northern windbreak outside the crown road' },
    { id:'east-garden-pine',x:450,y:70,frame:1,scale:1.35,purpose:'Northern inn garden, behind the building' },
    { id:'east-pine',x:690,y:390,frame:1,scale:1.4,purpose:'Woodland boundary beyond the ranger access lane' },
    { id:'forge-oak',x:460,y:-340,frame:0,scale:1.3,purpose:'Green buffer north of the smithy, clear of the crown road' },
    ...[-710,-590].flatMap((x,col) => [110,240].map((y,row): Planting => ({ id:`orchard:${col}:${row}`,x,y,frame:0,scale:.95,purpose:'Regular orchard spacing and harvest access' }))),
    ...[-850,-740,-630].map((x,i): Planting => ({ id:`western-copse:${i}`,x,y:-310 - (i % 2) * 100,frame:0,scale:1.4,purpose:'Retained woodland, not farmland or a street' })),
    ...[-270,-110,70].map((x,i): Planting => ({ id:i === 1 ? 'north-pine' : `northern-copse:${i}`,x,y:-470 - (i % 2) * 70,frame:i === 1 ? 1 : 0,scale:1.45,purpose:'Northern wooded shelter belt' })),
  ],
};

function approaches(town: TownDefinition): Street[] {
  return ROAD_CONNECTIONS.filter(pair => pair.includes(town.id)).map(pair => {
    const other = TOWN_BY_ID[pair.find(id => id !== town.id)!];
    const dx = other.world.x - town.world.x, dy = other.world.y - town.world.y, length = Math.hypot(dx,dy);
    return street(`approach:${other.id}`,90,[[0,0],[dx / length * 1100,dy / length * 1100]]);
  });
}
function prototypeLayout(town: TownDefinition): SettlementLayout {
  const streets = [street('main-street',84,[[-1100,0],[0,0],[1100,0]]),street('cross-street',72,[[0,-900],[0,0],[0,1100]]),...approaches(town)];
  const arterialStreets = [...streets];
  const buildings: BuildingLot[] = [], count = town.kind === 'capital' ? 10 : town.kind === 'village' ? 5 : 7;
  for (const y of [-240,140,520,-620,900]) for (const x of [-280,280,-560,560,-840,840]) {
    if (buildings.length >= count) continue;
    const footprint = worldPropFootprint(0,1);
    if (arterialStreets.some(s => onStreet(x,y - footprint.height / 2,s,footprint.width / 2 + 24))) continue;
    buildings.push({ x,y,frame:0,scale:1,label:`${town.name} house ${buildings.length + 1}`,purpose:'Prototype street-facing lot; regional architecture still needs authored art' });
    streets.push(street(`frontage:${buildings.length}`,56,[[0,y + 42],[x,y + 42],[x,y + 24]]));
  }
  const baseTerrain: TerrainKind = town.regionId === 'nardorous' ? 'stone' : town.regionId === 'frostlands' ? 'snow'
    : town.regionId === 'darkav' ? 'ash' : town.regionId === 'rindass' ? 'dirt' : 'grass';
  const parcels = [parcel('square','Public street junction','stone',0,0,180,140)];
  if (town.regionId === 'trandum') {
    parcels.push(parcel(`farm:${town.id}`,'Agricultural fringe outside the residential lots','farmland',-630,700,440,256));
    streets.push(street('farm-access',64,[[0,700],[-630,700]]));
  }
  return { townId:town.id,authored:false,bounds:parcel('settlement-edge','Prototype street district',baseTerrain,0,100,2400,2400),
    baseTerrain,parcels,streets,buildings,plantings:[] };
}

oakmere.streets.push(...approaches(TOWN_BY_ID.oakmere));
export const SETTLEMENT_LAYOUTS: SettlementLayout[] = TOWNS.map(t => t.id === 'oakmere' ? oakmere : prototypeLayout(t));
export const SETTLEMENT_BY_ID = Object.fromEntries(SETTLEMENT_LAYOUTS.map(s => [s.townId,s])) as Record<string, SettlementLayout>;
export function settlementAt(x: number, y: number) {
  return SETTLEMENT_LAYOUTS.find(s => { const town = TOWN_BY_ID[s.townId]; return inParcel(x - town.world.x,y - town.world.y,s.bounds); });
}
export const SETTLEMENT_ENEMY_BUFFER = 96;
export function protectedSettlementAt(x: number, y: number) {
  return SETTLEMENT_LAYOUTS.find(s => {
    const town = TOWN_BY_ID[s.townId], bounds = s.bounds;
    return Math.abs(x - town.world.x - bounds.x) <= bounds.width / 2 + SETTLEMENT_ENEMY_BUFFER
      && Math.abs(y - town.world.y - bounds.y) <= bounds.height / 2 + SETTLEMENT_ENEMY_BUFFER;
  });
}
export function settlementTerrain(layout: SettlementLayout, x: number, y: number): TerrainKind {
  // Paved courts override street dirt; streets cut access lanes through fields.
  if (layout.parcels.some(p => p.terrain === 'stone' && inParcel(x,y,p))) return 'stone';
  if (layout.streets.some(s => onStreet(x,y,s))) return 'dirt';
  return layout.parcels.find(p => inParcel(x,y,p))?.terrain ?? layout.baseTerrain;
}
