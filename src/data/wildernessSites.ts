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
  ['royal-waystone','Roadwarden Charter Stone','oakmere:highmere',.38,'overlook','Aldren’s old survey mark names the crown as guarantor of the road. Varr’s private toll has no legal standing. The charter directs disputes to Highmere’s public audience.'],
  ['crown-freight-camp','River Freight Rest','highmere:willowcross',.55,'camp','A sheltered loading stop keeps incoming wagons off the bridge market. Relief sacks bear the same public kitchen seal found in Highmere.'],
  ['greenward-ruin','Greenward Archive Ruin','willowcross:elarion',.58,'ruin','An older ward inscription calls the forest guardian a keeper, not a ruler. The blight has turned protection into confinement. Ilyra can read the surviving names.'],
  ['moon-pilgrim-grove','Moon Pilgrims’ Clearing','elarion:moonfall',.55,'grove','Pilgrims tied cloth here to thank the grove for safe passage. Fresh ribbons stop at the same season the Warden’s attacks began.'],
  ['pass-beacon','Old Pass Signal Station','willowcross:starhold',.66,'overlook','Broken signal stones record safe caravan intervals. Borin’s ropes and Halla’s beacon continue a much older system of shared mountain refuge.'],
  ['clan-road-muster','Clan Road Muster Ground','starhold:redmesa',.57,'ruin','Clan marks surround a common well. No single chieftain owned it; the riders once swore to keep water open to every passing household.'],
  ['southern-caravan-rest','Southern Caravan Shelter','redmesa:deepford',.46,'camp','Fodder bundles, spare harness and a dry supply tally remain under cover. The caravan families depend on both the clan roads and Deepford’s river craft.'],
  ['rootwater-watch','Rootwater Survey Watch','deepford:highmere',.24,'ruin','A stone survey records mine drainage feeding the Rootwater. Recent root fractures do not follow the old channels. Mara’s rune reports deserve an audience in Highmere.'],
  ['seed-road-camp','Seed Road Exchange','deepford:cibar-plains',.55,'camp','Seed crates carry Celia’s tally and the Copperwake transport mark. A public exchange—not a war camp—keeps the southern farms supplied.'],
];
export const WILDERNESS_SITES:WildernessSite[]=routes.map(([id,name,road,fraction,style,description])=>({id,name,world:roadPoint(road,fraction),style,description}));
for(const [townId,id,name,description] of [
  ['tidewatch','salt-bay-outlook','Portquill Bay Outlook','Open seawater reaches the harbor through its defended water ports. Jessa’s navigation marks distinguish public channels from the Salt King’s toll claims.'],
  ['skallheim','ice-bay-outlook','Frost Harbor Outlook','The ice shore opens into a real sea bay. Runa’s beacon watch protects this approach, while inland tracks tell of the displaced Frost Wyrm.'],
] as const){const t=TOWN_BY_ID[townId].world;WILDERNESS_SITES.push({id,name,description,style:'overlook',world:{x:t.x+1900,y:t.y+1700}});}
const dark=TOWN_BY_ID.blackspire.world;
WILDERNESS_SITES.push({id:'ash-vent-watch',name:'Cinder Vent Watch',style:'overlook',world:{x:dark.x+6100,y:dark.y-6500},description:'The eastern flow follows a fissure away from the citadel streets. Vexa’s maintenance marks expose wards that were opened deliberately, not broken by chance.'});
