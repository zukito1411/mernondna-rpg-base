import type {NpcDefinition} from '../game/types';

// Dedicated indoor sentries: never borrow the marching formation or gate watch.
const households=[
  ['highmere','Crown Hall','Crown Watch','captain-yselle-ward','npc_royal_guard','oak-shield-blade','Edric Amberwatch','Joan Cedarshield'],
  ['starhold','Citadel Hall','Pass Watch','starhold-quartermaster','npc_general','oak-shield-blade','Alaric Craghelm','Bertram Snowmantle'],
  ['redmesa','Clan Assembly Hall','Mesa Household Watch','redmesa-beastmaster','npc_general','roadwarden-sword','Goruk Sunclaw','Drazh Copperfang'],
  ['deepford','Great River Hall','River Hall Watch','deepford-runesmith','npc_general','oak-shield-blade','Durin Brookanvil','Bram Silverrivet'],
  ['skallheim','Clan Longhouse','Winter Household Watch','skallheim-hunter','npc_general','oak-shield-blade','Oswald Iceharbor','Leofric Snowwick'],
  ['blackspire','Obsidian Citadel','Ash Ward Watch','blackspire-warder','npc_general','roadwarden-sword','Ansel Cinderwatch','Godric Ashlance'],
] as const;
export const CASTLE_GUARD_POSTS: Array<{npcId:string;building:string;side:'west'|'east'}>=[];
export const CASTLE_RESIDENTS:NpcDefinition[]=households.flatMap(([townId,building,faction,contact,spriteTexture,weaponId,west,east])=>{
  return [west,east].map((name,index):NpcDefinition=>{
    const side=index===0?'west':'east',id=`${townId}-interior-${side}-sentry`;
    CASTLE_GUARD_POSTS.push({npcId:id,building,side});
    return {id,name,townId,title:building+' Sentry',districtId:'household-hall',
      role:`Keeps the ${side} entrance gallery of ${building} clear and protects household visitors`,
      spriteTexture,spriteFrame:0,worldOffset:{x:0,y:0},homeLocation:{x:0,y:0},
      stationary:true,patrolRadius:0,combatant:true,weaponId,faction,family:name.split(' ').at(-1),
      connections:[{npcId:contact,relationship:'Reports visitors and household security concerns'},
        {npcId:`${townId}-interior-${index===0?'east':'west'}-sentry`,relationship:'Shares the gallery watch and meal rotation'}],
      schedule:[{startHour:6,activity:`Stands watch in the ${side} entrance gallery`},
        {startHour:18,activity:'Keeps the night household watch; meals are brought from the kitchen'}],
      relationshipToLeigneron:{kind:'acquaintance',trust:40,
        summary:'Knows Leigneron through the roadwarden reports brought to the household, but waits for personal evidence of his reliability.'},
      dialoguePersonality:'Quiet, courteous and practical; gives directions before warnings.',
      storyConsequences:['Remains at the household watch during regional emergencies; reports the danger without becoming a hostile civilian.'],
      dialogue:index===0?['The hall’s just through there. Someone will show you where to sit.',
        'I’ve been standing here since morning. My feet are killing me.']
        :['If you’re here for an audience, go through the gallery. The kitchen’s the other way.',
          'They’ve been cooking something good all morning. I’m counting the minutes until my break.'],questIds:[]};
  });
});
