import {ROAD_ROUTES} from './roadRoutes';
import {TOWN_BY_ID,TOWNS} from './towns';
import {DRAINAGE,pathDistance} from './worldLandscape';
import {insideDefense} from './settlementDefenses';
import type {Vec2} from '../game/types';
export interface WildernessSite {id:string;name:string;world:Vec2;description:string;style:'ruin'|'camp'|'overlook'|'grove'}
function roadPoint(id:string,fraction:number):Vec2{
  const r=ROAD_ROUTES.find(r=>r.id===id)!,lengths=r.points.slice(1).map((b,i)=>Math.hypot(b.x-r.points[i].x,b.y-r.points[i].y));
  let remaining=lengths.reduce((a,b)=>a+b,0)*fraction;
  for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]){const a=r.points[i],b=r.points[i+1],t=remaining/lengths[i];
    const center={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    const candidates=[-280,280,-480,480].flatMap(dy=>[0,-360,360,-640,640].map(dx=>({x:center.x+dx,y:center.y+dy})));
    return candidates.find(p=>DRAINAGE.every(r=>pathDistance(p.x,p.y,r.points,900)>r.width/2+160)
      &&!TOWNS.some(town=>insideDefense(town.id,p.x,p.y,100)))??candidates[0];}remaining-=lengths[i];}
  return {...r.points.at(-1)!};
}
const routes:Array<[string,string,string,number,WildernessSite['style'],string]>=[
  ['royal-waystone','Old King’s Waystone','oakmere:highmere',.38,'overlook','The worn carving shows a crown above an open road. A fresh, black sign has been cut beside it—the same mark found at Varr’s camp.'],
  ['crown-freight-camp','Abandoned Flour Cart','highmere:willowcross',.55,'camp','A cart stands empty beside the road. Sacks have been dragged toward the south, where bootprints disappear into the reeds.'],
  ['greenward-ruin','The Old Greenward Stones','willowcross:elarion',.58,'ruin','The forest guardian was meant to keep travelers safe, not bind the trees in fear. Dark roots have crept around the oldest stone.'],
  ['moon-pilgrim-grove','Moon Pilgrims’ Clearing','elarion:moonfall',.55,'grove','Pilgrims tied cloth here to thank the grove for safe passage. Fresh ribbons stop at the same season the Warden’s attacks began.'],
  ['pass-beacon','The Broken Pass Beacon','willowcross:starhold',.66,'overlook','The beacon stones point toward a narrow path through the peaks. Someone has smashed the oldest one, and fresh tracks lead into the snow.'],
  ['clan-road-muster','The Shared Well','starhold:redmesa',.57,'ruin','A common well sits at the crossing of three clan paths. Its water is dark, and strange scratches ring the rim.'],
  ['southern-caravan-rest','The Empty Caravan Shelter','redmesa:deepford',.46,'camp','A cold fire, a torn harness, and frightened hoofprints are all that remain. The caravan fled toward the river.'],
  ['rootwater-watch','The Rootwater Stones','deepford:highmere',.24,'ruin','Runes carved in the rock tell of a spring beneath the mine. Black roots have broken through the stone and reached the water.'],
  ['seed-road-camp','The Seed Road Camp','deepford:cibar-plains',.55,'camp','Seed sacks lie split beside the road. The farmers who guarded them have vanished, and something heavy has dragged their cart toward the fields.'],
];
export const WILDERNESS_SITES:WildernessSite[]=routes.map(([id,name,road,fraction,style,description])=>({id,name,world:roadPoint(road,fraction),style,description}));
for(const [townId,id,name,description] of [
  ['tidewatch','salt-bay-outlook','Portquill Bay','A black sail circles beyond the harbor mouth. The Salt King’s cave lies beneath the cliffs, where the waves never break.'],
  ['skallheim','ice-bay-outlook','Frost Harbor','The wyrm’s tracks lead from the frozen sea toward the beacon. Whatever drove it from the ice is still out there.'],
] as const){const t=TOWN_BY_ID[townId].world;WILDERNESS_SITES.push({id,name,description,style:'overlook',world:{x:t.x+1900,y:t.y+1700}});}
const dark=TOWN_BY_ID.blackspire.world;
for(const [id,name,x,y,description] of [
  ['darkav:ashwood-watch','Ashwood Watch',-6200,-3400,'Charred trees surround an abandoned watch arch. Its warning bell fell silent when the first ash storm buried the old patrol road.'],
  ['darkav:burnt-chainworks','The Burnt Chainworks',-3600,4200,'Scorched stone and broken timber mark a furnace outpost abandoned before Vexa reforged the city wards. Ember beds still burn beside the fallen roofs.'],
  ['darkav:cinder-pilgrim-ruin','Cinder Pilgrims’ Rest',4200,-3000,'The pilgrims once stopped here before approaching the living mountain. Only blackened arches, ash-covered stumps and a few glowing braziers remain.'],
] as const)WILDERNESS_SITES.push({id,name,description,style:'ruin',world:{x:dark.x+x,y:dark.y+y}});
WILDERNESS_SITES.push({id:'ash-vent-watch',name:'The Cinder Vent',style:'overlook',world:{x:dark.x+6100,y:dark.y-6500},description:'A deep crack splits the mountain beside the old forge. Black glass glitters in the ash, and the stones around it have been opened from within.'});
