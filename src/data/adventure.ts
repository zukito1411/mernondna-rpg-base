import type {QuestDefinition,QuestObjective} from '../game/types';
import {ROAD_CLUES,ROAD_ENCOUNTERS} from './roadStories';
export const ADVENTURE_REVISION_FLAG='campaign:living-roads-v1';

/** Authorizations are deliberately finite. They never change ambient habitats. */
export interface StoryEncounter {
  id:string;questId:string;objectiveId:string;townId:string;name:string;
  npcId?:string;contentId?:string;interiorNpcId?:string;
  radius:number;waves:readonly (readonly string[])[];warning:string;aftermath:string;
  work?:{label:string;duration:number};
}
export const STORY_ENCOUNTERS:readonly StoryEncounter[]=[
  ...ROAD_ENCOUNTERS,
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

export const storyEncounterDefeated=(e:StoryEncounter,flags:Record<string,boolean>)=>
  e.waves.flat().every((_,slot)=>flags[`encounter:${e.id}:defeated:${slot}`]);
/** Only the battle relocates. Securing the records still happens indoors. */
export const storyEncounterInCourtyard=(e:StoryEncounter,flags:Record<string,boolean>)=>
  Boolean(e.interiorNpcId&&flags[`encounter:${e.id}:courtyard`]&&!storyEncounterDefeated(e,flags));

/** Authored discoveries use existing world-art props, not abstract menu steps. */
export const ADVENTURE_CLUES=[
  ...ROAD_CLUES,
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
  stage('first-road','watch-plan').dialogue=['They weren’t after the money. Look, they even left the horses. There’s something about your mother’s survey in this order.',
    'I’ll put guards at the inn. You be careful around Varr’s men, all right? I don’t want them coming back for Lena.'];
  // Optional family memories do not hold the opening rescue hostage.
  q('first-road').objectives=q('first-road').objectives.filter(o=>o.id!=='caravan-hearth');
  insert('shadows-highmere','escort',event('witness-ambush'));
  q('shadows-highmere').name='A Body at the Bridge';
  insert('eight-regions','grove-oath',talk('pilgrim-safe','maerwen-reedleaf','Find Maerwen hiding near the Moon Pilgrims’ Clearing in Narenthil.',
    'Wait! Please, stay there. I’m sorry. I thought you were one of them.',
    'They were digging up the iron beneath the trees. I saw the Warden nearby. Then the roots started moving and we all ran.',
    'It’s safe now? Thank you. I just need a minute. Could you tell the others the children are all right?'));
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
  // a rescued surveyor’s very personal revelation.
  q('eight-regions').objectives=q('eight-regions').objectives.filter(o=>o.id!=='seed-road-repair');
  stage('eight-regions','seal-account').cinematicId='walter-arrest';
  stage('eight-regions','seal-account').dialogue=[
    'You think I wanted this? I had people begging me for food every day. I thought I could fix it.',
    'I sold the iron. I knew where it came from. When people started getting hurt, I should’ve stopped. But I didn’t. I was afraid of being found out.',
    'All right. I’ll go with Isabel. I won’t ask you to hide what I did.'];
  stage('eight-regions','capital-return').dialogue=[
    'Wait. Put those two books together. Look at the signatures. Walter paid for every shipment. He knew the wards were failing.',
    'Leigneron... I’m sorry. I found the account from the flood. Your parents went back for the last families. The bridge collapsed before they could return.',
    'That’s enough to bring him in. Isabel’s coming. Would you help me carry these books upstairs?'];
  stage('eight-regions','capital-return').text='Bring the charge book to Cecily inside the Royal Archive, Highmere, Trandum.';
  stage('eight-regions','return-aldren-after-regions').dialogue=[
    'For years I thought maybe they’d survived. Somewhere we hadn’t looked. I knew it was unlikely. I still hoped.',
    'They helped those families. That’s who they were. I’m proud of them. I just wish they’d come home to you.',
    'You’re going back out, aren’t you? I thought so. Just promise you’ll ask for help when you need it.'];
  q('eight-regions').resolution='The regions expose Walter’s trade in stolen ward iron. He is arrested after the archive attack. Leigneron learns that his parents died saving families from a flood. Their work—and the communities’ covenant—lead to the final repair at Darkav.';
  stage('eight-regions','mine-account').dialogue=['Bruni showed me where the waste went into the spring. We caused this. I don’t know how I missed it.',
    'The workers can fix the channel, but they’re scared of the Rootfather. I’ll stay with them. Please keep them safe.'];
  const side=(id:string,name:string,giverNpcId:string,prerequisiteQuestId:string,summary:string,objectives:QuestObjective[],resolution:string):QuestDefinition=>
    ({id,name,giverNpcId,kind:'side',prerequisiteQuestId,summary,objectives,resolution,rewardXp:340,rewardGold:100});
  quests.push(
    side('hunters-promise','The Hunter’s Promise','mira-fen','first-road',
      'Alice suspects someone is driving frightened animals toward Oakmere. Follow the snares, not the rumors.',[
        talk('tracks','mira-fen','Speak to Alice outside Oakmere, Trandum.','These animals were hurt before they reached the village. Look at the cuts. Someone’s been setting traps out there.','I found some wire near the southeast path. Will you come and look? I hope I’m wrong about this.'),
        inspect('adventure:poacher-snare','Find the snares southeast of Oakmere, Trandum.'),event('poacher-camp'),
        talk('home','mira-fen','Return to Alice outside Oakmere.','You found the traps? Good. Elara can take it from here. I’m just glad no one else got hurt.','Remember when you were scared of every wolf in the woods? Don’t look at me like that. You were.'),
      ],'The poachers are exposed. Alice and the watch remove their snares rather than blame the forest.'),
    side('home-for-two','A Home for Two','willowcross-keeper','first-road',
      'Two children have lost their parents. An uncle claims their inheritance, but their mother left different wishes.',[
        talk('hearth','willowcross-keeper','Speak to the keeper in Willowcross, Trandum.','The children hardly talk at supper anymore. I don’t know what to say to them.','Their uncle showed up asking for the deed to the house. Their mother kept papers at the old shelter southwest of town. I think we should see what she wrote.'),
        inspect('adventure:family-deed','Recover the family deed southwest of Willowcross, Trandum.'),
        {id:'protect-deed',type:'choice',targetId:'willowcross-keeper',amount:1,text:'Bring the deed to the keeper in Willowcross before confronting the uncle.',dialogue:[
          'Two men came asking where the children sleep. It frightened me. I won’t let them near the house, but what if they come back?'],choices:[
          {id:'watch',text:'Give Isabel a copy. Ask her to keep the children safe.',response:'I’ll get Tovan to sign as a witness. I want this settled without anyone getting hurt.',flag:'siblings-guarded-deed'},
          {id:'defend',text:'Keep the children here. I will confront his men at the roadside shelter.',response:'All right. The children can stay here. Please be careful out there.',flag:'siblings-defend-deed'},
        ]},
        {...event('false-inheritance'),completedByFlag:'siblings-guarded-deed'},
        {id:'belonging',type:'choice',targetId:'willowcross-keeper',amount:1,text:'Return to the keeper in Willowcross about the children’s future.',dialogue:['The widow wants to take them in. The children want to stay with her. I don’t know why their uncle won’t listen. What should we tell the watch?'],choices:[
          {id:'widow',text:'Honor their mother’s wishes. Let the children stay together with the widow.',response:'I’ll go to the hearing with them. They’re not going in there by themselves.',flag:'siblings-widow'},
          {id:'hearing',text:'Ask Isabel to hear the children and protect their home before settling the guardianship.',response:'Yes. The children should get a chance to speak. I’ll make sure someone listens.',flag:'siblings-hearing'},
        ]},
      ],'The children keep their home and each other. Their wishes, not the uncle’s hired swords, decide the hearing.'),
    side('soldier-return','The Soldier Who Never Returned','starhold-templar','crown-summons',
      'A mother still waits for a mountain soldier. Halla asks you to find an answer, not invent a comforting one.',[
        talk('waiting','starhold-templar','Speak with Halla beside Starhold, Nardorous.','His mother still puts his cloak by the door. Every morning. I can’t bring myself to tell her to stop.','His last post was west of the beacon. If there’s a letter there, I’d like to give it to her myself.'),
        inspect('adventure:soldier-letter','Find the soldier’s letter west of the pass beacon near Starhold, Nardorous.'),
        talk('letter','starhold-templar','Return the letter to Halla at Starhold.','He gave them the last of his firewood? Yes... yes, that’s just like him.','I’ll take the letter to his mother. I don’t know how she’ll take it. Could you stay a little while?'),
      ],'His mother learns that he stayed with the refugees. The letter gives her an answer, not a grand reward.'),
    side('tidewatch-debt','The Last Debt of Tidewatch','tidewatch-sailmaker','crown-summons',
      'A former pirate wants forgiveness from a sailor’s daughter. First, someone must tell her what actually happened.',[
        talk('debt','tidewatch-sailmaker','Visit Sailmaker House in Tidewatch, Portquill; travel there by boat.','He keeps saying he’s sorry, but he won’t tell me what he did. I don’t trust that.','Her father had a locket. I heard the smugglers took the other half to Salt Bay Outlook. That might tell us what really happened.'),
        inspect('adventure:sailor-locket','Search Salt Bay Outlook south of Tidewatch, Portquill.'),event('last-debt'),
        {id:'truth',type:'choice',targetId:'tidewatch-sailmaker',amount:1,text:'Return to Sailmaker House, Tidewatch, with the sailor’s account.',dialogue:['He sold her father’s route to the smugglers, then lied and blamed the storm. Now he wants her forgiveness. I don’t even know if she’ll want to speak to him.'],choices:[
          {id:'confession',text:'Give her the truth. Let her decide whether she wants his apology.',response:'I’ll give her the letter. He can wait until she decides whether she wants to answer.',flag:'pirate-confession'},
          {id:'watch',text:'Tell her what happened. Let the harbor watch hear it too.',response:'All right. I’ll make a copy for her and one for the harbor watch. He doesn’t get to hide what he did.',flag:'pirate-accountability'},
        ]},
      ],'The daughter receives the true account. Forgiveness belongs to her, not to the man asking for it.'),
  );
}
