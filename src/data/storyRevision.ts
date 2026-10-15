import type {QuestDefinition,QuestObjective} from '../game/types';
import {NPC_NAME_ALIASES} from './npcs';
import {rewriteNpcMentions} from './npcPresentation';

/** Authored revision, not keyword replacement: old objective/content IDs remain
 * save keys even where their old names refer to sacks or irrigation fittings. */
export function applyStoryRevision(quests:QuestDefinition[]){
  const quest=(id:string)=>quests.find(q=>q.id===id)!;
  const stage=(q:string,id:string,change:Partial<QuestObjective>)=>{
    const objective=quest(q).objectives.find(o=>o.id===id);
    if(!objective)throw new Error(`Missing authored story stage ${q}/${id}`);
    Object.assign(objective,change);
  };
  const talk=(q:string,id:string,text:string,...dialogue:string[])=>stage(q,id,{text,dialogue});
  const first='first-road',capital='crown-summons',murder='shadows-highmere',council='kingdom-divided',well='water-stops',regions='eight-regions';
  quest(first).summary='Raised by Aldren after his parents vanished, Leigneron has learned to live with unanswered questions. Then a family friend disappears on the eastern road carrying a dead messenger’s warning. Bring her home before following the royal seal into Highmere.';
  quest(first).resolution='Lena is alive. The murdered messenger carried a warning about the stolen ward survey. Varr’s royal seal connects the ambush to Highmere, and the survey bears your mother’s handwriting.';
  talk(first,'talk-aldren','Speak with Aldren in Oakmere about the missing traveler.',
    'You used to ask whether taking you in meant I had given up looking for them. No, lad. It meant someone had to be here when you woke.',
    'Your mother could mend a harness in the rain. Your father sang to frightened horses. Remember those things before the road turns them into a tale.',
    'Lena is missing. A rider reached her cart last night, bleeding badly. Ask at Marrow Inn. Whatever that rider carried, nobody gets to bury her with it.');
  talk(first,'morning-inn','Ask at Marrow Inn, Oakmere, about Lena and the wounded rider.',
    'Mind the kettle. I have burned myself twice listening for that door.',
    'Lena took a wounded messenger home from the road. He died before dawn. She wrapped his letter in her daughter’s shawl and went to find Aldren. Neither has come back.',
    'Her little ones are upstairs. I told them she was delayed. Do not make me tell them another lie.');
  talk(first,'field-witness','Meet Mira outside Oakmere and follow the ambush tracks.',
    'Three watchers by the broken cart. Lena is alive; I heard her arguing. Only she would scold a bandit for trampling a child’s shawl.',
    'There are more tracks toward the tower, but leave those for later. Bring her back first. You can glare at the horizon on the way home.');
  stage(first,'free-seed-cart',{text:'Defeat the three bandit watchers holding Lena beside the broken cart east of Oakmere.'});
  talk(first,'lena-safe','Speak to Lena after clearing the ambush east of Oakmere.',
    'Give me a moment. I thought I had stopped shaking.',
    'The rider kept saying, “They have the survey.” One of Varr’s men wanted the letter; another wanted no witnesses. Their captain ordered him to wait. I suppose I owe my life to an argument between murderers.',
    'Look beneath the torn sacks. I hid the letter there. Then tell Nella I am coming for my children.');
  stage(first,'cart-evidence',{text:'Recover the murdered messenger’s letter beneath the torn sacks beside Lena’s cart.'});
  talk(first,'seed-return','Tell Nella in Oakmere that Lena survived and her children are safe.',
    'Oh, thank the hearth. I can stop pretending to weed this same patch now.',
    'I will fetch her children from the inn. You take that letter to Aldren. Whoever frightened their mother will find this village a good deal less lonely than they expected.');
  talk(first,'watch-plan','Arrange protection for Lena with Oakmere’s guard captain.',
    'A dead messenger, an ambushed mother, and a royal seal. No, you are not imagining a connection.',
    'I will keep a watch near her children. Fifteen of Varr’s men hold the tower approaches in small patrols. Break their blockade before you read his dispatch. We need his buyer’s name, not merely his head.');
  quest(first).objectives.splice(quest(first).objectives.findIndex(o=>o.id==='tower-dispatch'),0,{
    id:'break-blockade',type:'kill',targetId:'road-bandit',enemyIds:['road-bandit'],killContentPrefix:'story-camp:road-blockade:',amount:15,rewardXp:320,
    text:'Defeat fifteen bandits on the watchtower approaches east of Oakmere, Trandum, before confronting Varr.',
  });
  stage(first,'tower-dispatch',{text:'Read the paid silence order outside Varr’s ruined tower east of Oakmere.'});

  quest(capital).name='A Seal Bought in Blood';quest(capital).chapter='Act II · The price of silence';
  quest(capital).summary='A murdered messenger carried proof that the crown’s own seal was used to steal the ward survey. Take the letter to the Royal Archive in Highmere, protect the surviving witness, and discover why someone wants entire families erased from the record.';
  talk(capital,'report','Bring the messenger’s letter to Renna inside Highmere’s Royal Archive.',
    'Set it down gently. I knew that handwriting before I knew yours.',
    'The messenger was bringing me names struck from the road rolls. Some were travelers. Some were children placed with other families after the relief crossing. Your name should have been among them.',
    'Your mother’s survey and those missing names traveled under the same seal. Ask Davin at River Customs who crossed after curfew.');
  talk(capital,'customs','Question Davin inside River Customs, Highmere, about the curfew crossing.',
    'I let a closed wagon through. A royal warrant, two guards, no lantern inside. I told myself not looking was the same as obeying.',
    'Tovin saw what was unloaded at the old weighhouse. His mother is at Morrow Kitchen. If you find him, tell him I should have stopped that wagon.');
  talk(capital,'households','Find Tovin’s mother inside Morrow Kitchen in Highmere’s Lower Ward.',
    'He is not a thief. He brought frightened people supper, and now the watch asks me which alley he sleeps in.',
    'I will answer questions after my son is safe. Not before. Find the torn warrant beside the well.');
  stage(capital,'witness',{text:'Investigate the weighhouse murder and bring Tovin safely to Morrow Kitchen in Highmere.'});
  stage(capital,'relief-charter',{text:'Resolve the displaced families’ petition in Highmere before seeking an audience at Crown Hall.'});
  talk(capital,'guard-report','Bring Tovin’s testimony to Captain Yselle at Highmere’s western watch.',
    'One of my men was found dead with Tovin’s knife beside him. The knife was stolen two days earlier. Someone expected us to stop asking there.',
    'I will guard the boy. Take the names to Crown Hall. If the order came from above me, I still want it read aloud.');
  talk(capital,'audience','Present the murder evidence to Lady Matilda inside Crown Hall, Highmere.',
    'A seal in my name bought a murder. You need not soften that for my comfort.',
    'The stolen survey marks wards in every region. The missing families lived beside them. Find out who removed the iron, and give the living a chance to speak before anyone writes their ending for them.');
  quest(murder).name='The Man Beneath the Weighhouse';quest(murder).chapter='Act II · A witness worth saving';
  quest(murder).summary='A watchman has been murdered and Tovin Reed is being hunted for it. Investigate the forged warrant, find the real witness, and decide whether justice is worth exposing him to those who ordered the killing.';
  talk(murder,'kitchen','Hear Mairin’s account inside Morrow Kitchen, Highmere.',
    'Tovin came home with blood on his cuffs. He had tried to help a dying watchman. That is the crime they have given him.',
    'He said the man was killed for refusing a wagon of prisoners. Look by the well for the warrant he dropped. Please, do not bring the watch to my door without him.');
  stage(murder,'receipt',{text:'Examine the blood-marked warrant beside the Lower Ward well in Highmere.'});
  talk(murder,'customs','Compare the altered warrant with Davin’s account at River Customs, Highmere.',
    'That signature is real. The order beneath it is not. Someone cut the lower half away and wrote over the old curfew pass.',
    'Pell saw the wagon turn toward the weighhouse. Go without an escort. He has good reason to run from a uniform.');
  talk(murder,'runner','Win Pell’s trust in Highmere’s Lower Ward.',
    'The last man who promised to keep this quiet came back with six guards. Tovin still has the bruise. What makes you different?');
  stage(murder,'yard',{text:'Search the old weighhouse in Highmere’s south lane for the watchman’s hidden testimony.'});
  talk(murder,'missing-worker','Find Tovin beside Highmere’s old weighhouse.',
    'Oswin was breathing when I found him. He kept trying to say his daughter’s name. I could not understand it.',
    'The tally under the stone is not cargo. It is people. Sevrin’s men called them debts. The watchman said no child was a debt, and one of them struck him.',
    'I will speak. But walk beside me until I see my mother. I cannot do that lane alone again.');
  talk(murder,'confront','Confront Sevrin inside Highmere’s Counting House with the watchman’s testimony.',
    'I signed transfers. I was told the displaced households had agreed to service. The captain who brought the warrants said their debts were lawful.',
    'No, I did not ask the children. You may stop looking at me like that. Take the tally to the crown. I will not pretend my seal was stolen.');
  stage(murder,'resolution',{text:'Decide with Mairin how to expose the murder without abandoning its witness.',dialogue:[
    'He wakes when boots pass the window. A public hearing may stop them ever hiding this again. It will also give every last one of them his face. What would you ask of your own son?'],choices:[
    {id:'public',text:'Ask Tovin to testify publicly, with Yselle beside him.',response:'Then he chooses when to speak. I will stand beside him too. The city will hear the dead watchman’s name.',flag:'grain-public-inquiry'},
    {id:'guard',text:'Seal his testimony with Yselle; arrest the named men quietly.',response:'He gets a night without strangers at the door. I know some will call it another secret. Let them ask me why.',flag:'grain-guarded-inquiry'},
  ]});
  quest(murder).resolution='Tovin reached his mother alive. The watchman’s murder and the illegal household transfers are recorded; your decision determines whether his testimony is public or held under protection.';

  quest(council).name='Names That Cannot Be Sold';quest(council).chapter='Act II · A household is not a debt';
  quest(council).summary='Families displaced by the broken wards were sold into service under royal warrants. Hear the households and the guilds, examine the adoption rolls, and make the crown choose between immediate release and a witnessed search for missing relatives.';
  talk(council,'archive','Examine the displaced families’ petition with Renna in Highmere’s Royal Archive.',
    'There is an adoption beside each crossed-out name. Some are loving homes. Some are a master paying a clerk to rename a servant.',
    'Aldren never paid for you. He came here three times demanding we keep your parents’ names in the book. Hear the market and the households before you let us draw another careless line.');
  talk(council,'merchant','Hear the guild’s position inside Market Hall, Highmere.',
    'My brother took in a girl after the floods. She calls him Father. If you cancel every household bond with one stroke, who explains that to her?',
    'Strike the debts out, yes. But let the children tell you where they belong. The guild can pay for riders to find their kin. It will cost us, and it should.');
  talk(council,'worker','Hear the families inside Weavers Row, Highmere.',
    'My sister works under a name she did not choose. Her employer says she can leave when she pays for the roof over her head.',
    'Please do not tell her to wait until every fine house has finished its inquiry. Some of us have been waiting since the flood.');
  stage(council,'tally',{text:'Examine the hidden household and adoption rolls at Highmere’s Relief Warehouse.'});
  talk(council,'petition','Present the household rolls at Crown Hall, Highmere.',
    'I can void the service warrants at once, or bind the guilds to return the missing and trace their kin under guard. A decree is quick. Finding a lost sister is not.',
    'Whichever we choose, the children keep a voice in where they live. I will not mend this by taking them away from loving homes.');
  stage(council,'decision',{text:'Choose how Highmere will free the displaced households.',dialogue:[
    'The guilds want time to search. The families have already waited years. Which promise do I make first?'],choices:[
    {id:'charter',text:'Void the forced-service debts now; open crown shelter to those leaving.',response:'The warrants are void at dawn. Crown rooms will shelter those who leave; riders will continue searching for their families.',flag:'relief-household-charter'},
    {id:'joint',text:'Bind the guilds to fund guarded reunions, with families overseeing each case.',response:'The debts are suspended. No employer may move a household while its relatives are sought; the families will sit beside the judges.',flag:'relief-joint-council'},
  ]});
  talk(council,'return','Bring the crown’s decision to Mairin at Morrow Kitchen, Highmere.',
    'I have made up the spare bed. Whoever comes through that door will not have to earn their supper.',
    'Tovin asked to help the search riders. I said yes. Then I sat down for a little while. Let me be proud and frightened at the same time.');
  talk(council,'closure','Return to Renna in Highmere’s Royal Archive.',
    'Your parents’ relief party carried children out of the flooded valley. Someone later used that same list to find the ward settlements.',
    'The missing iron, the warrants and Varr’s dispatch belong together. Take the rubbings to Narenthil. Ask the elves what was taken, not what you have been told to fear.');
  quest(council).resolution='The crown recognizes the displaced families as people rather than debts. Their freedom, shelter and search for relatives are now obligations the households themselves can enforce.';

  quest(well).name='The Well That Kept Their Names';quest(well).chapter='Cibar · A brother’s last witness';
  quest(well).rewardXp=400;quest(well).rewardGold=95;
  quest(well).summary='Celia’s brother died at Cibar’s well while hiding three travelers from the men who collected service debts. His death was called an accident. Recover what the travelers left behind and decide whether to expose their new names or protect the families who sheltered them.';
  talk(well,'grain-keeper','Speak with Celia at Cibar Plains about her brother’s death.',
    'They said he slipped. My brother worked that well for thirty years. He tied his boots before he tied his breeches.',
    'Three travelers slept in our stores the night he died. Iren helped them escape. Look at the well, then ask her what she was too frightened to tell me.');
  stage(well,'inspect-pump',{text:'Inspect the scored well mechanism at Cibar Plains for signs of the struggle.'});
  talk(well,'field-report','Ask Iren at Cibar Plains about the travelers she hid.',
    'He held the door while I took them through the fields. I heard the blow. I kept running. You can hate me after they are safe.',
    'Each left something in a different store: a broken clasp, a child’s ribbon, a signet pressed into wax. Bring all three to Asha. She knew who followed them.');
  stage(well,'fittings',{text:'Recover the three travelers’ keepsakes from Cibar Plains’ old stores.',amount:3});
  talk(well,'delivery','Bring the keepsakes to Asha at Cibar Plains.',
    'This clasp was cut, not broken. That wax carries a household seal from Highmere. Celia’s brother was killed for opening a door, not for coin.',
    'I can fit the clasp to the mark in the well housing. It will prove the struggle. The ribbon and seal may also reveal where the survivors live now.');
  stage(well,'decision',{text:'Decide with Celia what to reveal about the surviving travelers.',dialogue:[
    'I want his name cleared. I want someone to answer. But if naming the people he saved brings those men to another door, what have I done for him?'],choices:[
    {id:'public',text:'Publish the murder evidence, but let each survivor choose whether to be named.',response:'Then his courage is public, and their homes remain theirs. I will ask for justice without buying it with another frightened family.',flag:'cibar-public-water'},
    {id:'cooperative',text:'Keep their names with the sworn households; send only the evidence to Yselle.',response:'Iren will carry the sealed account. Let his killers worry about a knock at their own door for once.',flag:'cibar-growers-cooperative'},
  ]});
  stage(well,'repair-pump',{text:'Match the broken clasp to the scored well housing at Cibar Plains and record the murder evidence.'});
  talk(well,'return','Return to Celia at Cibar Plains with her brother’s last witness.',
    'I thought learning the truth would make me less angry. It has not. But I can speak about him without repeating their lie.',
    'Tell Agnes the travelers reached shelter. Tell her he held the door. That is the part I want the children to remember.');
  quest(well).resolution='The broken clasp proves Celia’s brother died defending fugitives. His name is cleared, the murder evidence goes to the watch, and your choice governs how the survivors’ identities are protected.';

  // Wider operations are separated patrols, not fifteen actors piled at
  // one rescue point. The opening rescue and the finite flagship deck stay small.
  const hunts:Array<[string,string,string]>=[
    ['greenward-clear','Clear fifteen thornlings along the stolen-binding trail near Greenward, Narenthil.','15'],
    ['grove-nests','Clear fifteen hostile spiders across the missing pilgrims’ approach near Moonfall, Narenthil.','15'],
    ['well-warband','Break fifteen Iron-Tusk warriors’ hold over the shared well approaches outside Red Mesa, Rindass.','15'],
    ['shelter-warband','Defeat fifteen Iron-Tusk warriors occupying the southern caravan shelter approaches in Rindass.','15'],
    ['spring-rescue','Clear fifteen hungry spirits along Bruni’s escape route at Rootwater, Druganwoods.','15'],
    ['frost-store-defense','Drive fifteen frost wolves from the stranded families’ bay approaches near Skallheim, Frostlands.','15'],
  ];
  for(const [id,text,amount] of hunts)stage(regions,id,{amount:Number(amount),text,rewardXp:110});
  talk(regions,'bowyer-witness','Hear the bowyer inside Bowyer Hall, Elarion, Narenthil.',
    'A pilgrim’s ribbon turned up in a thornling’s roots. The knot was tied by a child. Nobody here will cut it loose.',
    'Fifteen thornlings infest the Greenward approaches in scattered knots. Clear the trail so our searchers can follow it. The missing are not all dead until we have found them.');
  talk(regions,'field-scribe','Compare the broken seal with Lysa’s copy near Elarion, Narenthil.',
    'These tool marks were made from our side of the boundary. Someone the sentries trusted led the cutters in.',
    'I know what that accusation costs. My own teacher copied their safe-passage mark. I will give the lorekeeper my name as witness before I give you his as a suspect.');
  talk(regions,'moonfall-remedy','Ask the herbalist inside Moonfall’s cottage, Narenthil, about the vanished pilgrims.',
    'They left a supper pot warm enough to burn my fingers. That is not a party choosing to travel before dawn.',
    'Spiders have webbed the shaded approaches, fifteen across the nests. Clear those paths and read the ribbons. If a child hid there, I mean to find the place before the rain does.');
  talk(regions,'brief:starhold','Ask the quartermaster inside Starhold Stores, Nardorous, about the sabotaged beacon.',
    'Our beacon went dark before the convoy vanished. The watch calls it storm damage. I have packed enough winter journeys to know when a rope was cut.',
    'Halla brought the last porter down alive. Ask her what he heard before the light failed. Stonejaw did not learn to forge a watch order.');
  talk(regions,'porter-names','Question Sister Halla near Starhold’s beacon watch, Nardorous.',
    'The porter heard the alarm bell and turned back. The bell was ours. Someone used our own warning to send them into Stonejaw’s path.',
    'I will bury the dead after I have named them. Bring back his journal and signal satchel. The beacon must guide the next convoy, not betray it.');
  talk(regions,'brief:redmesa','Hear Ugra outside Red Mesa’s Clan Assembly, Rindass.',
    'Krag calls us weak for taking in travelers. My sister’s boy was carried home by a human. Let him tell her whose blood is worth sheltering.',
    'His warbands hold the shared well and the southern shelter: fifteen at each, scattered through their approaches. Break those holds before he can force the smaller clans to join him.');
  talk(regions,'well-forge','Question the forgewright inside Red Mesa’s Clan Forge, Rindass.',
    'Krag ordered me to mend the well chain. I found the ward binding sawn away beneath it. He knew the water would turn bitter.',
    'His own brother refused to drive the shelter families out. Now nobody will tell Ugra where that brother is buried. Do not call every orc on this road his soldier.');
  talk(regions,'brief:deepford','Bring the regional evidence inside Deepford’s Hall Archive, Druganwoods.',
    'The guild called those missing miners deserters. Bruni found their names scratched beneath the Rootwater seal. Then she stopped coming home.',
    'Fifteen spirits hold the escape approaches. Clear them and find her. I will argue with the guild when she can stand beside me.');
  talk(regions,'bruni-rescued','Speak with Bruni after clearing Rootwater’s escape route in Druganwoods.',
    'They sealed the waste gallery with men still inside it. My father was one of them. I spent twenty years being told he ran.',
    'The Rootfather grew around their spring. It is holding the names we buried. Take my survey. And read the river account beside it—your parents refused the same order to leave people behind.');
  stage(regions,'seed-road-repair',{text:'Resolve Celia’s murder inquiry at Cibar Plains so the surviving relief witnesses can testify safely.'});
  talk(regions,'mine-account','Arrange the reckoning inside Deepford’s Hall Archive before facing the Rootfather.',
    'Celia’s account and Bruni’s survey agree. People were made to disappear wherever the survey marked a ward.',
    'The guild will open the sealed gallery and name its dead. That is my promise, witnessed here. Give us a path past the guardian; I will not ask another miner to pay for our shame.');
  talk(regions,'brief:tidewatch','Speak inside Tidewatch’s Harbor Guild, Portquill; take a boat from Highmere if needed.',
    'The Salt King took more than iron. Families vanished from the passenger lists while their debts appeared in his freight books.',
    'I signed two of those departures. I believed the masters who called them willing workers. The sailmaker hid the copy that will prove otherwise. Ask her, then board the eastern gangplank south of Tidewatch.');
  talk(regions,'ship-warning','Meet the sailmaker inside Tidewatch’s Sailmaker House, Portquill.',
    'My niece was on that ship. No, I do not know whether she still is. I have spent every tide imagining both answers.',
    'Five crew hold the deck, including two boatswains. Clear them before searching the manifest by the cargo chest. It names a landing in the Frostlands. Bring me a place to start looking.');
  talk(regions,'brief:skallheim','Meet the hunter outside Skallheim, Frostlands; reach the island by boat.',
    'The people from that ship are here. They came ashore without boots, with children too frightened to cry. We put them in our own beds.',
    'The Wyrm drove fifteen wolves into the bay approaches. Clear them, then bring our signal lantern home. Their families need to see a light when the search boats return.');
  talk(regions,'winter-households','Visit Fish Traders Hall, Skallheim, Frostlands, and ask about the refugees.',
    'One little girl keeps saving the crust from her supper. She thinks we will send her away when she has eaten too much.',
    'Clear the fifteen wolves by the bay approaches. The lantern at the outlook will bring the next boat in. I cannot promise that child her mother is aboard. I can promise we will be waiting.');
  talk(regions,'ash-road-survivors','Question the warder outside Blackspire, Darkav; arrive at Ashen Landing by boat.',
    'The chainworks did not burn empty. The Seer barred the doors when the workers tried to flee. We broke one open; I still hear the other.',
    'The charge book names the buyers and the men who carried the keys. Get it from the burnt chainworks. Then we can stop calling this an accident.');
  talk(regions,'capital-return','Return the regional testimonies to Renna inside Highmere’s Royal Archive.',
    'The missing families were witnesses. Your mother’s survey showed where they lived; the forged warrants let the buyers move them without anyone asking why.',
    'Your parents were ordered to abandon their passengers at the ford. They refused. Someone removed the bridge pins before the last crossing. The river account names the paid cutters. It was murder, Leigneron. Not the road claiming a debt.',
    'Aldren kept your name out of the transfer book. He did not know why the crown was asking for it. He only knew he would not hand you over.',
    'I can give you their names and the witnesses. I cannot give you the years back. Take this home before you choose what to do with it.');
  talk(regions,'seal-account','Confront Sevrin inside Highmere’s Counting House about the vanished families.',
    'The first warrants were for adults who owed money. Then they included children. Then they included people who owed nothing at all.',
    'Oswin was my brother. He asked me to stop signing. I told him he did not understand what the city needed. They buried him before I admitted he understood better than I did.',
    'I knew. Not everything, not the ford—but enough. I kept signing because each signature made the last one harder to admit. Leave my name on every copy. I have no right to ask you for another kindness.');
  talk(regions,'return-aldren-after-regions','Return to Aldren in Oakmere with the truth about your parents.',
    'I knew they had ordered me to give you up. I did not know they had killed them. I should have told you about the order. Being afraid for you was not the same as protecting you.',
    'You were not a promise I made to dead friends. You were a child who hated boiled onions and needed someone at the door after a bad dream. You became my son long before I knew how to say it.',
    'Be angry with me if you must. There is a chair here while you are. Then speak to Orin. Varkhul still holds the last furnace, and those people deserve a road that does not demand another family.');
  quest(regions).summary='Follow the stolen survey through missing pilgrims, a sabotaged mountain convoy, divided orc clans, a sealed mine, captive families and the burned chainworks. Each region holds witnesses to one betrayal. Bring them home before facing the dragon at Darkav’s last ward.';
  quest(regions).resolution='The regions’ witnesses expose the forged warrants and the deliberate destruction of the relief crossing. Leigneron’s parents were murdered for refusing to abandon their passengers; Aldren’s adoption saved him from the same transfer rolls. Varkhul remains the final obstacle to restoring the wards.';
  talk(regions,'report:elarion','Return to the Lore Archive in Elarion, Narenthil, with the pilgrims’ evidence.',
    'Our rangers followed the cleared approach. Three pilgrims were hiding above the river. The child who tied that ribbon is among them. Two others will not come home.',
    'Lysa has asked that her teacher be heard before the whole grove. We will not let our shame close another path. Take the binding’s rubbing to Starhold; the cutters traveled under a beacon pass.');
  talk(regions,'report:starhold','Return to Quartermaster Stores, Starhold, Nardorous, after opening the pass.',
    'The first convoy has reached the hearth. Halla rang the bell herself this time. The surviving porter would not let anyone else carry the names.',
    'The false alarm order came with a freight payment from Rindass. Ask at Red Mesa. If someone bought a mountain watch, the clans should know who is spending their coin.');
  talk(regions,'report:redmesa','Report to Ugra outside Red Mesa, Rindass, after breaking Krag’s hold.',
    'We found his brother’s cloak in the southern shelter. A witness saw him taken toward the river, alive. I will send riders; no chief gets to declare his own kin forgotten.',
    'The forge marked the stolen binding before it left. Deepford’s guild took delivery. Let them tell you what was carried under that mark—and who was told not to ask.');
  talk(regions,'river-witness','Visit Boatwright Hall in Deepford, Druganwoods, to ask about the relief crossing.',
    'Your father built a landing for our stranded crews. Sang while he worked, as though the rain were keeping time. I remember because I was frightened, and he knew it.',
    'When the account called it a flood, I believed it. Bruni found another witness beneath the old seal. Bring her out, lad. I have been living with the wrong answer for years.');
  talk(regions,'report:deepford','Return Bruni’s testimony to Deepford’s Hall Archive, Druganwoods.',
    'The gallery will be opened. Bruni insisted on writing the names before we agreed on the words of our apology. She was right.',
    'The passenger transfers went out by sea with the stolen bindings. Take a boat from Highmere’s River Quay to Tidewatch, Portquill. Ask its harbor master what he signed.');
  stage(regions,'harbor-account',{text:'Choose how Tidewatch’s Harbor Guild will expose the captive-passenger trade.',dialogue:[
    'If every freight list is posted, relatives can find one another. So can the masters who bought them. The guild can hold the names privately, but I understand why nobody trusts us with another secret.'],choices:[
    {id:'public',text:'Post the routes and crimes; publish names only with each family’s consent.',response:'Every quay will know what we carried. The families decide what the boards say about them. I will put my own signature first.',flag:'portquill-public-cargo'},
    {id:'bond',text:'Make the guild fund guarded reunions; give the names to household witnesses.',response:'The guild pays, and the families keep the lists. We have forfeited the right to be our own witnesses.',flag:'portquill-guild-bond'},
  ]});
  talk(regions,'report:tidewatch','Return the passenger manifest to the Harbor Guild in Tidewatch, Portquill.',
    'The sailmaker has gone to pack. Her niece’s name is on the Skallheim landing list. I have put a berth aside. It is not forgiveness, but it is something I can do without asking for it.',
    'Take passage to Skallheim in the Frostlands. Carry the copied names. Ask the trader which families are still waiting for a search boat.');
  talk(regions,'report:skallheim','Return to the hunter outside Skallheim, Frostlands, after confronting the Wyrm.',
    'A boat came in under the lantern. There was a woman on the quay who laughed and cried so hard the child in her arms began doing both. The sailmaker found her niece.',
    'The shard beneath the Wyrm’s scales bears a Darkav forge mark. Take a boat to Ashen Landing, then follow the ash road north to Blackspire. Those chains were made by hands, not weather.');
  talk(regions,'report:blackspire','Return to Forge Hall, Blackspire, Darkav, with the Seer’s charge book.',
    'The doors will never be barred against our own crews again. I have given the keys to the workers’ households. If I ask for them back, remind me why.',
    'Bring this book to Highmere’s Royal Archive. Varkhul still guards the furnace shelf, but before you face him you deserve the whole truth about that last crossing.');
  stage('royal-guard-trial','report',{dialogue:[
    'Iven found the false warrant beneath a loose board. You kept watch while he looked, instead of rushing off to be seen doing something brave.',
    'The storehouse is safe for the witnesses tonight. I can use a roadwarden who knows that waiting beside someone is work too.']});
  // Newly authored dialogue uses stable IDs; retain this project's localized
  // display identities rather than reintroducing obsolete speaker names.
  for(let i=0;i<quests.length;i++)quests[i]=rewriteNpcMentions(quests[i],NPC_NAME_ALIASES);
}
