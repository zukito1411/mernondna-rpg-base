import type {QuestDefinition,QuestObjective} from '../game/types';
import {ROAD_CHAPTERS,ROAD_SIDE_QUESTS,WORLD_STORY_QUESTS} from './roadStories';

/** Last authored layer, after legacy campaign/adventure transforms. IDs remain
 * stable; prose is rewritten here rather than filtered by banned keywords. */
export function applyStoryExpansion(quests:QuestDefinition[]){
  const quest=(id:string)=>quests.find(q=>q.id===id)!;
  const edit=(id:string,stage:string,change:Partial<QuestObjective>)=>{
    Object.assign(quest(id).objectives.find(o=>o.id===stage)!,change);
  };
  for(const chapter of ROAD_CHAPTERS){
    const target=quest(chapter.questId),index=target.objectives.findIndex(o=>o.id===chapter.before);
    // All insertion anchors are retained legacy IDs, checked by the focused
    // catalogue tests. Do not append a misplaced battle after the ending.
    if(index>=0)target.objectives.splice(index,0,...chapter.objectives);
  }
  quests.push(...ROAD_SIDE_QUESTS,...WORLD_STORY_QUESTS);
  quest('shadows-highmere').prerequisiteObjective={questId:'crown-summons',objectiveId:'households'};
  // A stage dependency, not a dependency on the entire last-ward quest (which
  // itself waits for the dragon). This also redirects active older saves to
  // preparation without erasing their earned dragon/quest progress.
  quest('returning-ember').objectives.splice(1,0,{id:'roads:final-forge-ready',type:'quest',targetId:'the-last-ward',
    targetObjectiveId:'covenant-forge',amount:1,text:'Complete the preparations with Etheldreda in Oakmere, Cecily in Highmere and Vexa in Blackspire before the final dragon approach.'});
  quest('first-road').summary='A dying rider reaches Oakmere. Before his warning can be understood, Lena disappears and a child hears a bell beneath the orchard. Follow the compass through frightened beasts, a village raid and the opened stones beneath Varr’s road.';
  edit('first-road','talk-aldren',{dialogue:[
    'You hear that? The bell. No, not the shrine bell. The one under the orchard. I heard it before dawn, and there isn’t a bell there.',
    'Lena brought a wounded rider to the inn last night. Now she’s missing. Hawise is trying not to frighten her children. Go to her. Alice is already looking for tracks.',
    'And take your compass. The rider asked for the child whose needle would not settle. I don’t know how he knew about you.'],
    text:'Speak with Edmund in Oakmere, Trandum, about the bell and the missing carter.'});
  edit('first-road','compass-question',{dialogue:[
    'Your parents used that compass on the roads. The needle pulls toward the old iron when something’s wrong. I’ve seen it do the same in your mother’s hand.',
    'They’d have gone back for that child too. I’m glad you found her. I just wish you hadn’t had to go alone.',
    'Show the torn map to Cecily in Highmere. And be careful around those voices. If you hear someone you miss, don’t follow. Find someone you trust first.']});
  quest('crown-summons').summary='Highmere’s river speaks with voices it should not know. Find the iron that drew the dead into the city, bring Thomas home, and learn why the same broken protections appear on your mother’s map.';
  quest('crown-summons').chapter='Chapter 2 · A voice beneath the bridge';
  quest('kingdom-divided').name='No One Left Inside';
  quest('kingdom-divided').summary='Families fleeing the broken wards found shelter in Highmere—until stolen iron began calling the dead to their door. Open their escape route before asking the crown what it intends to do for them.';
  quest('kingdom-divided').chapter='Chapter 2 · The night shelter';
  edit('kingdom-divided','archive',{dialogue:[
    'Those families came here because they thought walls would keep the creatures out. Now something is calling from inside their shelter.',
    'Beatrice heard the first cry. Agnes’s sister was there that night. Ask them what happened. I don’t want another search that starts after everyone has gone quiet.'],text:'Ask Cecily inside the Royal Archive, Highmere, about the night shelter.'});
  edit('kingdom-divided','merchant',{dialogue:[
    'I brought blankets. They said they were warm enough. Then I realised they were all sitting together because they were afraid to go near the back wall.',
    'There was a voice behind it. A little boy went white when he heard it. I took him to the kitchen. I should have taken everyone.'],text:'Ask Beatrice inside Highmere’s Market Hall what she heard at the shelter.'});
  edit('kingdom-divided','worker',{dialogue:[
    'My sister got out. Others didn’t. They were told to wait until morning, as if whatever was in there cared what time it was.',
    'She said the men who brought the iron locked the rear door. I don’t know how they sleep. Please go to the old cart road.']});
  edit('kingdom-divided','tally',{text:'Search the abandoned shelter supplies at Highmere’s Relief Warehouse for the missing families’ trail.'});
  edit('kingdom-divided','petition',{dialogue:[
    'You brought them out while my officers were arguing about whose duty it was. I have no excuse for that.',
    'The spare rooms are ready. The people who locked the door will face Isabel. Tell me what the families need tonight.'],text:'Tell Lady Matilda inside Crown Hall, Highmere, what happened at the shelter.'});
  edit('kingdom-divided','decision',{dialogue:['We can open the palace rooms, or help the families stay together in guarded homes. Either way, nobody is going back into that shelter.'],choices:[
    {id:'charter',text:'Open the palace rooms. Let frightened families stay together tonight.',response:'I’ll have the fires lit. No one is being turned away because they arrived with nothing.',flag:'relief-household-charter'},
    {id:'joint',text:'Help the families choose guarded homes. Ask them where they feel safe.',response:'Then we ask, and listen. Beatrice has offered rooms. Isabel can arrange the watch.',flag:'relief-joint-council'},
  ]});
  edit('kingdom-divided','return',{dialogue:[
    'They’ve gone to warm rooms. I sent Thomas with the little ones. He’s suddenly very grown-up when somebody else is frightened.',
    'Sit down a moment. You can save the whole road after you’ve eaten. Yes, I know you’ve heard that before. Your mother used to ignore me too.']});
  quest('kingdom-divided').resolution='The shelter survivors reach warm, guarded rooms. Highmere’s promise follows a rescue instead of replacing one.';
  edit('crown-summons','relief-charter',{text:'Complete No One Left Inside: rescue the shelter families near Highmere and arrange somewhere safe for them to stay.'});
  edit('crown-summons','audience',{dialogue:[
    'The river, the shelter, Oakmere… Every place had a piece cut from one of the old stones. And every place had people who trusted us to notice.',
    'I can send guards, but I don’t know what’s happening in the forest. People hear singing there, and now the mountain wagons have stopped coming. Take your mother’s map to Narenthil. If anyone is still out there, help them get home.']});
  edit('crown-summons','report',{dialogue:[
    'Giles carried these? Oh, Giles. I told him to come home by the watched road. He must have been trying to get the warning there sooner.',
    'These are Oswin’s notes. He was the inspector killed by the bridge. Giles carried a copy so the warning could survive if Oswin did not.',
    'I knew them both. Oswin was always early. Giles was always late, with some excuse about his horse. I’ll miss hearing them argue. Will you sit with me a moment?']});
  quest('eight-regions').summary='A forest borrows the voices of the missing. The mountain knocks from beneath the snow. A war-chief turns fear into raids, while drowned voices answer from a dwarven mine. Follow the broken wards across land and sea, protect the people caught between their guardians, and uncover what the Seer promised to bring back.';
  edit('eight-regions','well-treaty',{text:'Agree with Ugra in Red Mesa how to keep the families safe before facing Krag.',dialogue:[
    'Krag says I made us weak by letting outsiders drink here. Human, elf, dwarf—he spits the words like curses. I’ve buried friends of every kind. I’m tired of him telling me which ones count.'],choices:[
      {id:'clans',text:'Put the clans beside each other at the well. Let the children see it.',response:'Aye. Not behind banners. Beside each other. That will frighten him more than another challenge.',flag:'rindass-clan-water'},
      {id:'joint',text:'Bring the rescued travelers to the well too. Nobody should face his raiders alone.',response:'I’ll ask them. Some have already offered to help. Krag never understood why they would.',flag:'rindass-road-treaty'},
    ]});
  edit('eight-regions','harbor-account',{text:'Speak to Jessa at Tidewatch’s Harbor Guild about the people aboard the flagship.',dialogue:[
    'There are people alive on that ship. Some can’t swim. If they hear fighting, they may try to jump. Tell me what you want my boat crews to do.'],choices:[
      {id:'public',text:'Keep the rescue boats in sight. Let the captives know help is waiting.',response:'I’ll have Orren hang the white sail. They’ll know which boats to trust.',flag:'portquill-public-cargo'},
      {id:'bond',text:'Bring the boats quietly along the sheltered shore. Do not let the pirates turn on the captives.',response:'Quietly, then. My best crews know those rocks. You worry about the captain.',flag:'portquill-guild-bond'},
    ]});
  edit('eight-regions','forge-truth',{text:'Tell Vexa in Blackspire what the Seer’s cold flame was doing.',dialogue:[
    'We gave her iron because she said she could quiet the dead. Then she asked for more. I was frightened of what would happen if we stopped.',
    'The workers deserve to know. The ones who lost someone deserve more than another promise. Help me find the words.'],choices:[
      {id:'open',text:'Tell them yourself. Say what you did, and what you will do now.',response:'All right. No speaking from the forge steps. I’ll sit with them. They can ask me anything.',flag:'darkav-open-account'},
      {id:'witness',text:'Let the survivors speak first. Stay and hear them.',response:'I will. Even the things I’ve been avoiding. Especially those.',flag:'darkav-shared-archives'},
    ]});
  edit('eight-regions','capital-return',{dialogue:[
    'Put the iron down there. Isabel’s taking it outside. I don’t want one more person hearing a voice from those broken pieces.',
    'I found the name of the man who paid Varr. Walter knew what the missing iron was doing. He kept sending men anyway. The watch is bringing him in.',
    'And Leigneron… the letter Bruni found is real. Your parents went back because there were children still waiting. I’m so sorry. I wish they’d made it home.']});
  edit('eight-regions','roads:homeward-watch',{dialogue:[
    'They followed the broken iron? We keep it out of the houses, then. My guards can take it to the empty yard.',
    'A watchwoman refused an order to leave the archive unguarded. She hid it beside her lamp on the abandoned cart road. Find it before you go upstairs. If it carries Walter’s seal, I need to know now.']});
  edit('eight-regions','report:elarion',{dialogue:[
    'The Warden has fallen back. It is not well, and neither is the grove. We can tend the roots now because you gave us a way in.',
    'The pilgrims’ passes bear Starhold’s ridge mark. The same men must have gone through the pass. Take this warning to Halla: if the beacon goes quiet, get the porters under cover. Don’t wait for the beasts to reach them.']});
  edit('eight-regions','report:starhold',{dialogue:[
    'The last porter is inside. I counted again because he insisted I’d missed his donkey. I hadn’t. It was eating my coat.',
    'Stonejaw is away from the pass. Halla can watch the loose slopes now. Dorga’s mark is on the tools the iron-cutters left; Ugra has agreed to hear you at Red Mesa. Go as our witness, not as another stranger looking for a fight.']});
  edit('eight-regions','report:redmesa',{dialogue:[
    'The wounded rider is home. Both brothers are angry with me for making them rest. Best argument I’ve had in weeks.',
    'Krag can no longer decide who drinks. But someone still has the iron he sold. Dorga traced the wagons to Deepford’s river landing. Ask Mara what reached the mine before its spring turned dark.']});
  edit('eight-regions','report:deepford',{dialogue:[
    'The Rootfather has pulled back. We can reach the broken channel, and we will mend it. I won’t call the spring clean just because you survived a fight.',
    'Those boats took our iron to Portquill last month. Your parents had been gone for years by then. I’m sorry, lad. I know you were hoping we’d find someone who could tell you more.',
    'At Highmere’s quay, take a boat to Tidewatch. Jessa knows that dock mark. Show it to her before anyone sends you aboard a pirate ship.']});
  edit('eight-regions','report:tidewatch',{dialogue:[
    'The rescue boats came back. Orren’s been folding the white cloth as though it were made of glass. I think he’s afraid to stop doing something useful.',
    'The Salt King’s cargo included Skallheim’s lens. The families put ashore there are still waiting for a safe light. Take the boat to Skallheim and ask Eyvind about them. I’ve sent word so he knows you’re coming.']});
  edit('eight-regions','report:skallheim',{dialogue:[
    'The boats are coming in. The Wyrm has gone uphill, and we’re leaving it there. No hunting party. No trophies.',
    'The little sun on that shard is Vexa’s forge mark. She is at Blackspire, beyond Ashen Landing in Darkav. Find out why metal from our beacon came back burned and bent. Somebody there knows.']});
  edit('eight-regions','report:blackspire',{dialogue:[
    'The lamps are quiet. For the first time, the workers can hear each other without the dead interrupting. I hadn’t realised how much I missed ordinary arguing.',
    'The Seer never had Varkhul under her thumb. She broke the chains that kept him away from our roads. We’ve stopped her furnace, but he’s still out there. We need to mend that ward.',
    'Go to Highmere. Stop Walter’s men before more families are hurt. Then come back with the people who know the other wards. I can make the links, but I cannot mend this alone.']});
  edit('eight-regions','seal-account',{dialogue:[
    'I paid Varr. I thought fear would make people listen. By the time I saw what was waking, I’d told too many lies to admit it.',
    'Don’t look at me as if I wanted children hurt. I didn’t. I just… kept finding reasons not to stop.',
    'Isabel is waiting. I know. I’m coming.'],text:'Confront Walter inside Highmere’s Counting House after the archive is safe.'});
  quest('the-last-ward').summary='The Seer is stopped, but a dragon still holds the last broken ward. Leave the arguments behind, take the repaired binding to Darkav, and make a way back for everyone who will carry it.';
  edit('the-last-ward','keepers-covenant',{text:'Agree with Cecily at Highmere’s Royal Archive who will watch the restored roads.',dialogue:[
    'I’m not sending you back out there to fix something we intend to forget again. Who do you trust to watch the stones when you come home?'],choices:[
      {id:'local',text:'The people who live beside them. Help the villages look after one another.',response:'Then we start there. Not with another order from a distant hall.',flag:'covenant-local-keepers'},
      {id:'shared',text:'A watch drawn from every region. Let them learn each other’s roads.',response:'Edmund will complain about their boots. Then teach them everything he knows. I’ll ask him.',flag:'covenant-shared-watch'},
    ]});
  edit('the-last-ward','covenant-forge',{dialogue:[
    'The binding’s ready. I’ve checked every link twice. I’ll probably check again before Dain carries it out.',
    'Dain has the shelter crews waiting. Before we carry this toward the mountain, make sure they have a way home.'],text:'Bring the repaired-road promise to Vexa inside Forge Hall, Blackspire, Darkav.'});
  edit('the-last-ward','crown-recognition',{dialogue:[
    'The first message came from the coast. A little boat reached shore without anyone hearing the false voices. I read that line three times.',
    'You needn’t stand here while I thank you properly. Go home. There are people who have been waiting rather longer than I have.']});
}
