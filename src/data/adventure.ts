import type {QuestDefinition,QuestObjective} from '../game/types';
export const ADVENTURE_REVISION_FLAG='campaign:living-roads-v1';

/** Authorizations are deliberately finite. They never change ambient habitats. */
export interface StoryEncounter {
  id:string;questId:string;objectiveId:string;townId:string;name:string;
  npcId?:string;contentId?:string;interiorNpcId?:string;
  radius:number;waves:readonly (readonly string[])[];warning:string;aftermath:string;
  work?:{label:string;duration:number};
}
export const STORY_ENCOUNTERS:readonly StoryEncounter[]=[
  {id:'oakmere-raid',questId:'first-road',objectiveId:'defend-oakmere',townId:'oakmere',npcId:'elara-voss',radius:650,
    name:'Oakmere Under Attack',waves:[['road-bandit','road-bandit','road-bandit'],['road-bandit','road-bandit','road-bandit'],['road-bandit','road-bandit']],
    warning:'The warning bell! Raiders are coming for the survey records. Hold the village approach!',
    aftermath:'The last raider falls back. The villagers can leave shelter; Edmund has found a sealed order.'},
  {id:'witness-ambush',questId:'shadows-highmere',objectiveId:'protect-witness',townId:'highmere',npcId:'tovin-reed',radius:450,
    name:'The False Watch',waves:[['road-bandit','road-bandit'],['road-bandit']],
    warning:'“City watch. Come out!” Thomas catches your sleeve. “That is the man from the bridge.”',
    aftermath:'A false warrant lies beside the attackers. Thomas can finally leave the weighhouse.'},
  {id:'mountain-signal',questId:'eight-regions',objectiveId:'light-beacon',townId:'starhold',contentId:'story:beacon-kit',radius:600,
    name:'The Last Beacon',waves:[['gray-wolf','gray-wolf']],work:{label:'Light the porter’s beacon',duration:6000},
    warning:'The porters answer from the ridge. Keep the beasts back while you prepare their signal.',
    aftermath:'The beacon burns. The porters can follow its light; Stonejaw still holds the pass.'},
  {id:'redmesa-defense',questId:'eight-regions',objectiveId:'defend-redmesa',townId:'redmesa',npcId:'redmesa-beastmaster',radius:650,
    name:'The Broken Clan',waves:[['rindass-orc-raider','rindass-orc-raider','rindass-orc-spearman'],['rindass-orc-raider','rindass-orc-raider','rindass-orc-spearman']],
    warning:'The negotiation breaks at a shout from the road. Krag’s men are marching on the assembly!',
    aftermath:'The clans lower their shields. The well will not belong to whoever brings the most soldiers.'},
  {id:'winter-signal',questId:'eight-regions',objectiveId:'light-shore',townId:'skallheim',contentId:'story:frost-lantern',radius:400,
    name:'The Light That Went Out',waves:[],work:{label:'Set the recovered shore lantern',duration:5000},
    warning:'An answering light flickers beyond the bay. Set the lantern where the stranded families can see it.',
    aftermath:'A light answers from the water. The hunters take over the signal watch.'},
  {id:'chainworks-escape',questId:'eight-regions',objectiveId:'open-chainworks',townId:'blackspire',contentId:'story:forge-record',radius:600,
    name:'The Burned Chainworks',waves:[['marsh-wraith','marsh-wraith'],['marsh-wraith','marsh-wraith']],work:{label:'Unbar the workers’ escape route',duration:4000},
    warning:'Someone is pounding on the far side of the chainworks door. The dead are gathering around it.',
    aftermath:'The bar gives way. The surviving workers reach the ash road with the original charge book.'},
  {id:'archive-fire',questId:'eight-regions',objectiveId:'save-archive',townId:'highmere',interiorNpcId:'renna-vale',radius:900,
    name:'The Burning Archive',waves:[['road-bandit','road-bandit'],['road-bandit','road-bandit']],work:{label:'Secure the witness records',duration:5000},
    warning:'Boots pound the archive stairs. “By the steward’s order—seize the records!” Cecily refuses to hand them over.',
    aftermath:'The records are safe. Isabel’s watch has barred the doors. Walter will answer before the crown.'},
  {id:'furnace-escape',questId:'returning-ember',objectiveId:'secure-crews',townId:'blackspire',contentId:'clue:varkhul-ward',radius:550,
    name:'A Road Out of the Fire',waves:[['marsh-wraith','marsh-wraith','marsh-wraith']],
    warning:'The repair crews cannot carry the new chains through these spirits. Clear their way to shelter.',
    aftermath:'The crews move behind the surviving protections. They will wait for Varkhul to retreat.'},
  {id:'poacher-camp',questId:'hunters-promise',objectiveId:'poachers',townId:'oakmere',contentId:'adventure:poacher-snare',radius:500,
    name:'The Hunter’s Promise',waves:[['road-bandit','road-bandit','road-bandit']],
    warning:'A poacher reaches for his sword. “You have seen nothing. Walk away.”',aftermath:'The poachers scatter. Their snares can no longer drive frightened animals toward Oakmere.'},
  {id:'false-inheritance',questId:'home-for-two',objectiveId:'hired-men',townId:'willowcross',contentId:'adventure:family-deed',radius:450,
    name:'A Home for Two',waves:[['road-bandit','road-bandit']],
    warning:'Two hired men step from behind the ruined house. They want the children’s deed, not a family reunion.',
    aftermath:'The deed is safe. A court can hear the family without armed men deciding the answer.'},
  {id:'last-debt',questId:'tidewatch-debt',objectiveId:'smugglers',townId:'tidewatch',contentId:'adventure:sailor-locket',radius:450,
    name:'The Last Debt of Tidewatch',waves:[['cutlass-pirate','cutlass-pirate','pirate-boatswain']],
    warning:'The smugglers recognize the locket. Their lookout signals for the boatswain.',
    aftermath:'The quay is clear. The sailor’s account must reach his daughter without another convenient lie.'},
];
export const STORY_ENCOUNTER_BY_ID=Object.fromEntries(STORY_ENCOUNTERS.map(e=>[e.id,e])) as Record<string,StoryEncounter>;

