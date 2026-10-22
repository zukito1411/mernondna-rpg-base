import type { QuestDefinition, QuestObjective } from '../game/types';
import { NPC_BY_ID, NPC_NAME_ALIASES } from './npcs';
import { rewriteNpcMentions } from './npcPresentation';

export const CAMPAIGN_REVISION_FLAG='campaign:roadborn-v2';
export const COMBAT_CLEARANCE_REVISION_FLAG='campaign:combat-clearances-v2';
export const INDOOR_STORY_FLAG='campaign:household-stories-v1';
export const INDOOR_STORY_STAGES:Record<string,string[]>={
  'first-road':['caravan-hearth'],
  'eight-regions':['pilgrims-hearth'],
};
const who=(id:string)=>NPC_BY_ID[id].name;
const speak=(id:string,npc:string,text:string,lines:string[],type:'talk'|'deliver'='talk'):QuestObjective=>
  ({id,type,targetId:npc,amount:1,text,dialogue:lines});
const inspect=(id:string,target:string,text:string,contentId=target):QuestObjective=>
  ({id,type:'investigate',targetId:target,contentId,amount:1,text});
const site=(id:string,target:string,text:string)=>inspect(id,target,text,'discovery:'+target);
const clear=(id:string,prefix:string,enemies:string[],amount:number,text:string):QuestObjective=>
  ({id,type:'kill',targetId:enemies[0],enemyIds:enemies,killContentPrefix:prefix,amount,text});
const decision=(id:string,npc:string,text:string,line:string,choices:NonNullable<QuestObjective['choices']>):QuestObjective=>
  ({id,type:'choice',targetId:npc,amount:1,text,dialogue:[line],choices});
const depends=(id:string,target:string,text:string):QuestObjective=>({id,type:'quest',targetId:target,amount:1,text});

