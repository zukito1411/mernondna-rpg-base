import type { NpcDefinition } from '../game/types';

/** Civilian witnesses, not disposable combat targets. Existing approved models. */
export const STORY_RESIDENTS: NpcDefinition[] = [
  {
    id:'lena-cartwright',name:'Lena Cartwright',title:'Oakmere Seed Carter',townId:'oakmere',
    ancestry:'human',spriteTexture:'npc_villager',spriteFrame:0,stationary:true,
    worldOffset:{x:2200,y:-700},homeLocation:{x:500,y:100},
    storyReturn:{questId:'first-road',objectiveId:'seed-return',position:{x:-660,y:420}},
    role:'Survivor of the seed-cart ambush; records what Varr took and carries the recovered seed home',
    family:'Daughter of Oakmere millers; widowed mother of two',faction:'Crown Road Carriers',
    connections:[{npcId:'torren-ashfield',relationship:'Employs her as a wagon driver'},
      {npcId:'nella-brook',relationship:'Her seed delivery keeps the spring fields planted'},
      {npcId:'sena-marrow',relationship:'Shelters her children when she travels'}],
    relationshipToLeigneron:{kind:'family-friend',trust:58,summary:'Let Leigneron ride her empty grain wagon home after his first failed hunting trip'},
    schedule:[{startHour:0,activity:'Shelters beside the ambushed cart until the road is secured'}],
    dialoguePersonality:'Frightened but observant; thinks first of her children and the growers',
    dialogue:['They took the seed sacks, but left the harness. Nobody came here for a horse.',
      'I hid beside the cart. Please clear the men watching the road before you go to their captain.'],
    questIds:[],storyConsequences:['Returns to the Oakmere road court after the rescue; remembers Leigneron protecting her rather than chasing a captain'],
  },
  {
    id:'bruni-stonevein',name:'Bruni Stonevein',title:'Rootwater Surveyor',townId:'deepford',
    ancestry:'dwarf',visualRegion:'druganwoods',spriteTexture:'npc_general',spriteFrame:0,stationary:true,
    worldOffset:{x:3000,y:2400},homeLocation:{x:0,y:0},faction:'Deepford Mining Guild',
    storyReturn:{questId:'eight-regions',objectiveId:'mine-account',position:{x:480,y:250}},
    family:'Runesmith Stonevein’s younger cousin',role:'Trapped spring surveyor who witnessed the broken mine seal',
    connections:[{npcId:'deepford-runesmith',relationship:'Cousin and keeper of her survey records'},
      {npcId:'deepford-boatwright',relationship:'Commissions river gauges and keeps a place for her at supper'}],
    relationshipToLeigneron:{kind:'acquaintance',trust:46,summary:'Remembers his mother bringing flour to a stranded mining crew'},
    schedule:[{startHour:0,activity:'Shelters at the Rootwater survey while hungry spirits hold the approach'}],
    dialoguePersonality:'Precise, dry humor under pressure; refuses to blame the forest for human mistakes',
    dialogue:['The spring did not move. Somebody moved its seal. There is a difference.',
      'I can leave when the spirits stop watching the path. My cousin must see the survey.'],questIds:[],
    storyConsequences:['Returns to Deepford after the spring rescue; supplies evidence for the ward repair'],
  },
];
