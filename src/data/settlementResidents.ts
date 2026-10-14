import type {NpcDefinition,RegionId,Vec2} from '../game/types';
import {TOWNS} from './towns';
import {wardActivityPoints,settlementWardName} from './settlementWards';

type Ancestry=NonNullable<NpcDefinition['ancestry']>;
interface PopulationProfile {contact:string;locals:string[];guests:string[];trades:string[]}
// Authored identities and trades, not runtime-rerolled anonymous pedestrians.
const profiles:Record<string,PopulationProfile>={
  oakmere:{contact:'sena-marrow',locals:['Hamo Applewake','Audrey Hearthacre'],guests:['Nimel Fernscribe','Dorek Brasswheel'],trades:['Orchard Preserver','Cart Fitting Supplier']},
  highmere:{contact:'maela-quill',locals:['Rowland Silkward','Hawise Copperloom','Ysabel Glasswick','Walter Linenfold'],guests:['Veyra Willowquill','Borin Gearwake','Durgan Reedhide','Cecily Sailmark'],trades:['Guild Tool Supplier','Cloth Factor','Apothecary Assistant','Market Provisioner']},
  willowcross:{contact:'willowcross-keeper',locals:['Clement Oatwick','Agnes Wheelreed'],guests:['Lira Mossquill','Dorin Bucklerpin'],trades:['Drovers Provisioner','Fletcher Supplier']},
  elarion:{contact:'elarion-lorekeeper',locals:['Aethir Leafglass','Ithwen Bloomveil','Lethwen Dewpetal','Saeron Branchweave'],guests:['Thomas Roadwell','Brek Copperthread','Urzak Hidebraid','Alice Tidechart'],trades:['Boughcraft Supplier','Livingwood Weaver','Grove Herb Tender','Seed Steward']},
  moonfall:{contact:'moonfall-herbalist',locals:['Nethir Moonseed','Elwen Fernlight'],guests:['Matilda Herbway','Brokk Flintbuckle'],trades:['Grove Tool Keeper','Moonherb Preserver']},
  starhold:{contact:'starhold-quartermaster',locals:['Gilbert Ropeholm','Aveline Woolridge','Rosamund Snowherb','Osbert Passgrain'],guests:['Arwen Pinequill','Thorek Stonebuckle','Grazh Leatherpeak','Beatrice Seawick'],trades:['Climbing Fitting Supplier','Winter Cloth Factor','Pass Herb Tender','Mountain Provisioner']},
  redmesa:{contact:'redmesa-beastmaster',locals:['Ruzhak Emberhorn','Gorla Reedtusk','Mazra Sunroot','Kurgan Saddlebone'],guests:['Nicholas Cartmere','Feylith Grassquill','Durgin Rivethelm','Philippa Windchart'],trades:['Clan Tool Supplier','Hide Stitcher','Wellside Herb Tender','Riders Provisioner']},
  deepford:{contact:'deepford-boatwright',locals:['Brogan Rivetbank','Helga Orebraid','Dagna Rootcopper','Thorin Ferrypin'],guests:['Edmund Plankford','Ithriel Seedquill','Gorzh Leatherbank','Emmeline Coastglass'],trades:['Boat Fitting Supplier','Guild Cloth Factor','River Herb Tender','Mine Provisioner']},
  'cibar-plains':{contact:'celia-brook',locals:['Dorrin Seedrivet','Kelda Grainbraid'],guests:['Robert Wheatway','Neriel Dewquill'],trades:['Irrigation Fitting Supplier','Harvest Preserver']},
  tidewatch:{contact:'tidewatch-harbor-master',locals:['Geoffrey Netbolt','Catherine Sailfold','Mabel Saltleaf','Richard Cargofoot'],guests:['Alwen Tidequill','Brom Anchorpin','Gruth Leatherwake','Eleanor Snowchart'],trades:['Ship Fitting Supplier','Canvas Factor','Quayside Herb Tender','Fleet Provisioner']},
  skallheim:{contact:'skallheim-trader',locals:['Hakon Icebolt','Sigrun Woolwake','Inga Snowpetal','Eirik Fishgrain'],guests:['Thalwen Frostquill','Drek Harpoonpin','Urzhan Furhide','Amabel Waveglass'],trades:['Harpoon Fitting Supplier','Winter Weaver','Longhouse Herb Tender','Fish Camp Provisioner']},
  blackspire:{contact:'blackspire-forgemaster',locals:['Aldwin Chainbolt','Heloise Ashfold','Petronilla Cinderleaf','Wulfric Furnacegrain'],guests:['Seriel Emberquill','Borrin Cinderpin','Kruth Leatherash','Isolde Stormchart'],trades:['Chain Fitting Supplier','Ash Cloth Factor','Vent Herb Tender','Furnace Provisioner']},
};
const ancestry=(region:RegionId):Ancestry=>region==='narenthil'?'elf':region==='rindass'?'orc':region==='druganwoods'?'dwarf':'human';
const origins:Array<{ancestry:Ancestry;region:RegionId;role:string}>=[
  {ancestry:'human',region:'trandum',role:'Road Caravan Factor'},
  {ancestry:'elf',region:'narenthil',role:'Traveling Herb Trader'},
  {ancestry:'dwarf',region:'druganwoods',role:'Traveling Tool Merchant'},
  {ancestry:'orc',region:'rindass',role:'Clan Hide Broker'},
];
const offset=(p:Vec2,x:number,y:number)=>({x:p.x+x,y:p.y+y});
function texture(race:Ancestry,index:number):NpcDefinition['spriteTexture'] {
  if(race==='elf')return index%2?'npc_elven_woman_idle':'npc_elven_man_idle';
  return ['npc_blacksmith','npc_attendant','npc_villager','npc_adventurer'][index%4] as NpcDefinition['spriteTexture'];
}
export interface SettlementPopulationSummary {native:number;visitors:number;addedLocals:number;addedVisitors:number}
export const SETTLEMENT_POPULATIONS:Record<string,SettlementPopulationSummary>={};
/** Visitors are capped at one per three native residents (at most 25% of the
 * population). Stable IDs keep affinity/save state across chunk unloads. */
