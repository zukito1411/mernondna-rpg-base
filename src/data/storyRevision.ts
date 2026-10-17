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
    'You used to ask why I stopped searching for your parents. I didn’t stop because I gave up. I just couldn’t leave you here alone.',
    'Your mother was always fixing things, even when she was exhausted. Your father sang terribly. You would’ve laughed. I miss them.',
    'Lena’s missing. Someone brought a badly hurt rider to her cart last night. Sena at the inn might know more. I’m worried, Leigneron.');
  talk(first,'morning-inn','Ask at Marrow Inn, Oakmere, about Lena and the wounded rider.',
    'Mind the kettle. I’m sorry, I haven’t been paying attention. I keep looking at the door.',
    'Lena brought in a wounded rider. He died last night. She took his letter, wrapped it in her daughter’s shawl, and went looking for Edmund. I haven’t seen her since.',
    'Her children are upstairs asking when she’ll be home. I’ve been telling them she’s late. Please find her.');
  talk(first,'field-witness','Meet Mira outside Oakmere and follow the ambush tracks.',
    'I found Lena’s cart. She’s alive. There are three men watching her, and I heard her arguing with one of them.',
    'There are more tracks leading to the tower, but Lena needs us now. We’ll worry about the others after she’s safe.');
  stage(first,'free-seed-cart',{text:'Defeat the three bandit watchers holding Lena beside the broken cart east of Oakmere.'});
  talk(first,'lena-safe','Speak to Lena after clearing the ambush east of Oakmere.',
    'Just... give me a moment. I can’t stop shaking.',
    'The rider kept saying they’d taken the survey. Varr’s men were arguing about whether to kill me. I thought I was going to die.',
    'I hid the letter under the torn sacks. Please get it, then tell Nella I’m coming home. My children must be terrified.');
  stage(first,'cart-evidence',{text:'Recover the murdered messenger’s letter beneath the torn sacks beside Lena’s cart.'});
  talk(first,'seed-return','Tell Nella in Oakmere that Lena survived and her children are safe.',
    'She’s alive? Oh, thank goodness. I’ve been out here worrying all morning.',
    'I’ll get the children from the inn. Show that letter to Edmund. He needs to know what happened.');
  talk(first,'watch-plan','Arrange protection for Lena with Oakmere’s guard captain.',
    'A dead rider, Lena’s ambush, and that royal seal... I don’t think it’s a coincidence either.',
    'The inn has guards at both doors now. Varr’s men are scattered across the tower road; a lone rider would never get through. I need to know who hired them, not just how many you put down.');
  quest(first).objectives.splice(quest(first).objectives.findIndex(o=>o.id==='tower-dispatch'),0,{
    id:'break-blockade',type:'kill',targetId:'road-bandit',enemyIds:['road-bandit'],killContentPrefix:'story-camp:road-blockade:',amount:15,rewardXp:320,
    text:'Defeat fifteen bandits on the watchtower approaches east of Oakmere, Trandum, before confronting Varr.',
  });
  stage(first,'tower-dispatch',{text:'Read the paid silence order outside Varr’s ruined tower east of Oakmere.'});

  quest(capital).name='A Seal Bought in Blood';quest(capital).chapter='Act II · The price of silence';
  quest(capital).summary='A murdered messenger carried proof that the crown’s own seal was used to steal the ward survey. Take the letter to the Royal Archive in Highmere, protect the surviving witness, and discover why someone wants entire families erased from the record.';
  talk(capital,'report','Bring the messenger’s letter to Renna inside Highmere’s Royal Archive.',
    'Let me see that. Wait... I know this handwriting. I haven’t seen it in years.',
    'These are the inspector’s notes. Missing iron, changed cargo records... and a copy of your mother’s survey. Why were these together?',
    'The same seal is on the list of missing families. Davin was on duty at River Customs that night. He might remember the wagon.');
  talk(capital,'customs','Question Davin inside River Customs, Highmere, about the curfew crossing.',
    'I let the wagon through. It had a royal warrant and two guards. I didn’t look inside. I should have.',
    'Tovin saw them unloading it at the weighhouse. His mother’s at Morrow Kitchen. If you find him... tell him I’m sorry.');
  talk(capital,'households','Find Tovin’s mother inside Morrow Kitchen in Highmere’s Lower Ward.',
    'My son isn’t a thief! He was feeding those people. Now the guards keep coming here and asking where he’s hiding.',
    'Please, tell me you have seen Tovin. No? Then I have nothing useful to say about a warrant. Pell said someone tore a paper beside the well. That is all I know.');
  stage(capital,'witness',{text:'Investigate the weighhouse murder and bring Tovin safely to Morrow Kitchen in Highmere.'});
  stage(capital,'relief-charter',{text:'Resolve the displaced families’ petition in Highmere before seeking an audience at Crown Hall.'});
  talk(capital,'guard-report','Bring Tovin’s testimony to Captain Yselle at Highmere’s western watch.',
    'One of my guards was killed. Tovin’s knife was beside him, but it was stolen days earlier. Someone wanted us to blame that boy.',
    'My men can keep the boy safe. Those signatures are from an office above mine; I want to see what happens when they are read in the crown hall.');
  talk(capital,'audience','Present the murder evidence to Lady Matilda inside Crown Hall, Highmere.',
    'That’s my seal. Someone used it to order a murder. I need to know how this happened.',
    'The missing families lived near the ward-stones. I don’t think that’s an accident. We need to find out who took the iron.');
  quest(murder).name='The Man Beneath the Weighhouse';quest(murder).chapter='Act II · A witness worth saving';
  quest(murder).summary='A royal records inspector was murdered beside Highmere’s river. Tovin Reed saw the killers and is being hunted. Follow the altered warrant, protect the witness, and discover who wanted the ward-iron inquiry silenced.';
  talk(murder,'kitchen','Hear Mairin’s account inside Morrow Kitchen, Highmere.',
    'Tovin came home with blood on his sleeves. He was trying to help the injured inspector, but now the watch thinks he killed him.',
    'He said the inspector tried to stop a wagon full of prisoners. Tovin dropped a warrant by the well. Please, just help me find my son.');
  stage(murder,'receipt',{text:'Examine the blood-marked warrant beside the Lower Ward well in Highmere.'});
  talk(murder,'customs','Compare the altered warrant with Davin’s account at River Customs, Highmere.',
    'That’s a real signature, but the rest of the warrant was changed. Someone cut off the bottom and wrote a new order.',
    'Pell saw the wagon turn toward the weighhouse. Don’t take a guard with you. He’s terrified of them.');
  talk(murder,'runner','Win Pell’s trust in Highmere’s Lower Ward.',
    'Last time I trusted someone, he came back with six guards. Tovin got hurt. Why should I trust you?');
  stage(murder,'yard',{text:'Search the old weighhouse in Highmere’s south lane for the inspector’s hidden testimony.'});
  talk(murder,'missing-worker','Find Tovin beside Highmere’s old weighhouse.',
    'Oswin was still breathing when I found him. He kept trying to say something about his daughter. I couldn’t understand him.',
    'That list under the stone has people’s names on it. Even children. Oswin told the men it was wrong. That’s when they hit him.',
    'I’ll tell the truth. Just don’t make me walk back alone. I need to see my mother.');
  talk(murder,'confront','Confront Sevrin inside Highmere’s Counting House with the inspector’s testimony.',
    'That’s a relief warrant. I sign dozens of them. You can’t blame me for murder because a scared boy saw one of my clerks.',
    'Talk to the captain if you want. I have nothing else to say to you.');
  stage(murder,'resolution',{text:'Decide with Mairin how to expose the murder without abandoning its witness.',dialogue:[
    'Tovin wakes up every time someone walks past the window. I want everyone to know the truth. But if he speaks in public, those men will know his face. What should we do?'],choices:[
    {id:'public',text:'Ask Tovin to testify publicly, with Yselle beside him.',response:'All right. I’ll ask him if he’s ready. If he wants to speak, I’ll be right there with him.',flag:'grain-public-inquiry'},
    {id:'guard',text:'Seal his testimony with Yselle; arrest the named men quietly.',response:'Then let Yselle keep the papers for now. I just want my son to sleep without being frightened.',flag:'grain-guarded-inquiry'},
  ]});
  quest(murder).resolution='Tovin reached his mother alive. The inspector’s murder and the illegal household transfers are recorded; your decision determines whether his testimony is public or held under protection.';

  quest(council).name='Names That Cannot Be Sold';quest(council).chapter='Act II · A household is not a debt';
  quest(council).summary='Families displaced by the broken wards were sold into service under royal warrants. Hear the households and the guilds, examine the adoption rolls, and make the crown choose between immediate release and a witnessed search for missing relatives.';
  talk(council,'archive','Examine the displaced families’ petition with Renna in Highmere’s Royal Archive.',
    'Some of these children were taken in by families who love them. Others were sold. It’s all written in the same book. I feel sick looking at it.',
    'Edmund came here three times to make sure your parents stayed in the records. He was so angry. I still remember it. We need to hear what the families want before we change anything.');
  talk(council,'merchant','Hear the guild’s position inside Market Hall, Highmere.',
    'My brother adopted a little girl after the floods. She calls him Dad. I’m scared someone will take her away if we change these papers carelessly.',
    'The debts have to go. But please ask the children where they want to live. The guild can pay for the search for their relatives.');
  talk(council,'worker','Hear the families inside Weavers Row, Highmere.',
    'My sister’s working under a different name. They won’t let her leave until she pays a debt she never agreed to.',
    'Please don’t tell her to wait any longer. We’ve already been looking for her for years.');
  stage(council,'tally',{text:'Examine the hidden household and adoption rolls at Highmere’s Relief Warehouse.'});
  talk(council,'petition','Present the household rolls at Crown Hall, Highmere.',
    'I can cancel those warrants today. But the guilds know where some of the missing people were sent. I need them to help us bring people home.',
    'Whatever we decide, we have to ask the children what they want. I won’t take them from good homes without listening.');
  stage(council,'decision',{text:'Choose how Highmere will free the displaced households.',dialogue:[
    'The families want their loved ones back now. The guilds say they need more time. I don’t know who to believe anymore.'],choices:[
    {id:'charter',text:'Void the forced-service debts now; open crown shelter to those leaving.',response:'Then I’ll cancel the warrants tomorrow morning. We’ll open the spare rooms and keep searching for anyone still missing.',flag:'relief-household-charter'},
    {id:'joint',text:'Bind the guilds to fund guarded reunions, with families overseeing each case.',response:'All right. Nobody is being moved while we find their families. I’ll make sure the families are there when decisions are made.',flag:'relief-joint-council'},
  ]});
  talk(council,'return','Bring the crown’s decision to Mairin at Morrow Kitchen, Highmere.',
    'I’ve made up the spare room. Anyone who needs somewhere to sleep can stay here.',
    'Tovin wants to help look for the missing families. I said yes, but I’m worried sick. I suppose that’s being his mother.');
  talk(council,'closure','Return to Renna in Highmere’s Royal Archive.',
    'Your parents helped families escape the flood. Someone later used the list of those families to find the old ward-stones. I’m sorry, Leigneron.',
    'These papers all mention the same iron. I’ve seen similar marks in Narenthil’s records. Maybe Ilyra can tell us more.');
  quest(council).resolution='The crown recognizes the displaced families as people rather than debts. Their freedom, shelter and search for relatives are now obligations the households themselves can enforce.';

  quest(well).name='The Well That Kept Their Names';quest(well).chapter='Cibar · A brother’s last witness';
  quest(well).rewardXp=400;quest(well).rewardGold=95;
  quest(well).summary='Celia’s brother died at Cibar’s well while hiding three travelers from the men who collected service debts. His death was called an accident. Recover what the travelers left behind and decide whether to expose their new names or protect the families who sheltered them.';
  talk(well,'grain-keeper','Speak with Celia at Cibar Plains about her brother’s death.',
    'They said my brother fell at the well. He worked there for thirty years. He knew every stone. I never believed it.',
    'There were three travelers hiding in the storehouse that night. Iren helped them escape. She knows something about his death, but she won’t talk to me.');
  stage(well,'inspect-pump',{text:'Inspect the scored well mechanism at Cibar Plains for signs of the struggle.'});
  talk(well,'field-report','Ask Iren at Cibar Plains about the travelers she hid.',
    'He kept the men at the door while I took the travelers out through the fields. I heard him get hit. I was so scared I kept running. I’m sorry.',
    'They left things behind in the old sheds. A broken clasp, a ribbon, and a wax seal. Asha might recognize them. She knew the men who came after us.');
  stage(well,'fittings',{text:'Recover the three travelers’ keepsakes from Cibar Plains’ old stores.',amount:3});
  talk(well,'delivery','Bring the keepsakes to Asha at Cibar Plains.',
    'Someone cut this clasp with a blade. And that wax seal’s from Highmere. He died trying to help those people. I think we can prove it.',
    'The clasp fits the damage on the well. I’ll write down what I found. The ribbon might tell us where the children ended up.');
  stage(well,'decision',{text:'Decide with Celia what to reveal about the surviving travelers.',dialogue:[
    'I want everyone to know my brother didn’t fall. He was murdered. But I’m scared those men will hurt the people he saved. What do we do?'],choices:[
    {id:'public',text:'Publish the murder evidence, but let each survivor choose whether to be named.',response:'All right. We can tell people what happened without naming the families. They should get to choose if they want to speak.',flag:'cibar-public-water'},
    {id:'cooperative',text:'Keep their names with the sworn households; send only the evidence to Yselle.',response:'Iren can take the evidence to Yselle. I’ll keep the families' names safe. Thank you for understanding.',flag:'cibar-growers-cooperative'},
  ]});
  stage(well,'repair-pump',{text:'Match the broken clasp to the scored well housing at Cibar Plains and record the murder evidence.'});
  talk(well,'return','Return to Celia at Cibar Plains with her brother’s last witness.',
    'I thought I’d feel better knowing what happened. I don’t. I’m still angry. But at least people will know he didn’t just fall.',
    'Would you tell Agnes the travelers got away safely? I want the children to know their uncle helped them.');
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
    'We found a child’s ribbon caught in one of those thornlings. It belongs to one of the missing pilgrims. I’m scared to think why it’s there.',
    'There are thornlings all along the Greenward trail. My searchers can’t get through. Please help us reach the missing pilgrims.');
  talk(regions,'field-scribe','Compare the broken seal with Lysa’s copy near Elarion, Narenthil.',
    'These cuts were made with our own tools. Someone must have let those men past the sentries. I can’t believe it.',
    'My teacher copied a pass for them. I saw it. It hurts to say that, but I’ll tell Ilyra myself.');
  talk(regions,'moonfall-remedy','Ask the herbalist inside Moonfall’s cottage, Narenthil, about the vanished pilgrims.',
    'Their dinner was still warm when I got there. They wouldn’t have left like that unless something frightened them.',
    'The shaded paths are full of spiders and webbing. I think one of the children hid there. Please help us search before the rain washes away the tracks.');
  talk(regions,'brief:starhold','Ask the quartermaster inside Starhold Stores, Nardorous, about the sabotaged beacon.',
    'The beacon went out just before the convoy disappeared. Everyone says it was the storm, but that rope was cut. I saw it.',
    'Halla found one of the porters alive. He said someone rang the wrong signal. She knows more than I do.');
  talk(regions,'porter-names','Question Sister Halla near Starhold’s beacon watch, Nardorous.',
    'They heard our bell and turned back. Somebody gave the wrong signal. I can’t stop thinking about what happened to them.',
    'I will bury the dead when I have named every one. His journal and satchel are still on the ridge. I want to know who changed the signal before another family climbs that pass.');
  talk(regions,'brief:redmesa','Hear Ugra outside Red Mesa’s Clan Assembly, Rindass.',
    'Krag says we shouldn’t help outsiders. A human carried my nephew home after he was hurt. I won’t forget that.',
    'His men have taken over the well and the southern shelter. The smaller clans are too frightened to argue. We need to get them out.');
  talk(regions,'well-forge','Question the forgewright inside Red Mesa’s Clan Forge, Rindass.',
    'Krag told me to repair the well chain. When I got there, the old binding had been cut off. He knew. I swear he knew.',
    'Even Krag’s brother tried to stop him. They killed him for it. Please don’t think everyone here supports Krag.');
  talk(regions,'brief:deepford','Bring the regional evidence inside Deepford’s Hall Archive, Druganwoods.',
    'The guild says the missing miners ran away. Bruni found their names at Rootwater, and now she’s missing too. I’m scared for her.',
    'There are spirits all along the path where she went. I can’t send another miner in there alone. Please help me find her.');
  talk(regions,'bruni-rescued','Speak with Bruni after clearing Rootwater’s escape route in Druganwoods.',
    'They closed the gallery while men were still inside. My father was one of them. For years they told me he’d run away.',
    'The Rootfather started growing after the spring was poisoned. Here’s my survey. I found an old account about your parents' last crossing too. I think you should read it.');
  stage(regions,'seed-road-repair',{text:'Resolve Celia’s murder inquiry at Cibar Plains so the surviving relief witnesses can testify safely.'});
  talk(regions,'mine-account','Arrange the reckoning inside Deepford’s Hall Archive before facing the Rootfather.',
    'Celia’s story matches what Bruni found. People went missing near those old wards. This wasn’t an accident.',
    'I’ll make the guild open that gallery. Those families deserve to know what happened. The workers can repair the spring once it’s safe to go back.');
  talk(regions,'brief:tidewatch','Speak inside Tidewatch’s Harbor Guild, Portquill; take a boat from Highmere if needed.',
    'The Salt King wasn’t just stealing iron. People went missing from those ships. I’ve seen their names in his cargo books.',
    'Those are my signatures. I told myself the passengers were willing. Orren hid a copy of the manifest; I could not bear to keep it here. There is another aboard the Salt King’s ship.');
  talk(regions,'ship-warning','Meet the sailmaker inside Tidewatch’s Sailmaker House, Portquill.',
    'My niece was on that ship. I don’t know if she’s alive. Every time a boat comes in, I look for her.',
    'The boatswains guard the ship’s cargo hold. The manifest’s kept by the cargo chest. I think it says where they took the passengers. Please, I need to know.');
  talk(regions,'brief:skallheim','Meet the hunter outside Skallheim, Frostlands; reach the island by boat.',
    'Some people from that ship made it here. They had no shoes, and the children were freezing. We took them into the longhouse.',
    'The wolves have taken over the bay path since the Wyrm came down. We lost our signal lantern out there too. Without it the search boats can’t find us.');
  talk(regions,'winter-households','Visit Fish Traders Hall, Skallheim, Frostlands, and ask about the refugees.',
    'There’s a girl staying with us who hides bread in her pockets. She thinks we’ll throw her out if she eats too much. I don’t know how to reassure her.',
    'The wolves have driven the hunters off the bay path. Our lantern is still out there. I cannot promise that child her mother is on the next boat. I can promise we will be waiting when it comes.');
  talk(regions,'ash-road-survivors','Question the warder outside Blackspire, Darkav; arrive at Ashen Landing by boat.',
    'There were people inside when the chainworks caught fire. The doors were locked. We broke one open, but the others... I can still hear them shouting.',
    'The charge book was left inside. It has the names of the men who locked those doors. I want their families to know the truth.');
  talk(regions,'capital-return','Return the regional testimonies to Renna inside Highmere’s Royal Archive.',
    'The missing families lived near the ward-stones. Your mother’s survey showed where they were. Someone used that information to find them and take them away.',
    'Leigneron... I found out what happened to your parents. There was a flood. They went back for the last families, and the bridge collapsed. I’m so sorry.',
    'Edmund kept your name out of the records. He didn’t know why the crown wanted it. He just knew he wasn’t letting anyone take you.',
    'I know this doesn’t bring them back. I’m sorry. You should go home and talk to Edmund before you do anything else.');
  talk(regions,'seal-account','Confront Sevrin inside Highmere’s Counting House about the vanished families.',
    'At first, the warrants were for debts. Then people started adding children to the lists. Some of them owed nothing. I knew it was wrong.',
    'Oswin was my brother. He begged me to stop signing those papers. I told him he didn’t understand. Now he’s dead, and I can’t tell him I was wrong.',
    'I knew people were getting hurt. I kept signing anyway. I was scared to admit what I’d done. Don’t leave my name out of the records.');
  talk(regions,'return-aldren-after-regions','Return to Aldren in Oakmere with the truth about your parents.',
    'I always hoped they’d made it somewhere. I know that sounds foolish now. I just couldn’t bear to believe they were gone.',
    'You know, you used to hide your onions under the table. Thought I wouldn’t notice. I don’t know if I’ve ever said this properly, but you’re my son. You always have been.',
    'It’s all right if you’re angry with me. I’ll be here when you want to talk. And please, don’t rush off after Varkhul before you’ve had some rest.');
  quest(regions).summary='Follow the stolen survey through missing pilgrims, a sabotaged mountain convoy, divided orc clans, a sealed mine, captive families and the burned chainworks. Each region holds witnesses to one betrayal. Bring them home before facing the dragon at Darkav’s last ward.';
  quest(regions).resolution='The regions’ witnesses expose the stolen ward-iron trade. Leigneron learns that his parents died rescuing families from a flood. Varkhul remains the final obstacle to restoring the wards.';
  talk(regions,'report:elarion','Return to the Lore Archive in Elarion, Narenthil, with the pilgrims’ evidence.',
    'Our rangers found three pilgrims by the river. The child who lost that ribbon is safe. But two of the others... we were too late.',
    'Lysa says her teacher helped those men. She’s asked for a hearing. They used a pass from Starhold, so I’ll send a copy of the evidence there.');
  talk(regions,'report:starhold','Return to Quartermaster Stores, Starhold, Nardorous, after opening the pass.',
    'The first wagons got through! Halla rang the bell when she saw them. She was crying. I’m not supposed to tell you that.',
    'The false signal was paid for by someone in Rindass. There’s a name on this receipt. Ugra at Red Mesa might recognize it.');
  talk(regions,'report:redmesa','Report to Ugra outside Red Mesa, Rindass, after breaking Krag’s hold.',
    'We found his brother’s cloak at the shelter. Someone saw him alive near the river. I’m sending people to look. I owe him that much.',
    'The iron from our forge went to Deepford. That’s what the records say. I don’t know what they did with it after that.');
  talk(regions,'river-witness','Visit Boatwright Hall in Deepford, Druganwoods, to ask about the relief crossing.',
    'Your father helped us build a landing when the river flooded. He kept singing while we worked. I was scared, and I think he was trying to cheer us up.',
    'Bruni found the ferryman’s account. It mentions your parents. Please find her. I think there’s something in it you should know.');
  talk(regions,'report:deepford','Return Bruni’s testimony to Deepford’s Hall Archive, Druganwoods.',
    'We’re opening the old gallery. Bruni asked us to list everyone who died there first. She’s right. Their families deserve to know.',
    'Some of the missing families were put on ships bound for Tidewatch. We found the same mark on the cargo papers. Jessa at the harbor might know which ships took them.');
  stage(regions,'harbor-account',{text:'Choose how Tidewatch’s Harbor Guild will expose the captive-passenger trade.',dialogue:[
    'If we put all the names up in public, the families might find each other. But the people who bought them could find them too. I don’t know what the right answer is.'],choices:[
    {id:'public',text:'Post the routes and crimes; publish names only with each family’s consent.',response:'All right. We’ll tell the harbors what happened, but the families can choose whether their names are shown. I’ll sign the notice myself.',flag:'portquill-public-cargo'},
    {id:'bond',text:'Make the guild fund guarded reunions; give the names to household witnesses.',response:'The guild will pay for the search. The families can keep the lists. I understand why they don’t trust us.',flag:'portquill-guild-bond'},
  ]});
  talk(regions,'report:tidewatch','Return the passenger manifest to the Harbor Guild in Tidewatch, Portquill.',
    'Orren found his niece’s name on a list from Skallheim. I reserved a place on the next boat. I hope they find her.',
    'There are names here I cannot account for. Eyvind at Skallheim receives the search boats. If anyone has heard from those families, it will be him.');
  talk(regions,'report:skallheim','Return to the hunter outside Skallheim, Frostlands, after confronting the Wyrm.',
    'A boat came in last night, and Orren’s niece was on it. He just held her and cried. I don’t think I’ve ever seen him like that.',
    'There’s a forge mark on the shard from the Wyrm. It looks like the iron they make at Blackspire. Maybe the smiths there can explain it.');
  talk(regions,'report:blackspire','Return to Forge Hall, Blackspire, Darkav, with the Seer’s charge book.',
    'I gave the workers' families the keys to the chainworks. Nobody should’ve been locked in there. I won’t let that happen again.',
    'The names in this book belong beside the accounts in Highmere. And Leigneron... Renna has found something about the last crossing. You deserve to hear it from her, not from a rumor.');
  stage('royal-guard-trial','report',{dialogue:[
    'Iven found the warrant under a floorboard. Thanks for keeping an eye on the door while he searched. We couldn’t have done it safely without you.',
    'The witnesses are safe tonight. You did well. If you ever want to work with the watch again, come and see me.']});
  // Newly authored dialogue uses stable IDs; retain this project’s localized
  // display identities rather than reintroducing obsolete speaker names.
  for(let i=0;i<quests.length;i++)quests[i]=rewriteNpcMentions(quests[i],NPC_NAME_ALIASES);
}