/** Stable legacy IDs surround new playable stages; saves migrate, not restart. */
export function applyCampaign(quests:QuestDefinition[]) {
  const get=(id:string)=>quests.find(q=>q.id===id)!;
  const first=get('first-road');
  first.kind='main';first.chapter='Act I · The road that raised you';
  first.summary='Leigneron was raised in Oakmere by a retired roadwarden after his parents failed to return from a relief journey. A familiar compass and a frightened seed carter turn a village errand into a choice: chase the past, or protect the people still here.';
  first.resolution='The carter is safe, the seed road has a watch, and the stolen survey bears your mother’s handwriting. The grain-office seal leads to Highmere—not yet to an answer about your family.';
  first.objectives=[
    speak('talk-aldren','aldren-vale',`Begin the morning with ${who('aldren-vale')} in Oakmere.`,[
      'Your mother taught you how to fix a wagon before you could even lift that sword. You used to complain about it all the time.',
      'When your parents didn’t come back, you asked me why. I didn’t know what to tell you. I still don’t.',
      'Lena’s cart is late. Sena might have heard something at the inn. Could you ask her? I’m worried.']),
    speak('morning-inn','sena-marrow','Ask at Marrow Inn about the missing seed cart.',[
      'Your mother used to sit right here with you asleep against her arm. I still remember how tired she looked.',
      'Lena left before dawn and hasn’t come back. Her children keep asking for her. Please tell me if you hear anything.']),
    speak('caravan-hearth','torren-ashfield',`Visit ${who('torren-ashfield')} at the West Cottages before taking the road.`,[
      'Come in. The kettle’s still warm. You used to fall asleep by that fire when you were little.',
      'Your father was good at packing a wagon. Could never find his gloves, though. Your mother was forever finding them for him.',
      'Varr used to guard our wagons. He knows exactly which ones carry the seed. Alice went looking for tracks near the farms. She might know where Lena is.']),
    speak('field-witness','mira-fen','Compare Mira’s tracks with the innkeeper’s account.',[
      'I found Lena’s wagon east of the farms. Three men are guarding it. I think she’s hiding nearby.',
      'We’ll deal with Varr later. Right now, let’s get Lena home safely.']),
    speak('blade-check','joren-pike','Visit Pike Smithy before leaving Oakmere.',[
      'I’ve fixed that sword so many times I could do it with my eyes closed. Try not to break it again.',
      'If someone comes at you, move first. Don’t stand there trading blows. And please come back in one piece.']),
    clear('free-seed-cart','story-camp:seed-cart:',['road-bandit'],3,'Defeat the three bandits surrounding Lena’s seed cart.'),
    speak('lena-safe','lena-cartwright','Check that Lena survived the ambush.',[
      'Thank you for coming. I thought they were going to kill me. One of them kept searching my map. He didn’t even want the money.',
      'They cut all the grain sacks open. There’s something by the cart they left behind. Can you see what it is? I just want to go home.']),
    inspect('cart-evidence','story:seed-cart','Examine the slashed seed sacks beside the rescued carter.'),
    speak('seed-return','nella-brook','Tell the growers what happened to their spring seed.',[
      'We can plant if the next wagon gets through. If not, I don’t know how we’re going to feed everyone.',
      'Your mother always helped us when the harvest was bad. I wish she could see you looking after Lena.'],'deliver'),
    decision('roadwardens-choice','aldren-vale','Tell your mentor why you will take the road.',
      'I know you want answers about your parents. I do too. Just don’t forget there are people here who need you.',[
        {id:'people',text:'I want Lena’s children to stop waiting in fear.',response:'Good. Those children have been through enough already.',flag:'leigneron-protector'},
        {id:'answers',text:'I need answers about my family—but I will not leave others behind.',response:'I understand. Just promise you’ll come back safe.',flag:'leigneron-seeker'},
      ]),
    speak('watch-plan','elara-voss','Arrange a road watch with Oakmere’s guard captain.',[
      'I’m glad Lena’s safe. I’ll move two guards to the farms. We can’t have this happening again.',
      'Varr used to work for the caravans. He knows our routes. Someone must’ve paid him. I heard there are papers near the tower that might tell us who.']),
    {...inspect('tower-dispatch','story:varr-orders','Read Varr’s dispatch outside the watchtower.'),cinematicId:'varr-before'},
    {...first.objectives.find(o=>o.id==='kill-varr')!},
    inspect('recover-seal','story:varr-cargo','Recover the royal seal and marked survey from the tower cargo.'),
    speak('compass-question','orin-bell','Show the survey’s compass carving to the shrine keeper.',[
      'I’ve seen marks like the one on your compass in the old shrine records. I didn’t expect to see one still working.',
      'The needle reacts near the ward-stones. Whoever stole the survey may have been looking for them. Highmere’s archive might have more records.']),
    speak('return-aldren','aldren-vale','Return with the recovered seal and your mother’s survey.',[
      'I know your mother’s handwriting. She made these maps to help people find water and shelter. Why would anyone steal them?',
      'Renna at the Highmere archive might know whose seal this is. Tell her everything. I don’t like what we’re finding.',
      'And Leigneron? Come home when you can. I’ll be here.']),
  ];
  for(const [id,xp] of [['morning-inn',25],['blade-check',35],['lena-safe',80],['watch-plan',60]] as const)
    first.objectives.find(o=>o.id===id)!.rewardXp=xp;
  get('crown-summons').kind='main';get('crown-summons').chapter='Act II · Bread and authority';
  get('crown-summons').objectives.splice(get('crown-summons').objectives.findIndex(o=>o.id==='audience'),0,
    depends('relief-charter','kingdom-divided','Secure a lasting relief agreement for the kitchens, not merely a conviction.'));
  const shadows=get('shadows-highmere');shadows.prerequisiteQuestId='first-road';shadows.kind='main';shadows.chapter='Act II · A witness worth saving';
  shadows.resolution='Tovin returned through the Lower Ward alive. The stolen tally exposed the grain office, and your choice determines how his testimony is protected.';
  get('kingdom-divided').kind='main';get('kingdom-divided').chapter='Act II · The price of bread';
  get('kingdom-divided').resolution='The merchants and kitchens have a written agreement; justice must now survive beyond a single arrest.';
  get('royal-guard-trial').kind='side';get('royal-guard-trial').prerequisiteQuestId='first-road';
  get('royal-guard-trial').objectives.find(o=>o.id==='art')!.text='Reach level 5, then demonstrate Azure Cleave at the practice dummy.';
  get('water-stops').kind='side';get('water-stops').prerequisiteQuestId='crown-summons';

  const regional=get('eight-regions'),kills=new Map(regional.objectives.filter(o=>o.bossId).map(o=>[o.id,o]));
  const objectives:QuestObjective[]=[];
  const chapter=(title:string,stages:QuestObjective[])=>objectives.push(...stages.map(o=>({...o,chapter:title})));
  const boss=(id:string)=>({...kills.get(id)!,cinematicId:'campaign-'+id+'-after'});
  const report=(town:string,npc:string,lines:string[],xp:number)=>({...speak('report:'+town,npc,`Return the chapter’s evidence to ${who(npc)}.`,lines),rewardXp:xp});
  regional.kind='main';regional.chapter='Act III–IV · The roads remember';regional.nextQuestId='the-last-ward';
  regional.summary='Your family’s relief survey connects the living wards of Mernodna. Follow it to people who remember them: roots, mountain beacons, clan wells, mine springs and sea signals. Learn who broke those protections—and what must replace them.';
  regional.resolution='The witnesses agree: ward iron was sold as scrap under a stolen crown seal. Each region has offered its own repair, but Darkav’s furnace and Varkhul stand between their promises and a working covenant.';
  chapter('Narenthil · A guardian’s grief',[
    speak('brief:elarion','elarion-lorekeeper','Ask the Lore Archive why its guardian turned against travelers.',[
      'Your parents passed through here once. They mapped the spring without damaging anything. We were grateful for that.',
      'The Warden wasn’t always dangerous. Someone took iron from the grove. Lysa’s been looking at the damaged stones.']),
    speak('bowyer-witness','elarion-bowyer','Hear the bowyer’s account of the blighted road.',[
      'The thornlings started appearing after the iron was removed. I can keep them off the path, but I can’t fix whatever happened to the roots.',
      'The Greenward clearing’s full of them. The searchers can’t get through.']),
    site('evidence:elarion','greenward-ruin','Record the empty iron socket at the Greenward Stones.'),
    clear('greenward-clear','creature:blighted-thornling:greenward-ruin:',['blighted-thornling'],3,'Clear the three blighted thornlings beside Greenward.'),
    speak('field-scribe','lysa-thorneleaf','Compare the cleared stone with the field scribe’s copy.',[
      'Someone cut the iron out with a tool. It wasn’t broken by the creatures. That’s what worries me.',
      'Neris at Moonfall knew some of the missing pilgrims. She might be able to help.']),
    speak('moonfall-remedy','moonfall-herbalist','Ask Moonfall’s herbalist how to approach the wounded grove.',[
      'I remember treating Edmund when he passed through. He was a terrible patient. Always wanted to leave before he was well.',
      'The pilgrims tied ribbons near the grove. Some might still be there. But the path’s full of spiders now.']),
    speak('pilgrims-hearth','dael-vale',`Speak with ${who('dael-vale')} inside the Grove House.`,[
      'Put your cloak by the fire. Edmund used to sit right there, shivering and pretending he wasn’t cold.',
      'The pilgrims used to come here every evening. The children picked ribbons for the grove. I miss hearing them running around.',
      'The last group had black water on their boots. They were frightened. I don’t think they did anything to hurt the grove.']),
    site('pilgrim-record','moon-pilgrim-grove','Read the pilgrims’ marks in the Moon Pilgrims’ Clearing.'),
    clear('grove-nests','creature:grove-spider:moon-pilgrim-grove:',['grove-spider'],3,'Clear the three hostile spiders at the pilgrims’ shaded approach.'),
    {...decision('grove-oath','elarion-lorekeeper','Agree how Narenthil’s ward should be restored.',
      'We can help repair the grove after this is over. Should our keepers look after it, or do you think the road watch should help too?',[
        {id:'keepers',text:'Let the grove’s keepers tend its roots; publish the safe paths.',response:'All right. Our lorekeepers can take care of the stones. We’ll keep the paths open.',flag:'narenthil-grove-keepers'},
        {id:'watch',text:'Build a shared watch with the travelers who use the road.',response:'The bowyers can help the watch. I’d feel better if they worked together.',flag:'narenthil-shared-watch'},
      ]),cinematicId:'warden-before'},boss('moonlit-warden'),
    report('elarion','elarion-lorekeeper',[
      'The Warden’s quiet now, for a while. We know what happened to the stone. I wish we’d found it sooner.',
      'I found the same mark on an old beacon drawing from Starhold. I’ll make you a copy. Your parents traveled there once too.'],160),
  ]);
  chapter('Nardorous · A light through snow',[
    speak('brief:starhold','starhold-quartermaster','Learn which winter wagon failed to reach Starhold.',[
      'Stonejaw scared off the horses, and the porters haven’t all returned. I’m afraid they’re caught in the storm.',
      'Halla’s got the list of missing porters. She might know where they were last seen.']),
    speak('porter-names','starhold-templar','Learn whether the missing mountain porters reached shelter.',[
      'One of the porters made it back, but he could barely hold his satchel. He was freezing.',
      'He left his journal near the beacon. I think he wrote down what happened before the signal went out.']),
    site('evidence:starhold','pass-beacon','Read the broken beacon’s three signal marks.'),
    inspect('recover-beacon-kit','story:beacon-kit','Recover the relief satchel beside the mountain beacon.'),
    speak('deliver-beacon-kit','starhold-quartermaster','Deliver the porter’s signal oil and journal.',[
      'That’s the oil we needed. Good. We can get the beacon lit again.',
      'His journal says they were meant to wait for the ridge signal. Can you tell me what went wrong?'],'deliver'),
    {id:'mountain-code',type:'puzzle',targetId:'starhold-quartermaster',amount:1,text:'Interpret the porter’s safe passage sequence.',dialogue:['The signal times are written here. Which one do you think the wagons were meant to follow?'],choices:[
      {id:'signal',text:'Wait for the ridge signal; take the sheltered pass together.',response:'That’s right. They should’ve waited and gone together.',flag:'mountain-safe-signal',correct:true},
      {id:'rush',text:'Send each wagon through before the signal.',response:'No, that would split them up. Take another look at the journal.',flag:'',correct:false},
    ],cinematicId:'stonejaw-before'},boss('stonejaw'),
    report('starhold','starhold-quartermaster',[
      'The road’s open again. We’re keeping someone at the beacon every night. I don’t want to lose another convoy.',
      'There’s the same mark on the beacon as the stone from the grove. Some of our iron shipments went to Red Mesa. Maybe they know more.'],200),
  ]);
  chapter('Rindass · Water is not a throne',[
    speak('brief:redmesa','redmesa-beastmaster','Hear the clans’ account of Krag’s seizure of their wells.',[
      'Krag says anyone outside his clan is an enemy. Please don’t believe him. Most of us just want our families safe.',
      'His men took the well and the southern shelter. Dorga found something wrong with the water. She’s been trying to figure it out.']),
    speak('well-forge','redmesa-forgewright','Ask the Clan Forge about the well’s missing iron.',[
      'I remember fixing your family’s cart. Your parents helped me around the forge when they couldn’t afford to pay.',
      'Someone sold the iron from our well. The water went bad, and Krag started charging people for protection. It makes me sick.']),
    site('evidence:redmesa','clan-road-muster','Examine the stolen ward socket at the shared well.'),
    clear('well-warband','creature:krag-warband:clan-road-muster:',['rindass-orc-raider','rindass-orc-spearman'],3,'Clear the three hostile Iron-Tusk warriors holding the shared well.'),
    site('southern-shelter','southern-caravan-rest','Search the occupied southern caravan shelter.'),
    clear('shelter-warband','creature:krag-warband:southern-caravan-rest:',['rindass-orc-raider','rindass-orc-spearman'],3,'Clear the second three-warrior camp on the southern road.'),
    {...decision('well-treaty','redmesa-beastmaster','Negotiate custody of the reopened well.',
      'The clans will help stop Krag. But what happens to the well afterward? We need to decide who’s going to look after it.',[
        {id:'clans',text:'Each clan keeps a public watering turn; no chief owns the well.',response:'All right. We’ll put the watering times up where everyone can see them.',flag:'rindass-clan-water'},
        {id:'joint',text:'Clan keepers and caravan witnesses share the well’s tally.',response:'The travelers can help us keep records. But the water will still belong to the clans.',flag:'rindass-road-treaty'},
      ]),cinematicId:'krag-before'},boss('iron-tusk'),
    report('redmesa','redmesa-beastmaster',[
      'Krag’s men are gone from the well. Thank you. The clans have agreed to share it again.',
      'The iron from our well went to Deepford. That’s what the forge records say. Maybe Mara can tell you what happened to it.'],240),
  ]);
  chapter('Druganwoods · What the mine remembers',[
    speak('brief:deepford','deepford-runesmith','Bring the well and beacon rubbings to Deepford’s archive.',[
      'The marks on these stones match. I think they were all part of the same old system. Your mother helped us after the river flooded.',
      'My cousin Bruni went to check the spring, and she hasn’t returned. There are spirits all along the path. I’m frightened for her.']),
    speak('river-witness','deepford-boatwright','Hear the boatwright’s memory of your family’s relief journey.',[
      'Your father helped us build a landing when the river flooded. Your mother stayed to bring food across. They could’ve left, but they didn’t.',
      'That was the last time I saw your parents. Bruni went to the same spring recently. Something’s wrong with the water there.']),
    site('evidence:deepford','rootwater-watch','Read the damaged Rootwater seal beside the mine spring.'),
    clear('spring-rescue','story-camp:rootwater-rescue:',['marsh-wraith'],3,'Defeat the three hungry spirits trapping Bruni at Rootwater.'),
    speak('bruni-rescued','bruni-stonevein','Recover the survey from Bruni after clearing the approach.',[
      'Your mother brought us food once when the mine was short on supplies. She didn’t ask for payment. I remember that.',
      'The Rootfather started growing here after the old iron was taken. Waste from the mine got into the roots. I don’t think it caused this.']),
    {...inspect('family-relief-record','story:relief-letter','Read the river guild’s account of your parents’ final relief crossing.'),cinematicId:'family-relief-account'},
    depends('seed-road-repair','water-stops','Help Cibar’s growers restore their pump so the relief road has food again.'),
    {...speak('mine-account','deepford-runesmith','Agree the mine’s repair before confronting the Rootfather.',[
      'We can fix the waste channel. I’ve already spoken to the workers. The guild needs to take responsibility for this.',
      'The workers are scared of the Rootfather. I won’t send them in until it’s safe. Please be careful.']),cinematicId:'rootfather-before'},boss('rootfather'),
    report('deepford','deepford-runesmith',[
      'Bruni’s survey is in the archive now. I made sure they couldn’t quietly throw it away.',
      'The freight records end at Tidewatch. I would ask the harbor masters who moved that iron before I believed any more tales about missing grain.'],280),
  ]);
  chapter('Portquill · The cargo of a crown',[
    speak('brief:tidewatch','tidewatch-harbor-master','Ask the Harbor Guild who profits from the missing relief cargo.',[
      'The Salt King’s been taking grain, tools, anything he can sell. He’s holding the ships until people pay him.',
      'Orren saw them loading the stolen goods. The ship’s anchored near Salt Bay Outlook. You can see its gangplank from shore.']),
    speak('ship-warning','tidewatch-sailmaker','Learn the flagship’s boarding approach and the crew’s strength.',[
      'The boatswains guard the hold. I saw someone carrying the freight book below deck. Then I heard a man shouting to be let off the ship.',
      'Be careful on the east gangplank. The edge is rotten, and I’ve already pulled two men out of that water.']),
    site('evidence:tidewatch','salt-bay-outlook','Read the coastal signal at Salt Bay Outlook.'),
    clear('flagship-deck','pirate:flagship:crew:',['cutlass-pirate','pirate-boatswain'],5,'Secure the flagship’s deck by defeating its five crew.'),
    inspect('cargo-manifest','story:flagship-manifest','Read the freight manifest beside the flagship’s cargo chest.'),
    {...decision('harbor-account','tidewatch-harbor-master','Decide how the recovered cargo will be accounted for.',
      'We’ve found the stolen cargo. How do we make sure it actually gets back to the families? I don’t trust those merchants.',[
        {id:'public',text:'Publish each cargo claim; return food to the households first.',response:'We’ll put the cargo lists up at every harbor. People have a right to know what’s theirs.',flag:'portquill-public-cargo'},
        {id:'bond',text:'Have the guild guard deliveries under a witnessed bond.',response:'All right. We’ll have the guild sign for every shipment until it reaches the right family.',flag:'portquill-guild-bond'},
      ]),cinematicId:'salt-before'},boss('salt-king'),
    report('tidewatch','tidewatch-harbor-master',[
      'I’ll oversee the cargo myself. If the Salt King comes back, he can come and argue with me.',
      'One of the lenses was sent to Skallheim. They’ve had trouble bringing their boats in since it disappeared. I can send a letter with the next captain.'],320),
  ]);
  chapter('Frostlands · A hearth still lit',[
    speak('brief:skallheim','skallheim-hunter','Learn why the Frost Wyrm came down to the fishing coast.',[
      'The Wyrm used to stay up in the cliffs. Now it’s coming down to the fishing huts. Someone found a black shard near the old beacon.',
      'Wolves followed it down from the cliffs. They’ve been prowling near the food stores. Eyvind’s family is worried.']),
    speak('winter-households','skallheim-trader','Hear what the loss of the winter signal means to the fishing families.',[
      'The boats won’t come in without a light. Their families are here waiting. I don’t know how much longer our food will last.',
      'The wolves are near the bay stores, and our lantern’s still out by the lookout. I’d go myself, but my children need me here.']),
    site('evidence:skallheim','ice-bay-outlook','Examine the stripped beacon at Ice Bay Outlook.'),
    clear('frost-store-defense','story-camp:frost-stores:',['frost-wolf'],5,'Clear the five wolves blocking the fishermen’s bay supplies.'),
    inspect('recover-lantern','story:frost-lantern','Recover the icebound signal lantern beside the outlook.'),
    speak('winter-signal-return','skallheim-trader','Return the lantern before the next boats seek the shore.',[
      'The lens is fine! We can light the beacon tonight. My children will be so relieved.',
      'Runa found a shard like this beneath the Wyrm’s scales. It’s not ice. I think it came from somewhere else.'],'deliver'),
    {...speak('wyrm-preparation','skallheim-hunter','Prepare to drive the injured Wyrm away from the coast.',[
      'The Wyrm moves faster than it looks. I’ve seen it charge straight through a fishing shed. Don’t stand in front of it.',
      'The stores are safe, and we’ve got our lantern back. But the Wyrm’s still scaring the boats away. We need help.']),cinematicId:'wyrm-before'},boss('frost-wyrm'),
    report('skallheim','skallheim-hunter',[
      'The shard matches the old beacon. We’ll keep watch by the shore now. People are exhausted, but at least the boats can come back.',
      'The metal looks like something made at Blackspire. Vexa and the other smiths might recognize it.'],360),
  ]);
  chapter('Darkav · Iron without a promise',[
    speak('brief:blackspire','blackspire-forgemaster','Ask the Forge Hall to identify the recovered binding iron.',[
      'That’s ward iron. I know because I’ve worked with it. Someone melted it down, and they must’ve known it was important.',
      'The Seer said she’d fix the furnace vents. Instead we got spirits on the roads. Dain’s been helping people escape.']),
    speak('ash-road-survivors','blackspire-warder','Hear the warder’s account of the evacuated chainworks.',[
      'The workers made it to shelter, but we left the charge book in the burnt chainworks. It names the people who bought the iron.',
      'The old watch-stone has marks from the Seer’s work. She’s been drawing spirits toward the vents. The dragon’s a different problem.']),
    site('evidence:blackspire','ash-vent-watch','Compare the ash vent seal with the recovered regional rubbings.'),
    site('chainworks-search','darkav:burnt-chainworks','Search the burnt chainworks along the outer ash road.'),
    inspect('chainworks-account','story:forge-record','Recover the chainworks charge book.'),
    {...decision('forge-truth','blackspire-forgemaster','Decide how the forbidden forging will be recorded.',
      'Some smiths want to burn the records. I helped make those chains, and I didn’t ask enough questions. What should we tell the workers?',[
        {id:'open',text:'Publish the account, including the smiths’ mistakes.',response:'Then leave my name in the report too. I don’t want anyone thinking I had nothing to do with it.',flag:'darkav-open-account'},
        {id:'witness',text:'Keep witnessed copies in every regional archive.',response:'Good. Send copies to the other towns. I don’t want those records disappearing.',flag:'darkav-shared-archives'},
      ]),cinematicId:'seer-before'},boss('ashen-seer'),
    report('blackspire','blackspire-forgemaster',[
      'The Seer’s gone for now, but Varkhul is still near the furnace. My workers can’t get close enough to repair it.',
      'Renna needs to see this charge book. She’ll want to know who paid for the iron. I can start preparing the new chains.'],400),
  ]);
  chapter('Act IV · An inheritance, not a destiny',[
    speak('capital-return','renna-vale','Return the seven regional accounts to the Royal Archive.',[
      'We’ve found where the iron went. The grain office sold it, the Salt King moved it, and the Seer bought some of it. They all knew it was stolen.',
      'Leigneron, I found the record of your parents’ last trip. They went back to help the people who were stranded. The bridge collapsed. I’m so sorry.',
      'Someone used your mother’s map to find the stones. She only made it so people could find water and shelter. She never knew what they’d do with it.',
      'The towns have agreed to help repair the roads. You should talk to Edmund before heading out again. You’ve been through so much.'],'deliver'),
    speak('seal-account','sevrin-hale','Confront the grain official with the regional freight accounts.',[
      'I thought selling the old iron would pay for food. I told myself those stones weren’t important. I was wrong.',
      'I knew people were getting hurt. I kept pretending it wasn’t my problem because I couldn’t see them. Don’t let anyone hide my part in this.']),
    {...speak('return-aldren-after-regions','aldren-vale','Return to Oakmere before undertaking the final repair.',[
      'I tried to keep you safe when you were little. I know I’ve been overprotective. I just couldn’t stand the thought of losing you too.',
      'You’ve helped so many people. Your parents would be proud. Orin wanted to talk about the compass before you go back to Darkav.']),cinematicId:'inheritance-revealed'},
  ]);
  regional.objectives=objectives;
  const dragon=get('returning-ember');dragon.kind='main';dragon.chapter='Act V · The returning ember';dragon.prerequisiteQuestId='eight-regions';
  dragon.summary='The regional agreements are ready, but Varkhul holds the basalt furnace shelf where the cinder ward must be repaired. Prepare shelter and witnessed chains, then drive the dragon into retreat long enough to restore the ward. His death is neither possible nor necessary.';
  dragon.objectives.splice(1,0,
    speak('shelter-orders','blackspire-warder','Confirm shelter for the furnace crews before approaching Varkhul.',[
      'I’ve got the workers waiting behind the defenses. I won’t send them near the lava while Varkhul’s there.',
      'As soon as he flies off, we’ll move the workers in. Don’t worry about killing him. Just stay alive.']),
    inspect('repair-account','story:forge-record','Collect the witnessed chainwork specifications for the final repair.'));
  const survey=dragon.objectives.find(o=>o.id==='survey-ward')!;survey.cinematicId='varkhul-before';
  dragon.objectives.find(o=>o.id==='repel-varkhul')!.requiresFreshDefeat=true;
  dragon.resolution='Varkhul flew back into the mountains. The crews reached shelter, and the smiths reforged the broken chains. For now, Blackspire’s workers can come home safely.';
  quests.push({id:'the-last-ward',name:'The Roads We Keep',kind:'main',chapter:'Act V · The roads we keep',giverNpcId:'orin-bell',
    prerequisiteQuestId:'eight-regions',rewardGold:240,rewardXp:1000,
    summary:'The broken wards can be joined again only with the communities’ consent. Carry their agreements to Darkav, protect the final repair from Varkhul, and return to the people who gave your journey meaning.',
    resolution:'The ward network has keepers again. The dragon lives, the roads still need tending, and Leigneron returns to Oakmere by choice—not because there is nowhere else to go.',
    objectives:[
      speak('compass-truth','orin-bell','Learn how the inherited compass joins the regional wards.',[
        'That compass was made for people who looked after the old stones. Your parents used it on their travels. I think that’s why it reacts to them.',
        'Cinderwatch is the last broken stone. Vexa will need the other keepers’ help to mend it. Will you speak to Cecily before you go back to Darkav?']),
      decision('keepers-covenant','renna-vale','Record who will be responsible for the restored roads.',
        'Everyone’s asking who’ll be responsible if one of the wards fails again. We should settle that before anyone signs the agreement.',[
          {id:'local',text:'Local keepers publish their accounts and help neighboring roads.',response:'All right. Each town will have a copy. I’ll make sure the local keepers can sign it too.',flag:'covenant-local-keepers'},
          {id:'shared',text:'A shared road watch answers to witnesses from every region.',response:'We’ll have a shared watch, with people from every region involved. I hope they can work together.',flag:'covenant-shared-watch'},
        ]),
      speak('covenant-forge','blackspire-forgemaster','Deliver the signed covenant and regional repair accounts.',[
        'The iron’s ready, and the towns have agreed to the repair. I’m glad. I wasn’t sure they’d trust us again.',
        'Dain’s waiting near the western approach. Talk to him before we move the chains. I won’t put the workers near that dragon yet.'],'deliver'),
      depends('last-confrontation','returning-ember','Complete the final preparations and force Varkhul to retreat from Darkav’s lava lair.'),
      {...inspect('restore-cinderwatch','varkhul-ward','Join the reforged binding at Cinderwatch after the dragon retreats.','clue:varkhul-ward'),cinematicId:'wards-rewoven'},
      speak('crown-recognition','lady-adria-vale','Report the completed repair at Crown Hall.',[
        'You went all that way and helped people we’d let down. Thank you. I know it couldn’t have been easy.',
        'The agreements are signed. The repairs will continue, and I’ll make sure everyone receives a copy. You should go home and get some rest.']),
      {...speak('home-table','sena-marrow','Return to Marrow Inn for a place at the table.',[
        'There you are! Sit down, I’ve got food ready. You look like you haven’t eaten properly in days.',
        'Lena’s children are doing better now. They were playing outside this morning. It’s been a long time since I heard them laugh like that.',
        'Tell me about your trip. Who did you meet? And don’t tell me you did everything on your own.']),cinematicId:'roadborn-epilogue'},
    ]});
  // Respect the existing localized identities (Alice/Thomas/Cecily, etc.),
  // including the inn’s Marlow surname; stable IDs are never renamed.
  for(let i=0;i<quests.length;i++)quests[i]=rewriteNpcMentions(quests[i],NPC_NAME_ALIASES);
}
