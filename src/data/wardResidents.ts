import type {NpcDefinition} from '../game/types';
import {wardActivityPoints,settlementWardName} from './settlementWards';
import type {SettlementProfileId} from './settlementProfiles';

interface Household {
  townId:SettlementProfileId; names:readonly [string,string];
  titles:readonly [string,string]; contacts:readonly [string,string];
  histories:readonly [string,string]; lines:readonly [string,string];
  companions:readonly [string,string];
}
// Named households with connections to the existing cast. These are ordinary
// residents, not replacement quest givers or randomly named crowd particles.
const households:Household[]=[
  {townId:'oakmere',names:['Bess Brook','Harlan Pike'],titles:['Orchard Baker','Wainwright'],contacts:['nella-brook','joren-pike'],
    histories:['Nella’s sister; gave Leigneron bread while he helped bring in the apple harvest','Joren’s cousin; taught Leigneron how to replace a wagon pin'],
    lines:['The orchard feeds our ovens. Keep the harvest lane open and there is enough bread for travelers too.','A cart yard belongs beside a road, not across one. Joren sends his iron rims here for fitting.'],companions:['Tessa Brook','Willem Pike']},
  {townId:'highmere',names:['Edith Loom','Corin Brass'],titles:['Weavers Elder','Guild Provisioner'],contacts:['mairin-reed','osric-flint'],
    histories:['Mairin’s longtime cloth supplier; patched Leigneron’s cloak after an Oakmere relief journey','Osric’s former apprentice; remembers Leigneron carrying Aldren’s guild delivery'],
    lines:['A weaver needs light, a dry yard and neighbors who will share a well. The kitchens still receive our offcuts.','The eastern commons has room to turn a wagon. Keep the fine streets for people and the work yards for freight.'],companions:['Judit Loom','Perrin Brass']},
  {townId:'willowcross',names:['Anwen Reed','Fenn Marr'],titles:['Drovers Host','Arrowwood Cutter'],contacts:['willowcross-keeper','willowcross-fletcher'],
    histories:['Pella’s cousin; remembers Aldren and Leigneron bedding down the relief horses here','Tovan’s brother; carried Mira’s first bundle of straight arrowwood'],
    lines:['Horses drink before their riders bargain. The green lets incoming wagons wait without closing the bridge road.','Tovan wants straight grain, not a forest stripped bare. Our stored wood is seasoned behind the workshops.'],companions:['Bran Reed','Tilda Marr']},
  {townId:'elarion',names:['Lethra Thorneleaf','Aerin Virdan'],titles:['Healing Garden Keeper','Livingwood Steward'],contacts:['elarion-lorekeeper','elarion-bowyer'],
    histories:['Ilyra’s sister; remembers Leigneron asking which trees Aldren had sworn to protect','Sael’s cousin; exchanged fallen bowwood for Mira’s field reports'],
    lines:['The paths bend around old roots. A healing garden need not become a bare stone square.','The terrace takes only fallen wood. Our gardens are work, not unused land waiting for axes.'],companions:['Melwen Thorneleaf','Talan Virdan']},
  {townId:'moonfall',names:['Miren Vale','Olan Mosswalk'],titles:['Moonherb Grower','Pilgrim Host'],contacts:['moonfall-herbalist','moonfall-ranger'],
    histories:['Neris’s cousin; supplied the poultices Aldren brought home to Leigneron','Eren’s brother; sheltered Leigneron’s parents on their old pilgrimage'],
    lines:['Leave the narrow herb beds alone and use the gathering green. Neris still dries our harvest herself.','A quiet village needs sheltered homes as much as standing stones. Pilgrims rest beside the shared well.'],companions:['Edda Vale','Sorel Mosswalk']},
  {townId:'starhold',names:['Tova Skell','Marek Halla'],titles:['Pass Ropemaker','Winter Storekeeper'],contacts:['starhold-quartermaster','starhold-templar'],
    histories:['Borin’s sister; packed rope for Aldren’s patrol while Leigneron counted the coils','Halla’s childhood friend; helped carry Oakmere medicine to the infirmary'],
    lines:['The terrace keeps coils dry and caravans out of the house lanes. Borin rejects every frayed length.','Snow does not excuse an empty pantry. The winter ward shares fuel, shelter and a clear road to the beacon.'],companions:['Nils Skell','Freya Halla']},
  {townId:'redmesa',names:['Raga Flintmane','Bren Ashhand'],titles:['Clan Fodder Keeper','Riders Toolwright'],contacts:['redmesa-beastmaster','redmesa-forgewright'],
    histories:['Ugra’s cousin; traded feed with Aldren while Leigneron held the wagon tally','Dorga’s brother; helped straighten Leigneron’s storm-damaged family cart'],
    lines:['Pens, fodder and sleeping houses need separate space. Ugra keeps the riders off the garden lanes.','The work yard is stone so a fallen coal does not burn somebody’s roof. Dorga insists on that.'],companions:['Ulen Flintmane','Morga Ashhand']},
  {townId:'deepford',names:['Durin Stonevein','Bera Copperwake'],titles:['Masons Foreman','Boat Fittings Trader'],contacts:['deepford-runesmith','deepford-boatwright'],
    histories:['Mara’s cousin; supplied stone for the relief road Aldren showed Leigneron','Thrain’s sister; provisioned the ferry that carried Torren through the flood'],
    lines:['Masons live near their work, not in the ore piles. Mara marks the load limits before we send a cart.','A boat needs a thousand small fittings. Thrain buys them here before anything reaches the quay.'],companions:['Kelda Stonevein','Orik Copperwake']},
  {townId:'tidewatch',names:['Mella Gull','Tarin Vane'],titles:['Netmenders Elder','Ship Chandler'],contacts:['tidewatch-harbor-master','tidewatch-sailmaker'],
    histories:['Jessa’s sister; packed dried food for the medicine ship sent to Oakmere','Orren’s cousin; remembers the weatherproof cloak commissioned for Mira'],
    lines:['Nets dry in the close, fish go to the quay. Jessa does not allow either to block the cargo street.','Canvas, rope and lamps belong in dry stores. Orren sends crews here before they trouble the harbor office.'],companions:['Lysa Gull','Owen Vane']},
  {townId:'skallheim',names:['Signe Icevein','Halvor Harrow'],titles:['Pine Carpenter','Fishcurers Keeper'],contacts:['skallheim-hunter','skallheim-trader'],
    histories:['Runa’s sister; repaired the shelter used by Aldren’s blizzard-bound caravan','Eyvind’s brother; preserved the fish carried west with Aldren’s letters'],
    lines:['A sheltered lane is worth more than a grand empty court in winter. Runa’s hunters warm themselves here.','Curing yards need air, households need shelter. The fish stores stay apart from the longhouse doors.'],companions:['Astrid Icevein','Leif Harrow']},
  {townId:'blackspire',names:['Kora Cinder','Rell Emberfall'],titles:['Chainwright Elder','Furnace Supplier'],contacts:['blackspire-forgemaster','blackspire-warder'],
    histories:['Vexa’s cousin; knows why Vexa refused the raid contract against Aldren’s people','Dain’s brother; has read the roadwarden letters Leigneron carries'],
    lines:['The chainworkers deserve homes away from the loading furnace. Vexa sees that the guild keeps its promise.','Fuel wagons use the broad street. Dain keeps the ash cleared from the foot lanes so families can get home.'],companions:['Dessa Cinder','Enna Emberfall']},
  {townId:'cibar-plains',names:['Wenna Brook','Toren Copperwake'],titles:['Seedkeepers Steward','Waterturn Carpenter'],contacts:['celia-brook','iren-copperwake'],
    histories:['Celia’s cousin; helped load the seed sacks Leigneron carried for Nella','Iren’s brother; remembers Aldren inspecting the first irrigation gates'],
    lines:['Seed stays in dry family stores, and the crofts share a harvest lane. Celia keeps our allotments on the public tally.','Repair tools belong near the water keepers. Iren will not let a private yard close the common access lane.'],companions:['Mara Brook','Nerin Copperwake']},
];
const slug=(name:string)=>name.toLowerCase().replaceAll(' ','-');
export const WARD_RESIDENTS:NpcDefinition[]=households.flatMap(h=>{
  const residents:NpcDefinition[]=[];
  for(const side of [-1,1] as const){
    const i=side===-1?0:1,points=wardActivityPoints(h.townId,side),ward=settlementWardName(h.townId,side);
    const id=slug(h.names[i]),companionId=slug(h.companions[i]);
    residents.push({id,name:h.names[i],title:h.titles[i],townId:h.townId,districtId:`ward:${h.townId}:${i}`,spriteFrame:0,
      spriteTexture:side===1&&['forge','tool','carpenter'].some(word=>h.titles[i].toLowerCase().includes(word))?'npc_blacksmith':'npc_villager',
      worldOffset:points.work,homeLocation:points.home,patrolRadius:48,
      role:`Keeps ${ward}'s working households supplied; explains its local trade and public paths`,
      faction:ward+' household compact',family:h.histories[i],
      connections:[{npcId:h.contacts[i],relationship:'Family or longstanding work partner'},{npcId:companionId,relationship:'Household apprentice and delivery partner'}],
      relationshipToLeigneron:{kind:'acquaintance',trust:52,summary:h.histories[i]},
      dialoguePersonality:side===-1?'Warm, practical, protective of neighbors':'Direct, precise about work and shared access',
      schedule:[{startHour:5,activity:'Checks the home court',location:points.home},{startHour:8,activity:h.titles[i]+' work',location:points.work},
        {startHour:17,activity:'Meets neighbors at the ward green',location:points.social},{startHour:21,activity:'Returns to the household court',location:points.home}],
      dialogue:[h.histories[i]+'.',h.lines[i]],questIds:[],
      storyConsequences:['Relief and supply shortages affect this household; existing regional contacts remain the story authorities'],
    });
    // A second resident gives the same neighborhood a delivery/gathering rhythm
    // without crowding the worker's standing point or inventing a new quest.
    const home={x:points.home.x,y:points.home.y-80},work={x:points.work.x+side*150,y:points.work.y+12};
    residents.push({id:companionId,name:h.companions[i],title:side===-1?'Household Provisioner':'Ward Delivery Runner',townId:h.townId,districtId:`ward:${h.townId}:${i}`,spriteFrame:0,
      spriteTexture:side===-1?'npc_attendant':'npc_adventurer',worldOffset:home,homeLocation:home,patrolRadius:40,
      role:`Carries supplies between the homes and work courts of ${ward}`,faction:ward+' household compact',family:`Shares ${h.names[i]}'s household and helps maintain its work yard`,
      connections:[{npcId:id,relationship:'Household elder and work mentor'},{npcId:h.contacts[i],relationship:'Receives the regional household deliveries'}],
      relationshipToLeigneron:{kind:'acquaintance',trust:46,summary:`Knows Leigneron through ${h.names[i]}'s account of ${h.histories[i].split(';')[1]?.trim()??'the old relief roads'}`},
      dialoguePersonality:'Curious, busy, proud of the neighborhood',
      schedule:[{startHour:6,activity:'Collects household orders',location:home},{startHour:10,activity:'Makes local deliveries',location:work},
        {startHour:18,activity:'Returns through the gathering green',location:{x:points.social.x,y:points.social.y+80}},{startHour:22,activity:'Rests in the home court',location:home}],
      dialogue:[`${h.names[i]} taught me this trade. We keep the work courts stocked without leaving carts across the street.`,
        `${ward} is home, not merely somewhere to pass through. The shared well and gardens belong to all our neighbors.`],questIds:[],
      storyConsequences:['The household follows its existing regional supply network; no new quest progress is awarded by ambient dialogue'],
    });
  }
  return residents;
});
