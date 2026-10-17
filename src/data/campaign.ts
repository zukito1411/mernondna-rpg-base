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
      'Before the sword lessons, you learned to mend a harness and count the people in a wagon. That was your mother’s trade. Your father kept the roads beneath its wheels.',
      'When their relief wagon failed to return, you asked why nobody went after it. I had no answer a child deserved. I still do not.',
      'Today the seed cart is late. Start at the inn, ask who was on that road, and help them. You need not become a hero to refuse to look away.']),
    speak('morning-inn','sena-marrow','Ask at Marrow Inn about the missing seed cart.',[
      'Your mother sat at this very table, sorting seed from grain. You were asleep against her sleeve. I kept the bowl she never finished.',
      'Lena Cartwright left before dawn. Her children are upstairs waiting for her. Bring me news before they learn to fear every sound at the door.']),
    speak('caravan-hearth','torren-ashfield',`Visit ${who('torren-ashfield')} at the West Cottages before taking the road.`,[
      'Come in. The kettle is still warm. You used to fall asleep beside that hearth while we argued over the price of oats.',
      'Your father could pack a wagon in the dark, but never find his own gloves. Your mother always knew where he had left them. Remember them like that, too—not only as the people who never came home.',
      'Varr once rode with our wagons. He knew which carts carried seed and which families depended on them. If he has turned on Lena, it was a choice. Ask Mira what she saw; anger alone will not bring that carter back.']),
    speak('field-witness','mira-fen','Compare Mira’s tracks with the innkeeper’s account.',[
      'I found a cut harness east of the farms. Three men are watching the cart; Lena is hiding nearby. Those are people, not tracks on a map.',
      'You used to promise we would see every road together. Today I want you to see the person beside this one. Clear the three watchers before chasing their captain.']),
    speak('blade-check','joren-pike','Visit Pike Smithy before leaving Oakmere.',[
      'That hilt was repaired for your family long before it fitted your hand. It is not a relic. It is a tool; keep its edge away from anyone who cannot defend themselves.',
      'If they crowd you, find room for your feet before you answer with steel. Let a man show where his swing is going. I would rather mend your blade than help carry you home.']),
    clear('free-seed-cart','story-camp:seed-cart:',['road-bandit'],3,'Defeat the three bandits surrounding Lena’s seed cart.'),
    speak('lena-safe','lena-cartwright','Check that Lena survived the ambush.',[
      'You came back for me. Their captain kept calling for the sacks, but one man searched my map before he searched my purse.',
      'They cut the seed open on purpose. Please read what they left beside the cart. I need to know whether it is safe to bring my children home.']),
    inspect('cart-evidence','story:seed-cart','Examine the slashed seed sacks beside the rescued carter.'),
    speak('seed-return','nella-brook','Tell the growers what happened to their spring seed.',[
      'We can save enough seed if the next wagon gets through. If it does not, hunger will arrive after the bandits are gone.',
      'Your mother measured a rescue by what folk could do the next morning. Keep Lena’s road open; that is how a battle becomes help.'],'deliver'),
    decision('roadwardens-choice','aldren-vale','Tell your mentor why you will take the road.',
      'That scrap names a survey, not a treasure. Is it your family you are following, or the people who still need that road?',[
        {id:'people',text:'I want Lena’s children to stop waiting in fear.',response:'Then remember them when someone offers you a grander cause.',flag:'leigneron-protector'},
        {id:'answers',text:'I need answers about my family—but I will not leave others behind.',response:'Questions can lead you out. People must be the reason you come back.',flag:'leigneron-seeker'},
      ]),
    speak('watch-plan','elara-voss','Arrange a road watch with Oakmere’s guard captain.',[
      'You freed the carter. Good. Now I can spare a watch for the farms rather than send them searching for another corpse.',
      'Varr was a caravan guard. Someone bought his knowledge of the old road. Read his dispatch at the tower’s outer approach before you face him.']),
    {...inspect('tower-dispatch','story:varr-orders','Read Varr’s dispatch outside the watchtower.'),cinematicId:'varr-before'},
    {...first.objectives.find(o=>o.id==='kill-varr')!},
    inspect('recover-seal','story:varr-cargo','Recover the royal seal and marked survey from the tower cargo.'),
    speak('compass-question','orin-bell','Show the survey’s compass carving to the shrine keeper.',[
      'Your compass belonged to travelers who tended the old wards. It answers their stones, not a king’s blood or a promised destiny.',
      'Its needle has begun to stir because the stones are being broken. Whoever bought Varr’s survey wanted their locations. The royal archive may still hold your family’s route.']),
    speak('return-aldren','aldren-vale','Return with the recovered seal and your mother’s survey.',[
      'I know that hand. She wrote this survey so any carter could find water and shelter, not so a lord could own the road.',
      'Take the seal to the archive in Highmere. Find who sold the ward iron and what happened to the relief wagons. Do not mistake a powerful person’s answer for the truth.',
      'You leave as my pupil. Come home as yourself. There will be a place for you at the inn, however long the road becomes.']),
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
      'Your family passed through these boughs without taking living wood. Their survey recorded the spring, not our defenses. That distinction matters here.',
      'The Warden mourns through the roots. Before you call it an enemy, ask what was taken from the grove. Our field scribe is keeping the broken stones.']),
    speak('bowyer-witness','elarion-bowyer','Hear the bowyer’s account of the blighted road.',[
      'The thornlings gather where the ward iron was pulled out. I can drive them off a path; I cannot mend a wounded root with an arrow.',
      'Three hold the old Greenward clearing. Clear that knot, not every creature you find in the forest.']),
    site('evidence:elarion','greenward-ruin','Record the empty iron socket at the Greenward Stones.'),
    clear('greenward-clear','creature:blighted-thornling:greenward-ruin:',['blighted-thornling'],3,'Clear the three blighted thornlings beside Greenward.'),
    speak('field-scribe','lysa-thorneleaf','Compare the cleared stone with the field scribe’s copy.',[
      'The inscription says keeper, not conqueror. Its iron was sawn out with a smith’s tool. The wound came before the blight.',
      'Go to Moonfall. The herbalist remembers the pilgrims who stopped coming when the roots turned black.']),
    speak('moonfall-remedy','moonfall-herbalist','Ask Moonfall’s herbalist how to approach the wounded grove.',[
      'I treated your mentor once. He insisted on thanking the tree that sheltered him. You carry his good habits, I hope.',
      'The pilgrims left cloth at the grove for safe passage. Read their last marks, and keep the shaded path free of its three nests.']),
    speak('pilgrims-hearth','dael-vale',`Speak with ${who('dael-vale')} inside the Grove House.`,[
      'Leave your wet cloak by the hearth. Your mentor once stood there pretending the cold had not reached him. He was a poor liar when his teeth were chattering.',
      'The pilgrims used to fill this house at dusk. A child would choose a ribbon, and someone would tie it beside the stones next morning. Now I lay the supper bowls out and count the empty places.',
      'The last party came back with black water on their boots. They had not broken a branch or taken a living root. Read the ribbons before you face the Warden. Something hurt that grove before it hurt our travelers.']),
    site('pilgrim-record','moon-pilgrim-grove','Read the pilgrims’ marks in the Moon Pilgrims’ Clearing.'),
    clear('grove-nests','creature:grove-spider:moon-pilgrim-grove:',['grove-spider'],3,'Clear the three hostile spiders at the pilgrims’ shaded approach.'),
    {...decision('grove-oath','elarion-lorekeeper','Agree how Narenthil’s ward should be restored.',
      'We will help you face the Warden. Will the restored grove answer its own keepers, or a watch shared with the road?',[
        {id:'keepers',text:'Let the grove’s keepers tend its roots; publish the safe paths.',response:'Our lorekeepers will maintain the stones and share their warnings.',flag:'narenthil-grove-keepers'},
        {id:'watch',text:'Build a shared watch with the travelers who use the road.',response:'The bowyers will teach your roadwardens where not to tread.',flag:'narenthil-shared-watch'},
      ]),cinematicId:'warden-before'},boss('moonlit-warden'),
    report('elarion','elarion-lorekeeper',[
      'The Warden can rest between its reckonings. Its anger did not prove the forest hated us; the empty socket proved someone wounded it.',
      'Take this rubbing to Starhold. The same iron linked our roots to the mountain beacon. Your parents once carried supplies over that pass.'],160),
  ]);
  chapter('Nardorous · A light through snow',[
    speak('brief:starhold','starhold-quartermaster','Learn which winter wagon failed to reach Starhold.',[
      'The flour charter means little up here if the pass stays closed. Stonejaw took the draft beasts; the porters scattered before the storm.',
      'The templar keeps their names, not just our lost cargo. Ask after the people before you search the beacon.']),
    speak('porter-names','starhold-templar','Learn whether the missing mountain porters reached shelter.',[
      'The last porter reached our hearth. He left signal oil behind because his hands could no longer close around the satchel.',
      'At the broken beacon, recover his route journal. A cold traveler needs a dependable light, not a ballad about a sword.']),
    site('evidence:starhold','pass-beacon','Read the broken beacon’s three signal marks.'),
    inspect('recover-beacon-kit','story:beacon-kit','Recover the relief satchel beside the mountain beacon.'),
    speak('deliver-beacon-kit','starhold-quartermaster','Deliver the porter’s signal oil and journal.',[
      'Oil and a true route. We can relight the working beacon while you deal with what waits on the pass.',
      'The journal says ridge at dusk, sheltered pass after the signal, hearth by dawn. Tell me what a traveler should do first.'],'deliver'),
    {id:'mountain-code',type:'puzzle',targetId:'starhold-quartermaster',amount:1,text:'Interpret the porter’s safe passage sequence.',dialogue:['A beacon is useful only if its warning is understood. Which order keeps the caravan together?'],choices:[
      {id:'signal',text:'Wait for the ridge signal; take the sheltered pass together.',response:'Exactly. Nobody climbs alone to prove their courage.',flag:'mountain-safe-signal',correct:true},
      {id:'rush',text:'Send each wagon through before the signal.',response:'That splits the caravan in the storm. Read the porter’s journal again.',flag:'',correct:false},
    ],cinematicId:'stonejaw-before'},boss('stonejaw'),
    report('starhold','starhold-quartermaster',[
      'The pass is open for a convoy, not safe forever. We will keep the beacon and a winter watch; your victory will not do their work for them.',
      'The broken beacon socket matches the forest stone. Our iron shipments ran south to Rindass. Ask the clans who bought their wells.'],200),
  ]);
  chapter('Rindass · Water is not a throne',[
    speak('brief:redmesa','redmesa-beastmaster','Hear the clans’ account of Krag’s seizure of their wells.',[
      'Krag calls every clan outside his banner an enemy. Do not make his argument for him by cutting down our people on sight.',
      'He seized the shared well, then the southern caravan shelter. Drive out those warbands. Our forgewright can tell you what changed their water.']),
    speak('well-forge','redmesa-forgewright','Ask the Clan Forge about the well’s missing iron.',[
      'I repaired your family’s cart. They paid with work when their coin ran short. There is no shame in that.',
      'The well’s iron was sold under a royal freight mark. Krag used the bitter water to promise his own protection. Fear is cheaper than a new well.']),
    site('evidence:redmesa','clan-road-muster','Examine the stolen ward socket at the shared well.'),
    clear('well-warband','creature:krag-warband:clan-road-muster:',['rindass-orc-raider','rindass-orc-spearman'],3,'Clear the three hostile Iron-Tusk warriors holding the shared well.'),
    site('southern-shelter','southern-caravan-rest','Search the occupied southern caravan shelter.'),
    clear('shelter-warband','creature:krag-warband:southern-caravan-rest:',['rindass-orc-raider','rindass-orc-spearman'],3,'Clear the second three-warrior camp on the southern road.'),
    {...decision('well-treaty','redmesa-beastmaster','Negotiate custody of the reopened well.',
      'The clans will stand against Krag, but not kneel to a distant grain office. Who keeps this water open after you leave?',[
        {id:'clans',text:'Each clan keeps a public watering turn; no chief owns the well.',response:'We will mark the turns where every rider can read them.',flag:'rindass-clan-water'},
        {id:'joint',text:'Clan keepers and caravan witnesses share the well’s tally.',response:'Then travelers may speak, but they may not buy our water.',flag:'rindass-road-treaty'},
      ]),cinematicId:'krag-before'},boss('iron-tusk'),
    report('redmesa','redmesa-beastmaster',[
      'Krag lost his claim, not our people their dignity. The well will be guarded under the promise you helped us make.',
      'The ward iron went downriver toward Deepford. You have heard what a stolen stone does above ground. Now ask what it does beneath it.'],240),
  ]);
  chapter('Druganwoods · What the mine remembers',[
    speak('brief:deepford','deepford-runesmith','Bring the well and beacon rubbings to Deepford’s archive.',[
      'These are not separate ornaments. They keep springs, roots and roads in balance. Your mother carried relief here when the river works failed.',
      'My cousin Bruni surveyed the Rootwater seal. Hungry spirits cut off her return. Find her before the guild files another empty name.']),
    speak('river-witness','deepford-boatwright','Hear the boatwright’s memory of your family’s relief journey.',[
      'Your father built a landing for our stranded crews. Your mother refused to leave the flour on the wrong bank. They stayed when a paid escort would have gone.',
      'That was the last season I saw them. Their survey made this spring a public stop. Bruni went there because the water had begun to fail again.']),
    site('evidence:deepford','rootwater-watch','Read the damaged Rootwater seal beside the mine spring.'),
    clear('spring-rescue','story-camp:rootwater-rescue:',['marsh-wraith'],3,'Defeat the three hungry spirits trapping Bruni at Rootwater.'),
    speak('bruni-rescued','bruni-stonevein','Recover the survey from Bruni after clearing the approach.',[
      'A relief wagon once brought my crew flour. Your mother did not ask what our guild could pay. I remember her because I was hungry.',
      'The Rootfather grew around this spring to hold it open. The stolen seal let the mine’s waste into its roots. It is protecting a wound nobody admitted making.']),
    {...inspect('family-relief-record','story:relief-letter','Read the river guild’s account of your parents’ final relief crossing.'),cinematicId:'family-relief-account'},
    depends('seed-road-repair','water-stops','Help Cibar’s growers restore their pump so the relief road has food again.'),
    {...speak('mine-account','deepford-runesmith','Agree the mine’s repair before confronting the Rootfather.',[
      'The pump can carry clean water again. Our guild will seal the waste channel and record the repair, rather than call the guardian our only mistake.',
      'Free the working route from the Rootfather’s grip. I will stay with the surveyors; no miner descends until the spring is inspected.']),cinematicId:'rootfather-before'},boss('rootfather'),
    report('deepford','deepford-runesmith',[
      'Bruni’s account is in the archive, and the spring survey will not be buried with a guild embarrassment.',
      'The freight records end at Tidewatch. I would ask the harbor masters who moved that iron before I believed any more tales about missing grain.'],280),
  ]);
  chapter('Portquill · The cargo of a crown',[
    speak('brief:tidewatch','tidewatch-harbor-master','Ask the Harbor Guild who profits from the missing relief cargo.',[
      'The Salt King sells the safe return of what he stole. His crews take grain, signal lenses and chains from the same marked cargo.',
      'Orren saw the cargo being taken. From Salt Bay Outlook you can see the flagship at anchor, its eastern gangplank hanging over the water like a dare.']),
    speak('ship-warning','tidewatch-sailmaker','Learn the flagship’s boarding approach and the crew’s strength.',[
      'His boatswains do not let strangers near the hold. I saw a ledger taken below, then heard a man begging to be let off that ship.',
      'The eastern gangplank is rotten at the edge. Watch your footing. I have pulled enough sailors out of that water.']),
    site('evidence:tidewatch','salt-bay-outlook','Read the coastal signal at Salt Bay Outlook.'),
    clear('flagship-deck','pirate:flagship:crew:',['cutlass-pirate','pirate-boatswain'],5,'Secure the flagship’s deck by defeating its five crew.'),
    inspect('cargo-manifest','story:flagship-manifest','Read the freight manifest beside the flagship’s cargo chest.'),
    {...decision('harbor-account','tidewatch-harbor-master','Decide how the recovered cargo will be accounted for.',
      'The Salt King will deny every debt when cornered. How should the harbors hold the recovery, so nobody steals it twice?',[
        {id:'public',text:'Publish each cargo claim; return food to the households first.',response:'Every quay will receive the same account. Hunger has waited long enough.',flag:'portquill-public-cargo'},
        {id:'bond',text:'Have the guild guard deliveries under a witnessed bond.',response:'The guild will answer for every chain and sack until it reaches its owner.',flag:'portquill-guild-bond'},
      ]),cinematicId:'salt-before'},boss('salt-king'),
    report('tidewatch','tidewatch-harbor-master',[
      'The stolen cargo will go back under witness. I will sign the ledger myself, even if the Salt King sails into this harbor tomorrow.',
      'One of those lenses was sent as far as Skallheim. Their boats have been coming home in darkness since it disappeared. I know a captain who can carry a letter.'],320),
  ]);
  chapter('Frostlands · A hearth still lit',[
    speak('brief:skallheim','skallheim-hunter','Learn why the Frost Wyrm came down to the fishing coast.',[
      'It belongs to the ice cliffs, not our drying sheds. A dark fragment tore its scales after the old beacon was stripped.',
      'The wolves came down after it and have gathered around the stores. Eyvind has children waiting for those supplies. He can tell you how bad it has become.']),
    speak('winter-households','skallheim-trader','Hear what the loss of the winter signal means to the fishing families.',[
      'A harbor light is a promise that someone will be awake when you return. Without it our boats stay home, and their children eat the winter stores now.',
      'The wolves keep us from the bay cache. Our lantern lies near the outlook, beyond their tracks. I would go for it myself, but the children cannot lose another parent.']),
    site('evidence:skallheim','ice-bay-outlook','Examine the stripped beacon at Ice Bay Outlook.'),
    clear('frost-store-defense','story-camp:frost-stores:',['frost-wolf'],5,'Clear the five wolves blocking the fishermen’s bay supplies.'),
    inspect('recover-lantern','story:frost-lantern','Recover the icebound signal lantern beside the outlook.'),
    speak('winter-signal-return','skallheim-trader','Return the lantern before the next boats seek the shore.',[
      'The lens is sound. We can light it tonight. My children will see that a late boat can still come home.',
      'The black shard is not ice. The hunter saw the same material beneath the Wyrm’s scales. Take the evidence, not a tale that the snow itself is cursed.'],'deliver'),
    {...speak('wyrm-preparation','skallheim-hunter','Prepare to drive the injured Wyrm away from the coast.',[
      'A grounded wyrm lunges; it does not need wings to cross a clearing faster than you can. Give its charge room, then answer from the flank.',
      'You have kept the stores open and the lamp ready. Now free the coast from the creature the broken ward drove here.']),cinematicId:'wyrm-before'},boss('frost-wyrm'),
    report('skallheim','skallheim-hunter',[
      'The shard matches the beacon’s missing binding. We will guard the shore while the lamp burns; the winter belongs to no single hunter.',
      'The fragment was forged in volcanic heat. Blackspire’s smiths know that work. Take passage to Ashen Landing and follow the ash road north.'],360),
  ]);
  chapter('Darkav · Iron without a promise',[
    speak('brief:blackspire','blackspire-forgemaster','Ask the Forge Hall to identify the recovered binding iron.',[
      'That is ward iron. I recognize the temper. Whoever melted it asked for heat without a keeper, without a limit, without anyone left to answer for it.',
      'The Seer promised command over the vents. We got wraiths and broken roads. Ask the warder which crews escaped before you read the chainworks account.']),
    speak('ash-road-survivors','blackspire-warder','Hear the warder’s account of the evacuated chainworks.',[
      'The crews reached shelter, but the charge book is still at the burnt chainworks. It names whoever paid for the removed iron.',
      'Read the ash vent watch as well. The Seer is binding spirits to a power she cannot safely hold. Do not confuse her with the dragon beyond the ridge.']),
    site('evidence:blackspire','ash-vent-watch','Compare the ash vent seal with the recovered regional rubbings.'),
    site('chainworks-search','darkav:burnt-chainworks','Search the burnt chainworks along the outer ash road.'),
    inspect('chainworks-account','story:forge-record','Recover the chainworks charge book.'),
    {...decision('forge-truth','blackspire-forgemaster','Decide how the forbidden forging will be recorded.',
      'Some want the account burned. I helped temper these chains before I knew what had been sold. What should the survivors hear?',[
        {id:'open',text:'Publish the account, including the smiths’ mistakes.',response:'Then my name stays in it. The crews deserve a true account.',flag:'darkav-open-account'},
        {id:'witness',text:'Keep witnessed copies in every regional archive.',response:'No one forge will be able to bury the evidence again.',flag:'darkav-shared-archives'},
      ]),cinematicId:'seer-before'},boss('ashen-seer'),
    report('blackspire','blackspire-forgemaster',[
      'The Seer lost her hold over this work. The dragon still guards the furnace shelf, and the ward cannot be reforged while its crews are exposed.',
      'Bring the charge book to Highmere with the regional agreements. The crown must understand that a new chain is worthless without someone keeping its promise.'],400),
  ]);
  chapter('Act IV · An inheritance, not a destiny',[
    speak('capital-return','renna-vale','Return the seven regional accounts to the Royal Archive.',[
      'The grain office sold ward iron as scrap to finance the flour seizures. The Salt King held the cargo; the Seer bought the bindings. Neither understood the balance they were breaking.',
      'The river-guild record confirms your parents never left their stranded passengers behind. Their last crossing failed after the others reached shelter. That is what their unanswered journey meant—not a secret inheritance someone kept from you.',
      'Your mother’s survey was used to locate the stones. She made it so strangers could find shelter. What was stolen was her work, not some secret claim to a throne.',
      'The answer is not another ruler for every road. It is the promises each community offered you. Take them home, then decide what kind of roadwarden you will become.'],'deliver'),
    speak('seal-account','sevrin-hale','Confront the grain official with the regional freight accounts.',[
      'I thought iron from old milestones could pay for the stores. I told myself a hungry city needed grain more than villagers needed stones.',
      'I called it prudent because the people who would suffer were far away. Your accounts have put names to every one of them. Keep my name in that record too.']),
    {...speak('return-aldren-after-regions','aldren-vale','Return to Oakmere before undertaking the final repair.',[
      'I could not give you your parents back. I hoped the sword would keep you from following them, and taught you roadcraft that made it impossible not to.',
      'You have their compassion, not their fate. The people you helped will keep their own roads. Ask the shrine keeper how their agreements can be joined before you go back to Darkav.']),cinematicId:'inheritance-revealed'},
  ]);
  regional.objectives=objectives;
  const dragon=get('returning-ember');dragon.kind='main';dragon.chapter='Act V · The returning ember';dragon.prerequisiteQuestId='eight-regions';
  dragon.summary='The regional agreements are ready, but Varkhul holds the basalt furnace shelf where the cinder ward must be repaired. Prepare shelter and witnessed chains, then drive the dragon into retreat long enough to restore the ward. His death is neither possible nor necessary.';
  dragon.objectives.splice(1,0,
    speak('shelter-orders','blackspire-warder','Confirm shelter for the furnace crews before approaching Varkhul.',[
      'The furnace crews will stay behind the ash-road defenses while you draw Varkhul away. Nobody follows you into the molten rim.',
      'The repair team moves only after the dragon takes flight. Your promise is time enough to work, not a dead dragon.']),
    inspect('repair-account','story:forge-record','Collect the witnessed chainwork specifications for the final repair.'));
  const survey=dragon.objectives.find(o=>o.id==='survey-ward')!;survey.cinematicId='varkhul-before';
  dragon.objectives.find(o=>o.id==='repel-varkhul')!.requiresFreshDefeat=true;
  dragon.resolution='Varkhul retreated. The crews reached shelter and the binding chains were reforged. The dragon remains alive and its existing repeat-battle timer is unchanged.';
  quests.push({id:'the-last-ward',name:'The Roads We Keep',kind:'main',chapter:'Act V · The roads we keep',giverNpcId:'orin-bell',
    prerequisiteQuestId:'eight-regions',rewardGold:240,rewardXp:1000,
    summary:'The broken wards can be joined again only with the communities’ consent. Carry their agreements to Darkav, protect the final repair from Varkhul, and return to the people who gave your journey meaning.',
    resolution:'The ward network has keepers again. The dragon lives, the roads still need tending, and Leigneron returns to Oakmere by choice—not because there is nowhere else to go.',
    objectives:[
      speak('compass-truth','orin-bell','Learn how the inherited compass joins the regional wards.',[
        'Your compass was made for keepers traveling between the stones. Your parents carried it because someone had to notice when a public spring ran dry.',
        'It cannot repair the world by itself. The clans, archives, harbors and kitchens must keep the promises you heard. The final binding belongs at Cinderwatch.']),
      decision('keepers-covenant','renna-vale','Record who will be responsible for the restored roads.',
        'No archive should own this covenant. Tell me how its keepers will answer when a road or spring fails again.',[
          {id:'local',text:'Local keepers publish their accounts and help neighboring roads.',response:'Every region will keep a copy. Their names, not only the crown’s, go beneath it.',flag:'covenant-local-keepers'},
          {id:'shared',text:'A shared road watch answers to witnesses from every region.',response:'The watch will be bound to those witnesses, never the other way around.',flag:'covenant-shared-watch'},
        ]),
      speak('covenant-forge','blackspire-forgemaster','Deliver the signed covenant and regional repair accounts.',[
        'The iron can be joined now. What you brought is harder to forge: people who will admit when it breaks.',
        'Before the chains go to Cinderwatch, meet the warder and survey the western approach. Varkhul must be driven away from the crews.'],'deliver'),
      depends('last-confrontation','returning-ember','Complete the final preparations and force Varkhul to retreat from Darkav’s lava lair.'),
      {...inspect('restore-cinderwatch','varkhul-ward','Join the reforged binding at Cinderwatch after the dragon retreats.','clue:varkhul-ward'),cinematicId:'wards-rewoven'},
      speak('crown-recognition','lady-adria-vale','Report the completed repair at Crown Hall.',[
        'You went where our seal had caused harm and listened before claiming authority. That is a service no title can improve.',
        'The agreements stand. The ward keepers will receive repairs, not an order to forget what happened. Go home with our thanks, if home is where you wish to go.']),
      {...speak('home-table','sena-marrow','Return to Marrow Inn for a place at the table.',[
        'I kept the bowl, but I have stopped setting it for someone who cannot come. Yours is warm, and there is a chair beside the hearth.',
        'Lena’s children no longer listen for every sound at the door. The road has not become harmless. It has become a road people will keep for one another.',
        'Tell us where you went, Leigneron. Not the names of the things you defeated—the names of the people who helped you come back.']),cinematicId:'roadborn-epilogue'},
    ]});
  // Respect the existing localized identities (Alice/Thomas/Cecily, etc.),
  // including the inn's Marlow surname; stable IDs are never renamed.
  for(let i=0;i<quests.length;i++)quests[i]=rewriteNpcMentions(quests[i],NPC_NAME_ALIASES);
}