/** Authored discoveries use existing world-art props, not abstract menu steps. */
export const ADVENTURE_CLUES=[
  {id:'adventure:poacher-snare',townId:'oakmere',siteId:'',dx:2100,dy:1250,name:'Snares in the brush',
    text:'Wire snares face the village, not the game trail. A hired man has been driving wounded animals toward Oakmere. Alice recognizes the hunter’s knot.'},
  {id:'adventure:family-deed',townId:'willowcross',siteId:'',dx:-2000,dy:1100,name:'A family deed',
    text:'The children’s mother named the widow as their guardian. Their uncle’s later claim bears a different hand and a fresh payment to two hired swords.'},
  {id:'adventure:soldier-letter',townId:'starhold',siteId:'pass-beacon',dx:-280,dy:220,name:'An unopened winter letter',
    text:'Mother, if the snow holds us here, know that the families have the last firewood. I shall keep the watch until the little ones are down the pass. Do not let anyone tell you I ran.'},
  {id:'adventure:sailor-locket',townId:'tidewatch',siteId:'salt-bay-outlook',dx:250,dy:180,name:'A sailor’s locket',
    text:'The daughter kept the broken half. The other half lies beside a smuggler’s account naming the former pirate who betrayed her father. The dates contradict his story.'},
] as const;
export const ADVENTURE_QUEST_GIVERS:Record<string,string[]>={
  'mira-fen':['hunters-promise'],'willowcross-keeper':['home-for-two'],
  'starhold-templar':['soldier-return'],'tidewatch-sailmaker':['tidewatch-debt'],
};