export function createSettlementResidents(existing:readonly NpcDefinition[]):NpcDefinition[]{
  const result:NpcDefinition[]=[],usedNames=new Set(existing.map(n=>n.name));
  for(const town of TOWNS){
    const p=profiles[town.id];if(!p)continue;
    const native=ancestry(town.regionId),large=['capital','stronghold','harbor'].includes(town.kind);
    const localCount=large?4:2,base=existing.filter(n=>n.townId===town.id);
    const nativeCount=base.filter(n=>!n.visitor).length+localCount,oldVisitors=base.filter(n=>n.visitor).length;
    const guestCount=Math.max(0,Math.min(large?4:2,Math.floor(nativeCount/3)-oldVisitors));
    const choices=origins.filter(o=>o.ancestry!==native);
    choices.push({ancestry:'human',region:town.regionId==='portquill'?'nardorous':'portquill',role:'Voyaging Cartographer'});
    const west=wardActivityPoints(town.id,-1),east=wardActivityPoints(town.id,1);
    const locals=[offset(west.work,-160,180),offset(east.work,160,180),offset(west.social,-220,140),offset(east.social,220,140)];
    const guests=[offset(west.social,0,-180),offset(east.social,0,-180),offset(west.home,180,-160),offset(east.home,-180,-160)];
    const created:NpcDefinition[]=[];
    for(let i=0;i<localCount+guestCount;i++){
      const visitor=i>=localCount,index=visitor?i-localCount:i,origin=visitor?choices[index]:undefined;
      const race=origin?.ancestry??native,region=origin?.region??town.regionId;
      // Human travelers use winter clothing in cold hosts, without turning
      // visitors into the host's race. Elf/orc/dwarf silhouettes stay approved.
      const visualRegion=race==='human'&&['frostlands','nardorous'].includes(town.regionId)?town.regionId:region;
      const point=(visitor?guests:locals)[index],side=index%2?1:-1;
      const ward=settlementWardName(town.id,side),id=`folk:${town.id}:${visitor?'visitor':'local'}:${index}`;
      const title=visitor?origin!.role:p.trades[index];
      let name=(visitor?p.guests:p.locals)[index];
      if(usedNames.has(name))name+=` of ${town.name}`;usedNames.add(name);
      const spriteTexture=!visitor?texture(race,index):race==='elf'?'npc_elven_woman_idle'
        :race==='dwarf'?'npc_blacksmith':race==='orc'?'npc_adventurer'
        :index===3||town.id==='moonfall'?'npc_attendant':'npc_adventurer';
      created.push({id,name,title,townId:town.id,ancestry:race,visualRegion,visitor,settlementResident:true,
        districtId:`ward:${town.id}:${side===-1?0:1}`,spriteFrame:0,spriteTexture,
        worldOffset:point,homeLocation:{...point},stationary:true,patrolRadius:0,
        role:visitor?`A peaceful ${race} visitor from ${region}, trading with ${ward}'s households`:`Supplies ${ward}'s households as a ${title.toLowerCase()}`,
        faction:visitor?'Free Road Traders':ward+' household compact',family:name.split(' ').slice(1).join(' '),
        connections:[{npcId:p.contact,relationship:visitor?'Local sponsor and trade contact':'Local work partner and household representative'}],
        relationshipToLeigneron:{kind:'acquaintance',trust:visitor?38:50,
          summary:visitor?`Has heard of Leigneron from the relief-road traders and hopes he will keep travelers safe in ${town.name}.`
            :`Knows Leigneron through ${town.name}'s supply households and values his family's roadwarden ties.`},
        dialoguePersonality:visitor?'Curious, polite; compares local customs with home':'Practical, welcoming and proud of the neighborhood',
        schedule:[{startHour:6,activity:visitor?'Receives local trade orders':'Sets out household supplies',location:point},
          {startHour:12,activity:visitor?'Exchanges news with local residents':'Meets neighbors in the work court',location:point},
          {startHour:20,activity:visitor?'Keeps a quiet travelers watch':'Tends the sheltered household court',location:point}],
        dialogue:visitor?[`I came from ${region} to trade, not to take anyone's place. The people of ${town.name} showed me where guests are welcome.`,
          `The ${ward} households need reliable roads as much as I do. I keep my goods off their paths.`]
          :[`I am the ${title.toLowerCase()} here. ${ward} is a working neighborhood, not just a place for passing carts.`,
            'Newcomers bring useful goods and news. The households still keep the wells, gardens and common paths together.'],
        storyConsequences:['Supply shortages change the household trade outlook; remains a peaceful civilian and grants no combat or quest rewards.'],questIds:[]});
    }
    for(const n of created){const partner=created.find(other=>other.id!==n.id&&other.visitor!==n.visitor);
      if(partner)n.connections!.push({npcId:partner.id,relationship:n.visitor?'Welcoming household trading partner':'Visiting supplier and news contact'});}
    result.push(...created);SETTLEMENT_POPULATIONS[town.id]={native:nativeCount,visitors:oldVisitors+guestCount,addedLocals:localCount,addedVisitors:guestCount};
  }
  return result;
}
