import type {NpcDefinition} from '../game/types';
import {WILDERNESS_SITES} from './wildernessSites';
import {TOWN_BY_ID} from './towns';
export const ROAD_RESIDENTS:NpcDefinition[]=[
  {id:'eda-ashfield',name:'Eda Ashfield',title:'Relief Wagon Factor',townId:'oakmere',spriteTexture:'npc_adventurer',spriteFrame:0,
    role:'Keeps the charter-road resting stop supplied and explains why the capital must hear household reports',
    worldOffset:{x:0,y:0},homeLocation:{x:0,y:0},family:'Torren’s older sister; negotiated the Oakmere relief wagons',faction:'Crown Road Carriers',
    connections:[{npcId:'torren-ashfield',relationship:'Younger brother and caravan partner'},{npcId:'renna-vale',relationship:'Files the road-carrier accounts'}],
    relationshipToLeigneron:{kind:'family-friend',trust:61,summary:'Let Leigneron ride beside the driver while Aldren taught him to read the old mile stones'},
    dialoguePersonality:'Observant, warm, skeptical of official promises without deliveries',patrolRadius:60,
    schedule:[],dialogue:['Aldren’s road mark is just north of the highway. Read it before Highmere’s officials tell you what they think it means.','Torren keeps the wagons moving. Renna keeps the promises in writing. You will need both.'],questIds:[],
    storyConsequences:['Acknowledges the regional public inquiry through the existing main-story dialogue context']},
  {id:'lysa-thorneleaf',name:'Lysa Thorneleaf',title:'Greenward Field Scribe',townId:'elarion',spriteTexture:'npc_huntress',spriteFrame:0,
    role:'Records the ruined ward inscriptions and maintains a peaceful field camp for the forest inquiry',
    worldOffset:{x:0,y:0},homeLocation:{x:0,y:0},family:'Ilyra’s niece; apprenticed in the living archive',faction:'Whitebough Lorekeepers',
    connections:[{npcId:'elarion-lorekeeper',relationship:'Aunt and lore teacher'},{npcId:'elarion-bowyer',relationship:'Supplies her field arrows'}],
    relationshipToLeigneron:{kind:'acquaintance',trust:48,summary:'Knows Aldren’s survey marks from the report Leigneron carries'},
    dialoguePersonality:'Quiet, exact, protective of the ancient grove',patrolRadius:48,weaponId:'narenthil-longbow',combatant:true,
    schedule:[],dialogue:['The old words say keeper, not conqueror. Ilyra wants the inscriptions recorded before another battle destroys them.','The forest road is kept clear here. Leave the roots and flowers to either side.'],questIds:[],
    storyConsequences:['The Greenward discovery stays in the saved regional inquiry even if this camp streams out']},
];
for(const [i,npc] of ROAD_RESIDENTS.entries()){
  const site=WILDERNESS_SITES.find(s=>s.id===(i===0?'royal-waystone':'greenward-ruin'))!,town=TOWN_BY_ID[npc.townId];
  const work={x:site.world.x-town.world.x+100,y:site.world.y-town.world.y+50},home={x:work.x+80,y:work.y+40};
  npc.worldOffset=work;npc.homeLocation=home;
  npc.schedule=[{startHour:6,activity:'Maintains the roadside field stop',location:work},{startHour:17,activity:'Checks the camp stores',location:home},{startHour:22,activity:'Keeps the sheltered camp watch',location:home}];
}