export function applyAdventure(quests:QuestDefinition[]){
  const q=(id:string)=>quests.find(q=>q.id===id)!;
  const stage=(quest:string,id:string)=>q(quest).objectives.find(o=>o.id===id)!;
  const instructions:Record<string,string>={
    'oakmere-raid':'Defend Oakmere’s inn approach from Varr’s raiders in Trandum.',
    'witness-ambush':'Defeat the false watch beside Highmere’s old weighhouse before escorting Thomas through the Lower Ward.',
    'mountain-signal':'Protect the pass beacon near Starhold, Nardorous, then interact beside it to light the porters’ signal.',
    'redmesa-defense':'Defend the clan assembly approach in Red Mesa, Rindass, from Krag’s warriors.',
    'winter-signal':'At the bay outlook near Skallheim, Frostlands, interact beside the recovered lantern and hold still to set the signal.',
    'chainworks-escape':'Clear the spirits at Darkav’s burnt chainworks, then interact beside the charge book to open the workers’ escape route.',
    'archive-fire':'Defeat Walter’s hired men inside Highmere’s Royal Archive, then interact near Cecily to secure the witness records.',
    'furnace-escape':'Clear the western approach to Varkhul’s lair in Darkav so the repair crews can reach shelter.',
    'poacher-camp':'Confront the poachers at the snare site southeast of Oakmere, Trandum.',
    'false-inheritance':'Keep the uncle’s hired swords away from the deed southwest of Willowcross, Trandum: involve the watch or confront them.',
    'last-debt':'Break the smugglers’ hold over the locket site near Salt Bay Outlook, Portquill.',
  };
  const event=(id:string):QuestObjective=>{const e=STORY_ENCOUNTER_BY_ID[id];return {
    id:e.objectiveId,type:'encounter',targetId:id,amount:1,text:instructions[id],rewardXp:120,
  };};
  const insert=(quest:string,before:string,...stages:QuestObjective[])=>{
    const target=q(quest),i=target.objectives.findIndex(o=>o.id===before);
    if(i<0)throw new Error(`Unknown adventure insertion ${quest}/${before}`);
    target.objectives.splice(i,0,...stages.map(o=>({chapter:target.objectives[i].chapter??target.chapter,...o})));
  };
  const talk=(id:string,npc:string,text:string,...dialogue:string[]):QuestObjective=>({id,type:'talk',targetId:npc,text,dialogue,amount:1});
  const inspect=(id:string,text:string):QuestObjective=>({id,type:'investigate',targetId:id,contentId:id,amount:1,text});
  insert('first-road','watch-plan',event('oakmere-raid'));
  stage('first-road','watch-plan').dialogue=['They came for the old records. Not our coin, not our horses. Your mother’s survey was named in this order.',
    'I will keep a watch at the inn. Take the eastern road; Varr still has men at the tower approaches. Make him answer for this.'];
  // Optional family memories do not hold the opening rescue hostage.
  q('first-road').objectives=q('first-road').objectives.filter(o=>o.id!=='caravan-hearth');
  insert('shadows-highmere','escort',event('witness-ambush'));
  q('shadows-highmere').name='A Body at the Bridge';
  insert('eight-regions','grove-oath',talk('pilgrim-safe','maerwen-reedleaf','Find Maerwen hiding near the Moon Pilgrims’ Clearing in Narenthil.',
    'Please—no closer. I thought you were one of the men with tools. Give me a moment.',
    'They took the iron from beneath the roots. The Warden stood there watching them. Then the trees began to scream.',
    'The path is clear? I will go back when I can stop shaking. Tell the grove house we kept the little ones together.'));
  insert('eight-regions','mountain-code',event('mountain-signal'));
  insert('eight-regions','well-treaty',event('redmesa-defense'));
  insert('eight-regions','winter-signal-return',event('winter-signal'));
  insert('eight-regions','chainworks-account',event('chainworks-escape'));
  insert('eight-regions','seal-account',event('archive-fire'));
  q('eight-regions').chapter='Acts III–V · The wounds of Mernodna';
  for(const id of ['capital-return','save-archive','seal-account','return-aldren-after-regions'])
    stage('eight-regions',id).chapter='Act V · The crown’s betrayal';
  insert('returning-ember','survey-ward',event('furnace-escape'));
  // Cibar remains a full optional investigation, not a compulsory detour from
  // a rescued surveyor's very personal revelation.
  q('eight-regions').objectives=q('eight-regions').objectives.filter(o=>o.id!=='seed-road-repair');
  stage('eight-regions','seal-account').cinematicId='walter-arrest';
  stage('eight-regions','seal-account').dialogue=[
    'Do you know what it is like deciding which village receives food and which goes hungry?',
    'I sold iron from old stones. At first that was all. Then the reports came. I could have stopped. Instead, I paid men to keep the roads—and the witnesses—quiet.',
    'Isabel has barred the counting house. I will go with her. Leave my name on the orders.'];
  stage('eight-regions','capital-return').dialogue=[
    'Put the charge book beside the harbor ledger. There. The same office paid for every shipment. Walter knew the wards were failing, and kept selling their iron.',
    'The account from the crossing says your parents went back for the last families. The flood took the bridge. They could have left earlier, Leigneron. They chose not to.',
    'We have enough to summon him. Bring the records upstairs. Isabel is on her way.'];
  stage('eight-regions','capital-return').text='Bring the charge book to Cecily inside the Royal Archive, Highmere, Trandum.';
  stage('eight-regions','return-aldren-after-regions').dialogue=[
    'I hoped there might be another answer. A village so far away they could not send word. A road we had not tried.',
    'They stayed because people needed them. You have been doing much the same, lad. But you are allowed to come home.',
    'No? Aye. I thought you might say that. Then finish this with the friends you have made. Do not try to carry all eight roads on your own.'];
  q('eight-regions').resolution='The regions expose Walter’s trade in stolen ward iron. He is arrested after the archive attack. Leigneron learns that his parents died saving families from a flood. Their work—and the communities’ covenant—lead to the final repair at Darkav.';
  stage('eight-regions','mine-account').dialogue=['Bruni has shown me the waste channel. We damaged that spring, then blamed the guardian when it turned on us.',
    'The crews are ready to repair it. Give them a way past the Rootfather. I will stay here until the last worker comes back.'];
  const side=(id:string,name:string,giverNpcId:string,prerequisiteQuestId:string,summary:string,objectives:QuestObjective[],resolution:string):QuestDefinition=>
    ({id,name,giverNpcId,kind:'side',prerequisiteQuestId,summary,objectives,resolution,rewardXp:340,rewardGold:100});
  quests.push(
    side('hunters-promise','The Hunter’s Promise','mira-fen','first-road',
      'Alice suspects someone is driving frightened animals toward Oakmere. Follow the snares, not the rumors.',[
        talk('tracks','mira-fen','Speak to Alice outside Oakmere, Trandum.','Those bites are from frightened animals. Somebody has hurt them before they reach us.','Come and look at the snares southeast of the village. I would like to be wrong.'),
        inspect('adventure:poacher-snare','Find the snares southeast of Oakmere, Trandum.'),event('poacher-camp'),
        talk('home','mira-fen','Return to Alice outside Oakmere.','You left the empty traps where the watch could find them. Good. Evidence is easier to carry than another angry story.','I remember when you thought every wolf was waiting to eat you. You have improved. Mostly.'),
      ],'The poachers are exposed. Alice and the watch remove their snares rather than blame the forest.'),
    side('home-for-two','A Home for Two','willowcross-keeper','first-road',
      'Two children have lost their parents. An uncle claims their inheritance, but their mother left different wishes.',[
        talk('hearth','willowcross-keeper','Speak to the keeper in Willowcross, Trandum.','The little ones have stopped asking for their mother at supper. I almost wish they would ask again.','Their uncle wants the house deeds before he will take them. Find what their mother left at the old roadside shelter southwest of Willowcross.'),
        inspect('adventure:family-deed','Recover the family deed southwest of Willowcross, Trandum.'),
        {id:'protect-deed',type:'choice',targetId:'willowcross-keeper',amount:1,text:'Bring the deed to the keeper in Willowcross before confronting the uncle.',dialogue:[
          'His men asked which room the children sleep in. I sent them away, but I do not like the way they looked at that deed. How do we keep this from becoming another funeral?'],choices:[
          {id:'watch',text:'Give the watch a witnessed copy. Let them arrest the hired men.',response:'I will ask the fletcher to witness it. The little ones need a home, not a battle at the door.',flag:'siblings-guarded-deed'},
          {id:'defend',text:'Keep the children here. I will confront his men at the roadside shelter.',response:'Then they stay with me. Bring yourself back as well as the paper.',flag:'siblings-defend-deed'},
        ]},
        {...event('false-inheritance'),completedByFlag:'siblings-guarded-deed'},
        {id:'belonging',type:'choice',targetId:'willowcross-keeper',amount:1,text:'Return to the keeper in Willowcross about the children’s future.',dialogue:['The widow has room, and the children ask for her. The uncle has only a seal and a great deal to explain. What shall I tell the watch?'],choices:[
          {id:'widow',text:'Honor their mother’s wishes. Let the children stay together with the widow.',response:'I will go with them to the hearing. Nobody is asking a frightened child to face that room alone.',flag:'siblings-widow'},
          {id:'hearing',text:'Ask Isabel to hear the children and protect their home before settling the guardianship.',response:'A proper hearing, with someone there to listen. I will make certain they have one.',flag:'siblings-hearing'},
        ]},
      ],'The children keep their home and each other. Their wishes, not the uncle’s hired swords, decide the hearing.'),
    side('soldier-return','The Soldier Who Never Returned','starhold-templar','crown-summons',
      'A mother still waits for a mountain soldier. Halla asks you to find an answer, not invent a comforting one.',[
        talk('waiting','starhold-templar','Speak with Halla beside Starhold, Nardorous.','She still puts his winter cloak by the door. I have no right to tell her to stop.','The last outpost stood west of the pass beacon. If he left a letter, bring it unopened.'),
        inspect('adventure:soldier-letter','Find the soldier’s letter west of the pass beacon near Starhold, Nardorous.'),
        talk('letter','starhold-templar','Return the letter to Halla at Starhold.','He gave the refugees the last firewood. Yes. That sounds like him.','I will sit with his mother while she reads. You need not find something brave to say. Just stay until the kettle boils.'),
      ],'His mother learns that he stayed with the refugees. The letter gives her an answer, not a grand reward.'),
    side('tidewatch-debt','The Last Debt of Tidewatch','tidewatch-sailmaker','crown-summons',
      'A former pirate wants forgiveness from a sailor’s daughter. First, someone must tell her what actually happened.',[
        talk('debt','tidewatch-sailmaker','Visit Sailmaker House in Tidewatch, Portquill; travel there by boat.','He says he wants to find the girl and make things right. He will not tell me what went wrong.','Her father wore a split locket. The smugglers keep the other half near Salt Bay Outlook. Bring the account with it.'),
        inspect('adventure:sailor-locket','Search Salt Bay Outlook south of Tidewatch, Portquill.'),event('last-debt'),
        {id:'truth',type:'choice',targetId:'tidewatch-sailmaker',amount:1,text:'Return to Sailmaker House, Tidewatch, with the sailor’s account.',dialogue:['He sold her father’s route, then called it a storm. Now he wants to buy his way back into her life. I do not know whether she will want to see him.'],choices:[
          {id:'confession',text:'Give her the truth. Let her decide whether she wants his apology.',response:'Then the letter goes to her, not to him. For once he can wait for someone else’s answer.',flag:'pirate-confession'},
          {id:'watch',text:'Give her the account and send a copy to the harbor watch.',response:'He can offer an apology without escaping a hearing. I will make both copies.',flag:'pirate-accountability'},
        ]},
      ],'The daughter receives the true account. Forgiveness belongs to her, not to the man asking for it.'),
  );
}
