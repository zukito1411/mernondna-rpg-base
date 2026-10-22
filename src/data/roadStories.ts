import type {QuestDefinition,QuestObjective} from '../game/types';
import type {StoryEncounter} from './adventure';

export const ROAD_STORIES_REVISION='campaign:roads-unbound-v1';
export const ROAD_POLISH_REVISION='campaign:roads-covenant-v1';
export const ROAD_STAGE_PREFIX='roads:';
interface RoadClue {id:string;townId:string;siteId:string;dx:number;dy:number;name:string;text:string}
export interface RoadChapter {questId:string;before:string;name:string;objectives:QuestObjective[]}
const clues:RoadClue[]=[];
const encounters:StoryEncounter[]=[];
const chapters:RoadChapter[]=[];
const sides:QuestDefinition[]=[];
const worlds:QuestDefinition[]=[];
const talk=(key:string,npc:string,text:string,...dialogue:string[]):QuestObjective=>
  ({id:ROAD_STAGE_PREFIX+key,type:'talk',targetId:npc,amount:1,text,dialogue});
const search=(key:string,town:string,site:string,dx:number,dy:number,name:string,text:string):QuestObjective=>{
  const id='roads-clue:'+key;
  clues.push({id,townId:town,siteId:site,dx,dy,name,text});
  return {id:ROAD_STAGE_PREFIX+key,type:'investigate',targetId:id,contentId:id,amount:1,
    text:'Examine '+name+' at the marked trail near '+town.replaceAll('-',' ')+'.'};
};
const fight=(questId:string,key:string,townId:string,anchor:QuestObjective,roster:readonly string[],count:number,
  name:string,warning:string,aftermath:string,work?:StoryEncounter['work']):QuestObjective=>{
  const id='roads-'+key,objectiveId=ROAD_STAGE_PREFIX+key;
  // Three actors per wave, regardless of total operation size. Persistent slots
  // use the existing encounter lifecycle; revisiting never duplicates rewards.
  const waves:string[][]=[];
  for(let i=0;i<count;i+=3)waves.push(Array.from({length:Math.min(3,count-i)},(_,j)=>roster[(i+j)%roster.length]));
  encounters.push({id,questId,objectiveId,townId,contentId:anchor.contentId,radius:650,name,waves,warning,aftermath,work});
  return {id:objectiveId,type:'encounter',targetId:id,amount:1,text:'Complete '+name+' at the marked site near '+townId+'.',rewardXp:80};
};
const choice=(key:string,npc:string,text:string,question:string,a:[string,string],b:[string,string]):QuestObjective=>({
  id:ROAD_STAGE_PREFIX+key,type:'choice',targetId:npc,amount:1,text,dialogue:[question],choices:[
    {id:'first',text:a[0],response:a[1],flag:'roads-choice:'+key+':first'},
    {id:'second',text:b[0],response:b[1],flag:'roads-choice:'+key+':second'},
  ],
});
function chapter(questId:string,before:string,name:string,objectives:QuestObjective[]){
  chapters.push({questId,before,name,objectives:objectives.map(o=>({...o,chapter:name}))});
}
function side(id:string,name:string,giverNpcId:string,prerequisiteQuestId:string,summary:string,
  objectives:QuestObjective[],resolution:string,rewardGold=180,rewardXp=520){
  sides.push({id,name,giverNpcId,prerequisiteQuestId,kind:'side',summary,objectives,resolution,rewardGold,rewardXp});
}
const puzzle=(key:string,npc:string,text:string,question:string,answer:[string,string],wrong:[string,string]):QuestObjective=>({
  id:ROAD_STAGE_PREFIX+key,type:'puzzle',targetId:npc,amount:1,text,dialogue:[question],choices:[
    {id:'understood',text:answer[0],response:answer[1],flag:'roads-understood:'+key,correct:true},
    {id:'reconsider',text:wrong[0],response:wrong[1],flag:'',correct:false},
  ],
});
function world(id:string,name:string,giver:string,town:string,report:string,summary:string,objectives:QuestObjective[],resolution:string){
  const ending=objectives.at(-1);
  if(ending)ending.cinematicId='world-after-'+id;
  const q:QuestDefinition={id,name,giverNpcId:giver,kind:'side',worldQuest:true,chapter:'World · '+town,
    prerequisiteObjective:{questId:report==='return-aldren'?'first-road':'eight-regions',objectiveId:report},
    summary,objectives,resolution,rewardGold:260,rewardXp:700};
  worlds.push(q);
}

// CHAPTER I: an ordinary rescue becomes an impossible disturbance. No prophecy,
// false parental resurrection, or compulsory shopping is used to extend it.
{
  const q='first-road';
  const tracks=search('silent-orchard','oakmere','royal-waystone',-420,220,'Small tracks beside the old road',
    'Bare feet stop at an overturned basket. Wolf tracks circle them, but no blood stains the grass. Someone hid a little girl inside the hollow tree. The compass pulls toward the frightened animals, not north.');
  chapter(q,'roadwardens-choice','Chapter 1 · The bell beneath the ground',[
    talk('orchard-call','mira-fen','Ask Alice outside Oakmere about the children who fled the raid.',
      'Lena is home. Her little girl isn’t. She ran when the bell started and nobody saw which way.',
      'I found a basket by the old road. Come with me. And before you say it—no, I’m not waiting safely at the inn.'),
    tracks,fight(q,'orchard-rescue','oakmere',tracks,['gray-wolf'],12,'The Silent Orchard',
      'A child calls from the hollow tree. Wolves are circling the clearing; open a way back to Oakmere.',
      'The last wolf retreats. Small footprints lead back toward the village; the watch takes over the search.'),
    talk('child-home','nella-brook','Check on the missing child with Nella in Oakmere.',
      'She’s asleep against her mother. Won’t let go of her sleeve. I don’t think Lena minds.',
      'She said she heard a bell under the tree. The orchard hasn’t had a bell since I was a girl. Alice heard it too.'),
    talk('buried-bell','orin-bell','Ask Etheldreda at Oakmere’s shrine about the buried bell.',
      'There’s no bell under those trees. There is an old ward-stone. If it’s making a sound, something has hurt it.',
      'Don’t go digging for it. Find who opened the stones. Bring me what they took. And keep that child away from the orchard.'),
  ]);
  const hollow=search('tower-hollow','oakmere','royal-waystone',350,-320,'A split stone under the tower road',
    'A freshly cut socket hums beside a snapped digging tool. Beneath it lies a scrap of the missing survey: do not take the iron while the roots are warm. The same warning was crossed out by another hand.');
  chapter(q,'tower-dispatch','Chapter 1 · What Varr woke',[
    hollow,fight(q,'hollow-watch','oakmere',hollow,['road-bandit','gray-wolf'],12,'The Opened Stone',
      'A bandit backs away from the split stone. The wolves turn on him as well. Survive the creatures and the men keeping the road closed.',
      'The stone falls quiet. The abandoned tools show that Varr’s men knew the danger before they kept digging.',
      {label:'Cover the exposed hollow with its fallen stone',duration:4500}),
    talk('village-warning','torren-ashfield','Visit Hugh at the West Cottages in Oakmere before confronting Varr.',
      'A wolf chased one of Varr’s men all the way to my wagon. Never seen a man climb that quickly.',
      'He said the captain heard the stone crying and ordered them to dig anyway. If you’re going up there, ask him what was worth that.'),
  ]);
}

// CHAPTER II: the city has a monster emergency of its own. The short hearing
// remains a consequence of the rescue, rather than the whole adventure.
{
  const q='crown-summons';
  const river=search('river-scratches','highmere','crown-freight-camp',-280,180,'Claw marks beneath the river crossing',
    'The scratches begin on the river side of the stone. Something climbed out of the water. A guard’s broken lantern lies beside a child-sized shoe; the shoe’s owner escaped toward the houses.');
  chapter(q,'report','Chapter 2 · Something under Highmere',[
    talk('river-bell','davin-bridge','Speak with the bridge warden at River Customs in Highmere.',
      'Keep away from the lower steps. We heard someone calling from the water. Sounded like a child.',
      'Then one of my men went down with a lantern. He came back without it. Shaking too hard to speak. The scratches are by the old cart road.'),
    river,fight(q,'river-dead','highmere',river,['marsh-wraith'],15,'Voices from the River',
      'The voice comes again, this time from several mouths. Drive the spirits away from the crossing.',
      'The false voices stop. Beneath the mud lies a strip of ward iron wrapped in a guard’s stolen cloak.'),
    talk('river-survivor','captain-yselle-ward','Tell Isabel at Highmere’s western watch what climbed from the river.',
      'One of the children heard her father calling. He’s been dead for six years. She nearly went down the steps.',
      'You’ve bought us a night to move people. Take that iron to Cecily. If anyone knows where it belongs, she will.'),
  ]);
  const shelter=search('shelter-marks','highmere','crown-freight-camp',440,-220,'A shelter door scored from within',
    'The families did not break this door to escape the watch. They broke it to escape the voices coming from a stolen ward fragment. Small handprints mark a route toward the dry ground.');
  chapter('kingdom-divided','petition','Chapter 2 · The night shelter',[
    talk('shelter-warning','nella-harrow','Ask Agnes inside Weavers Row, Highmere, about the empty shelter.',
      'My sister didn’t run away from a debt. She ran from a room where the walls started speaking.',
      'There are still people sleeping near that old cart shelter. They don’t know what’s buried under it. Please go before dark.'),
    shelter,fight('kingdom-divided','shelter-break','highmere',shelter,['marsh-wraith','road-bandit'],15,'No One Left Inside',
      'Men are barring the shelter while spirits rise around it. Break their hold and keep the escape path open.',
      'The families reach the watch. The iron was hidden here by the same men who threatened Thomas.',
      {label:'Unfasten the shelter’s outer bar',duration:5000}),
    talk('shelter-home','mairin-reed','Check the rescued families at Morrow Kitchen in Highmere.',
      'They’re here. I gave them the upstairs room. Thomas hasn’t stopped fussing over the little ones.',
      'One woman kept apologising for losing her shoes. Imagine that. Nearly killed, and afraid I’d mind the mud.'),
  ]);
}

// CHAPTER III: the forest sings borrowed voices; the mountain answers with
// old warning knocks. Each mystery earns the next journey through real clues.
{
  const q='eight-regions';
  const ribbon=search('borrowed-song','elarion','greenward-ruin',330,300,'Ribbons tied against the wind',
    'The ribbons point away from the breeze. A pilgrim scratched an arrow toward Moonfall, then wrote: if it sings like your mother, do not follow. The roots have wound around a piece of iron like fingers around a thorn.');
  const nest=search('hollow-nest','moonfall','moon-pilgrim-grove',-400,340,'A lantern wrapped in pale silk',
    'The lantern is cold, but the oil is fresh. Under the silk are a child’s carved bird and adult footprints heading away from the water. The pilgrims split up to lead the spiders away from their children.');
  chapter(q,'field-scribe','Chapter 3 · The song that knew your name',[
    ribbon,fight(q,'singing-roots','elarion',ribbon,['blighted-thornling'],15,'The Borrowed Song',
      'The roots tremble with a familiar lullaby. Cut a path to the ribbons; do not follow the voice into the trees.',
      'The song breaks into a dry whisper. The voice belonged to the wounded grove, not a returned loved one.'),
    talk('song-explained','elarion-lorekeeper','Ask Ilyra inside Elarion’s Lore Archive about the borrowed voices.',
      'I heard my brother out there. For one foolish moment I had my hand on the door.',
      'The grove remembers voices. It doesn’t know what it does to us when it repeats them. The Warden is trying to hold that pain inside.'),
  ]);
  chapter(q,'pilgrim-safe','Chapter 3 · The children of Moonfall',[
    nest,fight(q,'silk-lantern','moonfall',nest,['grove-spider','blighted-thornling'],15,'The Lantern in the Web',
      'Fresh silk seals the pilgrims’ shelter. Clear the creatures gathering around the trapped lantern.',
      'The lantern is freed. The scouts find the children on the dry path marked by the carved bird.',
      {label:'Cut the silk away from the shelter opening',duration:4500}),
    talk('pilgrim-choice','moonfall-herbalist','Return to the herbalist’s cottage in Moonfall with the carved bird.',
      'That’s Neris’s bird. Her father made it with a knife too big for the job. She insisted it was a swan. It looks like a potato.',
      'She’s safe? Oh, thank you. Put it here. I want her to find it when she wakes.'),
  ]);
  const bell=search('snow-bell','starhold','pass-beacon',-420,-260,'A bell-rope buried in snow',
    'Three short knots are tied into the rope. A stranded porter used them to count warning knocks from beneath the ridge. His last message says the troll moved downhill only after the knocking stopped.');
  const cairn=search('porter-cairn','starhold','pass-beacon',420,300,'A line of freshly built cairns',
    'Each cairn shelters a little candle. The porters made a path for anyone following them, then found wolves between the last candle and the road. A child’s mitten is tucked safely inside a boot.');
  chapter(q,'recover-beacon-kit','Chapter 3 · Knocking under the snow',[
    bell,fight(q,'snow-knocks','starhold',bell,['gray-wolf'],15,'The Silent Ridge',
      'The rope stirs. Wolves descend through the snow toward the porters’ hiding place.',
      'The ridge is quiet. The old warning stone had kept the beasts away from the shelters, until someone cut its iron out.'),
    talk('ridge-knocks','starhold-templar','Ask Halla in Starhold where the missing porters took shelter.',
      'One of them came in carrying two packs. Said he couldn’t bear to leave his friend’s behind.',
      'They built cairns back toward the beacon. If you find a blue mitten, bring it. His daughter’s pretending she isn’t worried.'),
    cairn,fight(q,'last-candle','starhold',cairn,['gray-wolf'],12,'The Last Candle',
      'A candle burns behind the fallen stones. Keep the wolves away while the porters reach the path.',
      'The porters follow their candle trail toward Starhold. The last one leaves the signal oil beside the beacon.'),
  ]);
}

// CHAPTER IV: friendly orcs oppose Krag without becoming enemies by species.
// The dwarven revelation remains a flood rescue, not a secret murder plot.
{
  const q='eight-regions';
  const brand=search('broken-tusk','redmesa','clan-road-muster',350,340,'A broken tusk beside the pens',
    'A clan mark was cut off a captive rider’s harness. The boars were whipped toward the shared well to make the attack look like a raid by another clan. One frightened mount broke its own tether instead.');
  const banner=search('brother-banner','redmesa','southern-caravan-rest',-380,320,'A banner stitched with two names',
    'Two brothers stitched their names beneath the same clan sign. One name was slashed away after its owner refused Krag’s order to burn a shelter. His tracks lead toward the river, not a grave.');
  chapter(q,'well-warband','Chapter 4 · Teeth behind the banners',[
    talk('pen-warning','redmesa-beastmaster','Ask Ugra near Red Mesa about the injured clan mounts.',
      'Someone’s been cutting our marks off the harnesses. They want the other clans to think we sent those beasts.',
      'That little tusk at the pens belonged to my first mount. She lost it trying to pull a child out from under a wagon. Find who used it.'),
    brand,fight(q,'false-clan','redmesa',brand,['rindass-orc-raider','rindass-orc-spearman'],15,'The Stolen Clan Marks',
      'Krag’s warriors move to destroy the harnesses. Stop them before the clans are driven into another battle.',
      'The harnesses survive. Ugra can show the clans who dressed Krag’s raiders in their colours.'),
  ]);
  chapter(q,'well-treaty','Chapter 4 · The brother who would not kneel',[
    banner,fight(q,'river-brother','redmesa',banner,['rindass-orc-raider','rindass-orc-spearman'],15,'Two Names on One Banner',
      'Krag’s men close around the river path. The missing rider’s trail is still fresh.',
      'The river approach is open. Ugra’s scouts can bring the wounded rider back without crossing Krag’s camp.'),
    choice('brothers-oath','redmesa-forgewright','Speak to Dorga inside the Clan Forge, Red Mesa.',
      'His brother wants Krag’s blood. The boy we found just wants his family together. What do I tell them?',
      ['Let the wounded rider speak first. Nobody gets to choose revenge for him.','I’ll sit beside him. He’s had enough people shouting over his head.'],
      ['Keep both brothers with the healers until Krag is stopped.','Good. I’ll take the first watch. If either tries to leave, he can argue with me.']),
  ]);
  const hammers=search('buried-hammers','deepford','rootwater-watch',-340,-300,'Hammers laid in a circle',
    'The handles face inward. The miners laid down their tools before sealing the gallery. Scratched beside them are names and a warning: the knocking answers our own. Do not mistake it for survivors.');
  const crossing=search('last-crossing','deepford','rootwater-watch',390,340,'A rope worn smooth by small hands',
    'The rope was gripped by children crossing the flood. Someone tied a spoon into its end so numb fingers could hold on. A faded sketch shows two rescuers returning across the bridge while others begged them to stop.');
  chapter(q,'bruni-rescued','Chapter 4 · The mine that answered',[
    hammers,fight(q,'answering-mine','deepford',hammers,['marsh-wraith'],18,'The Answering Hammers',
      'Three knocks sound from below. Spirits rise along the path the trapped surveyor must take.',
      'The false knocking ends. Bruni’s real signal answers from the dry side of the spring.',
      {label:'Unfasten the gallery’s rescue line',duration:5000}),
    talk('mine-names','deepford-runesmith','Ask Mara inside Deepford’s Hall Archive about the hammers.',
      'We sealed that gallery after the roof fell. Nobody wanted to put the names outside. Said it would frighten the apprentices.',
      'Their families were frightened already. I’ll carve the names myself. You find Bruni. I won’t add hers.'),
  ]);
  chapter(q,'family-relief-record','Chapter 4 · The rope they held',[
    crossing,talk('rope-memory','bruni-stonevein','Ask Bruni at Rootwater, Druganwoods, about the old crossing.',
      'That spoon. Your father tied it there. Said a child shouldn’t need a sailor’s grip to get across a river.',
      'I saw your mother go back. She took her shoes off because the boards were slick. I remember being angry with her for smiling at us.',
      'The letter is there by the old stone. Read it when you’re ready. I’m not going anywhere.'),
  ]);
}

// CHAPTER V: false lights lure ships ashore. The colder coast reveals that
// the Wyrm is injured, rather than a convenient villain behind every tragedy.
{
  const q='eight-regions';
  const light=search('false-lights','tidewatch','salt-bay-outlook',-420,320,'A lantern with its landward side blackened',
    'The lamp could only be seen from the sea. Beside it, bootprints lead away from wreckage before the tide rose. The pirates did not rescue these sailors; they waited for the false light to bring them in.');
  const chain=search('shore-chain','tidewatch','salt-bay-outlook',400,-320,'A chain dragged through the sand',
    'The links are carved with the same marks as the forest stones. Someone filed away the warning signs before chaining them beneath the Salt King’s cargo. A sailor cut a small escape sign into the last link.');
  chapter(q,'flagship-deck','Chapter 5 · The shore that lied',[
    light,fight(q,'wreck-lights','tidewatch',light,['cutlass-pirate','pirate-boatswain'],15,'The Wreckers’ Light',
      'The lookout sees you turn the false lantern away from the water. His crew rushes the shore.',
      'The wreckers lose their light. The harbour watch can guide the next boat past the rocks.',
      {label:'Cover the wreckers’ false signal',duration:4000}),
    talk('wreck-survivors','tidewatch-sailmaker','Visit Orren inside Sailmaker House in Tidewatch, Portquill.',
      'I stitched that lantern cover. He said it was for a fishing boat. I even gave him a fair price.',
      'There are people alive on that ship. One cut a mark into the shore chain. I know it. We used it when we were boys and wanted help without shouting.'),
    chain,fight(q,'chain-shore','tidewatch',chain,['cutlass-pirate','pirate-boatswain'],12,'The Shore Chain',
      'A boatswain calls for the shore guards. The escape sign is fresh; keep the boarding path open.',
      'The shore guard scatters. The harbour watch follows the escape signs while you face the flagship’s own crew.'),
  ]);
  const frost=search('blue-footprints','skallheim','ice-bay-outlook',-430,-310,'Blue frost inside an abandoned boot',
    'The boot is frozen from within. No body lies nearby. Drag marks lead toward a broken sled; the family pulled their injured father rather than leave him beside the Wyrm’s tracks.');
  const scales=search('wyrm-nest','skallheim','ice-bay-outlook',420,350,'Cracked scales around a sheltered hollow',
    'The hollow holds broken eggshells and strips of black iron. The Frost Wyrm bled here before descending to the fishing huts. Its trail follows the stolen beacon lens, as if the lens still carries a scent.');
  chapter(q,'recover-lantern','Chapter 5 · What followed the cold',[
    frost,fight(q,'frozen-sled','skallheim',frost,['frost-wolf'],15,'The Broken Sled',
      'Wolves gather around the abandoned sled. Clear the family’s last route back to the coast.',
      'The hunters can reach the sled. A scrap of sailcloth points them toward the missing family.'),
    talk('sled-family','skallheim-trader','Ask Eyvind at Skallheim’s longhouse about the frozen boot.',
      'He’s here. Lost two toes, still insists he can mend nets. His little girl brings him one knot at a time.',
      'They saw the Wyrm circling a hollow above the bay. Runa says there are broken scales there. I’d like to know what hurt a beast that size.'),
    scales,talk('wyrm-injury','skallheim-hunter','Show the broken scales to Runa near Skallheim.',
      'That iron wasn’t thrown at it. It burst out of the old stone. Look at the bend.',
      'We still have to drive it from the coast. Understanding why it’s angry won’t save anyone standing in front of its teeth.'),
  ]);
}

// CHAPTER VI: the Seer's promise is frightening because it sounded kind at
// first. Her experiments have consequences the player has to fight through.
{
  const q='eight-regions';
  const ash=search('ashwood-faces','blackspire','darkav:ashwood-watch',250,260,'Faces pressed into the ash',
    'The shapes were made by frightened workers sheltering from the blast. Beside them are handprints pointing toward the chainworks. One worker returned to mark a safer trail for those coming after.');
  const flame=search('cold-flame','blackspire','darkav:cinder-pilgrim-ruin',-300,260,'A pilgrim’s lamp that gives no warmth',
    'The Seer promised that this flame would let people hear their dead. A father wrote that he heard his daughter asking for more iron. The handwriting breaks off: she would never ask me to hurt someone.');
  chapter(q,'chainworks-search','Chapter 6 · The people in the ash',[
    ash,fight(q,'ashwood-rescue','blackspire',ash,['marsh-wraith'],18,'The Ashwood Watch',
      'The ash shifts into faces. Spirits gather around the workers’ marked trail.',
      'The trail is quiet. Dain’s scouts can follow the workers’ handprints to the burnt chainworks.',
      {label:'Uncover the buried watch bell',duration:5000}),
    talk('seer-promise','blackspire-forgemaster','Ask Vexa inside Blackspire’s Forge Hall why people followed the Seer.',
      'She didn’t start by asking for power. She told a man he could hear his daughter again. Then she asked him for a little iron.',
      'I thought it was cruel nonsense. I should have said so before I agreed to heat the furnace. Not after.'),
    flame,fight(q,'pilgrim-flame','blackspire',flame,['marsh-wraith'],15,'The Flame That Answered',
      'The cold lamp flickers. Voices promise that the missing can return if you bring the fire closer.',
      'The flame goes out. The voices stop asking. The dead have not returned; the Seer has been feeding something on their names.',
      {label:'Close the cold lamp without carrying its flame',duration:4500}),
  ]);
  chapter(q,'forge-truth','Chapter 6 · No one comes back through fire',[
    choice('cold-lamp-truth','blackspire-warder','Speak to Dain outside Blackspire about the cold lamp.',
      'There’s a father waiting by the gate. He thinks the Seer still has his daughter. I can’t find the words.',
      ['Tell him what the lamp really did. Stay with him while he hears it.','Aye. No more waiting alone by that gate. I can do that much.'],
      ['Ask Vexa to sit with him. She owes him the truth too.','She does. I’ll bring her down. Nobody gets to hide in the forge tonight.']),
  ]);
}

// CHAPTER VII: one short human confrontation follows a dangerous return. No
// second political campaign is inserted between the Seer and the dragon.
{
  const q='eight-regions';
  const trail=search('homeward-shadow','highmere','royal-waystone',-260,-330,'A rider’s lantern beside the king’s road',
    'The rider got far enough to scratch a warning: the iron calls them. The attackers ignored his purse. Black dust marks the saddlebags carrying the pieces taken from Darkav.');
  chapter(q,'capital-return','Chapter 7 · What followed you home',[
    trail,fight(q,'homeward-hunt','highmere',trail,['marsh-wraith','road-bandit'],18,'The Homeward Hunt',
      'The compass shudders. Spirits follow the stolen iron, and Walter’s hired men close the road behind them.',
      'The attackers fall back. Pale shapes linger over the iron in the fallen saddlebags, then fade. The road into Highmere is clear.'),
    talk('homeward-watch','captain-yselle-ward','Warn Isabel at Highmere’s western watch before entering the archive.',
      'They followed you here? Then we keep that iron away from the houses. My guards can take it to the empty yard.',
      'Cecily’s waiting upstairs. She asked me to tell you there’s a chair by her desk. I don’t think she wants you standing when she speaks.'),
  ]);
}

// CHAPTER VIII: preparations happen before the final boss. Nothing new is
// required after his retreat which could make the repair miss its opening.
{
  const q='returning-ember';
  const route=search('last-shelter','blackspire','darkav:ashwood-watch',-280,350,'A scorched shelter marker',
    'Dain has marked the return path with three strokes low enough to see beneath the ash. The last marker is broken. Beyond it lie the tools of a crew that tried to reach the furnace without protection.');
  const chain=search('last-chain','blackspire','darkav:cinder-pilgrim-ruin',310,-260,'A chain laid around an empty hearth',
    'Eight small marks surround the central link. Each matches a resting place on your mother’s map. Beside them, the smith has written: check every link before carrying this up the ridge.');
  chapter(q,'secure-crews','Chapter 8 · A way back for everyone',[
    route,fight(q,'last-shelter-defense','blackspire',route,['marsh-wraith'],18,'The Last Shelter',
      'Spirits cross the workers’ retreat path. Open the route before Dain brings the forge crews out.',
      'The retreat path is clear. Dain’s runners replace the broken marker and take their posts.',
      {label:'Raise the shelter’s fallen route marker',duration:5000}),
    talk('last-evening','blackspire-warder','Speak to Dain outside Blackspire before the final approach.',
      'I told them they could refuse. Every one of them stayed. Wish that made me less frightened.',
      'Your way back is marked too. Follow it when the work is done. Don’t make me come looking for you inside a dragon.'),
    chain,fight(q,'last-chain-defense','blackspire',chain,['marsh-wraith'],15,'The Unbroken Link',
      'The unfinished binding draws the remaining spirits. Hold its clearing until the smiths can carry it safely.',
      'The smiths secure the binding. Nothing remains between the waiting crews and Varkhul’s shelf but the dragon himself.'),
    talk('last-promise','blackspire-forgemaster','Return to Vexa in Blackspire’s Forge Hall before entering Varkhul’s lair.',
      'I won’t tell you not to be afraid. I can barely hold my hammer.',
      'The chains are ready. Dain knows the route. You’ve done everything a person can do before a thing like this.',
      'When he lifts off, let him go. Then come back down the road. That’s the part I need you to promise.'),
  ]);
}

// SIDE STORIES: sixteen authored adventures, not a repeatable bounty generator.
// Their choices affect conversation endings, never gate the main campaign.
{
  const q='roads-hollow-tree';
  const a=search('hollow-tree-mark','oakmere','royal-waystone',-650,420,'A toy soldier in the roots',
    'A child has been leaving wooden soldiers here for the father he imagines still guards the road. Fresh wolf tracks circle the toys. A real soldier once rested beneath this tree, but the sword cuts in its bark are much older.');
  const b=search('hollow-tree-letter','oakmere','royal-waystone',520,460,'A promise carved above the roots',
    'An old guard carved: I cannot promise to return. I can promise to try. His daughter copied the words years later. The tree became a place for families to leave what they could not say at home.');
  side(q,'The Soldiers Beneath the Tree','silas-crowe','first-road','Roger jokes about wooden soldiers until a child fails to return from the tree where they are left.',[
    talk('tree-start','silas-crowe','Speak to Roger near Oakmere, Trandum.','Before you laugh, yes, I lost a race to a child. He went to leave a toy by the old tree. He ought to be home by now.','I found his first wooden soldier by the waystone. Don’t tell his mother I let him get ahead.'),a,
    fight(q,'tree-watch','oakmere',a,['gray-wolf'],12,'The Hollow Tree Watch','Wolves close around the toy trail. Make a safe approach to the tree.','The child’s trail leads back toward Roger’s search party.'),b,
    talk('tree-meaning','orin-bell','Ask Etheldreda in Oakmere about the words on the tree.','His father’s alive. Working the distant watch. The boy knows it, but knowing isn’t always enough when the house goes quiet.','Don’t tear down the toys. Leave a note that somebody in Oakmere is keeping watch too.'),
    choice('tree-end','silas-crowe','Return to Roger near Oakmere.','He asked whether a brave person ever gets scared. You’d better answer. He won’t believe me after the race.',
      ['Tell him I was frightened too. We can walk home together.','Good. I’m coming as well. Somebody has to carry all these tiny swords.'],
      ['Ask him to help the watch check the safe path, with an adult beside him.','He’ll like that. A proper job, not another reason to sneak out. I’ll take him.']),
  ],'The boy comes home. The tree remains a place of waiting, but he no longer visits it alone.');
}
{
  const q='roads-quiet-bell';
  const a=search('quiet-bell-crack','oakmere','royal-waystone',650,-420,'A cracked handbell in the grass',
    'The bell has no clapper. Something inside the broken ward was repeating its sound. A strip of cloth around the handle bears the stitch used by Oakmere’s first shrine keeper.');
  const b=search('quiet-bell-stone','oakmere','royal-waystone',-500,-450,'An old shrine keeper’s resting stone',
    'The carving says: ring for the living, not to call the dead home. A later keeper left a small iron clapper here rather than mend the bell. She knew what had begun answering.');
  side(q,'A Bell for the Living','orin-bell','first-road','Etheldreda hears her predecessor’s handbell, although its clapper was buried years ago.',[
    talk('bell-start','orin-bell','Speak with Etheldreda at Oakmere’s shrine.','I heard it while I was locking the shrine. My old teacher’s bell. She’s been buried twenty years.','I’m not foolish enough to follow a sound in the dark. I am foolish enough to want to. Will you go in my place?'),a,
    fight(q,'quiet-bell-spirits','oakmere',a,['marsh-wraith'],9,'The Clapperless Bell','The broken handbell rings without moving. Spirits gather around its empty mouth.','The borrowed ringing stops. The bell is only old bronze again.'),b,
    choice('bell-end','orin-bell','Return the silent bell to Etheldreda in Oakmere.','I used to hate being told what to do by her. I’d give a great deal to hear it once more.',
      ['Keep the bell here. It can remind us of her without answering us.','Aye. I’ll put it where the morning light catches it. She would complain about the dust.'],
      ['Bury it beside her resting stone. We can go together.','Together, then. Let me fetch a cloak. I’ve put this walk off for twenty years.']),
  ],'Etheldreda says goodbye without mistaking the ward’s borrowed sounds for a returned teacher.');
}
{
  const q='roads-red-cloak';
  const a=search('cloak-cut','willowcross','crown-freight-camp',-550,380,'A red cloak caught on a wagon',
    'The cloak was cut into strips to bind injuries. A woman accused of abandoning her companions left half her clothing behind while trying to save them. The bandits carried their own wounded toward the woods.');
  const b=search('cloak-truth','willowcross','crown-freight-camp',500,400,'A child’s drawing beneath a wheel',
    'The drawing shows the woman returning three times through the arrows. A small figure waits beside a broken cart. The child wrote: she said wait here, so I did.');
  side(q,'The Woman in the Red Cloak','willowcross-keeper','first-road','Willowcross blames a stranger for a vanished caravan. Her torn cloak tells a different story.',[
    talk('cloak-start','willowcross-keeper','Speak to the keeper in Willowcross, Trandum.','They’re calling her a coward. Funny how quickly a room agrees when the person they’re blaming isn’t in it.','She came back without her cloak, covered in other people’s blood. I want you to look at the cart before anyone drives her away.'),a,
    fight(q,'cloak-bandits','willowcross',a,['road-bandit'],15,'The Red Cloak Trail','The robbers return for what the caravan left behind.','The cart is safe to search. Cloth bandages lead away from it.'),b,
    choice('cloak-end','willowcross-keeper','Return to the keeper in Willowcross.','She doesn’t want a speech. Says she just wants to sleep without somebody spitting outside the window.',
      ['Tell the village what she did. Let her decide whether to attend.','I’ll speak, then. She can stay by the fire. Nobody owes us a performance after that.'],
      ['Give her a quiet room first. Speak to the people who threatened her.','Good. I’ve a spare key, and a few words saved up for those neighbours.']),
  ],'The survivors’ trail clears the stranger’s name. Willowcross must face what it did before hearing her story.');
}
{
  const q='roads-river-lanterns';
  const a=search('lantern-child','highmere','crown-freight-camp',-680,-300,'A paper lantern caught in the reeds',
    'Someone wrote a name on each side. One is a dead mother’s; the other is her living son’s. His aunt has been setting two lanterns afloat because he vanished while following her voice.');
  const b=search('lantern-shelter','highmere','crown-freight-camp',650,-380,'A small shelter above the river mud',
    'The boy kept his boots on and waited above the water. He scratched: Mum says come down, but Mum told me never to go near the river alone. His refusal kept him alive until a patrol found him.');
  side(q,'Two Lanterns on the River','davin-bridge','shadows-highmere','The bridge warden keeps finding lanterns bearing a living boy’s name. Follow the river’s false voices before grief takes another child.',[
    talk('lantern-start','davin-bridge','Speak with the warden inside River Customs, Highmere.','I’ve fished three of these out. Same two names every time. A woman at the kitchen keeps making them.','Her nephew’s missing. Please find something I can bring her besides another wet lantern.'),a,
    fight(q,'lantern-voices','highmere',a,['marsh-wraith'],12,'The Lantern Voices','The reeds whisper a mother’s name. Clear the false voices from the river path.','The boy’s dry shelter can be searched safely.'),b,
    talk('lantern-home','mairin-reed','Ask Mairin at Morrow Kitchen, Highmere, about the boy.','The watch brought him in. He kept saying he’d done what his mother told him. We said yes, he had.','His aunt’s stopped making the second lantern. She’s upstairs telling him off. Very gently. Between tears.'),
    choice('lantern-end','davin-bridge','Return to River Customs in Highmere.','We used to laugh at the old warning about answering voices from the river. Not laughing now.',
      ['Teach the warning to children without frightening them away from every river.','I can manage that. My own girl will correct me if I make a mess of it.'],
      ['Have the watch walk the bank with families until it is quiet again.','Aye. We can spare the time. Better walking with them than looking for them afterward.']),
  ],'The boy survives by remembering his mother’s real advice rather than obeying her borrowed voice.');
}

{
  const q='roads-unstrung-bow';
  const a=search('bow-track','elarion','greenward-ruin',-600,340,'An unstrung bow beneath a fallen branch',
    'The bow was set down carefully, not dropped in flight. Its owner used the string to lower an injured stranger into shelter. The stranger’s iron-cutting tools lie nearby.');
  const b=search('bow-shelter','elarion','greenward-ruin',550,380,'Two sets of footprints leaving the shelter',
    'One set of footprints is deep and uneven; the other stays close beside it. A note has been pinned to a branch: I’m taking him to shelter. He had the iron-cutters’ tools. I’ve hidden them under the flat stone for the rangers.');
  side(q,'The Unstrung Bow','elarion-bowyer','crown-summons','A ranger helped one of the men who damaged the grove. Find out why she has not returned to defend herself.',[
    talk('bow-start','elarion-bowyer','Visit Bowyer Hall in Elarion, Narenthil.','Her bow is missing from the rack. Everyone’s decided she betrayed us. She’s my sister, and nobody thought to ask me.','She wouldn’t leave that bow in the rain unless someone needed both her hands. Look by Greenward.'),a,
    fight(q,'bow-thorns','elarion',a,['blighted-thornling'],15,'The Bowyer’s Search','Thornlings surround the abandoned bow.','The search trail is open. The bowstring was used as a rescue rope.'),b,
    choice('bow-end','elarion-bowyer','Return to Bowyer Hall, Elarion.','She saved him. After what he did to our trees. I’m proud of her. I’m angry too. Can both be true?',
      ['Yes. Bring them both home, and let him answer for the grove.','I’ll ask the rangers to meet them with a litter, not drawn bows.'],
      ['Let her explain it in her own words before the village judges her.','She’ll have words. Trust me. I grew up losing arguments to that woman.']),
  ],'The ranger’s rescue is understood without excusing the stranger who helped cut the iron.');
}
{
  const q='roads-moon-supper';
  const a=search('supper-place','moonfall','moon-pilgrim-grove',-580,-330,'A supper cloth laid for three',
    'Only two bowls were used. The third place was kept for a sister lost years ago. Footprints show a living pilgrim approaching from the wrong side of the grove; the voice that answered had learned the sister’s name.');
  const b=search('supper-warning','moonfall','moon-pilgrim-grove',580,-370,'A ribbon wound around a warning branch',
    'The pilgrim stopped here and wrote: she never called me by that name. He recognised the mistake and followed the real ribbons back toward Moonfall. Spiders closed behind him.');
  side(q,'The Third Place at Supper','moonfall-herbalist','crown-summons','A grieving brother follows a familiar voice into Moonfall’s grove. His sister’s memory may be what saves him.',[
    talk('supper-start','moonfall-herbalist','Visit the herbalist’s cottage in Moonfall, Narenthil.','I set three places out of habit. He saw the empty bowl and went very quiet. Then the singing started outside.','I should have gone with him. My knees wouldn’t move. Please follow the supper cloths before he answers it again.'),a,
    fight(q,'supper-spiders','moonfall',a,['grove-spider'],12,'The Supper Trail','Spiders gather around the abandoned meal.','The ribbon trail remains intact.'),b,
    choice('supper-end','moonfall-herbalist','Return to the herbalist in Moonfall.','He came back before dawn. Said his sister hated the name that voice used. I’d forgotten that. He hadn’t.',
      ['Keep the third bowl if it helps. But eat with the people who are here.','He’s coming tonight. I might ask the neighbours too. It’s been quiet in here too long.'],
      ['Let him put the bowl away when he is ready.','I’ll ask. Not decide for him. I keep forgetting there’s a difference when I’m worried.']),
  ],'A brother recognises a false voice by remembering his sister as a person, not just someone he lost.');
}
{
  const q='roads-small-shield';
  const a=search('shield-drift','starhold','pass-beacon',-650,360,'A small shield under a snowdrift',
    'A young guard’s shield carries dents on its inner face. He used it as a sled for an injured traveler, not to fight. The wolf tracks follow the narrow groove it left.');
  const b=search('shield-cairn','starhold','pass-beacon',650,390,'A guard’s shelter beside the cairns',
    'A message scratched in the frost asks anyone finding it to tell his captain he did not abandon his post. The injured traveler needed help, and he chose to leave the empty gate rather than leave her in the snow.');
  side(q,'A Shield Too Small for Glory','starhold-templar','crown-summons','Halla’s youngest guard vanished from his post. His tracks lead toward a rescue, not a desertion.',[
    talk('shield-start','starhold-templar','Speak to Halla near Starhold, Nardorous.','He borrowed my whetstone and never returned it. Normally that means I’m about to get a very long excuse.','This time he hasn’t come back at all. His shield was seen by the beacon. I’d rather hear the excuse.'),a,
    fight(q,'shield-wolves','starhold',a,['gray-wolf'],15,'The Shield Trail','Wolves gather along the sled groove.','The route to the guard’s shelter is safe.'),b,
    choice('shield-end','starhold-templar','Return to Halla in Starhold.','He’s alive. So is the woman. He keeps apologising about the gate. I nearly shook him.',
      ['Tell him he made the right choice. Teach the watch how to cover a missing post.','Aye. He shouldn’t have had to choose alone. That part is mine to fix.'],
      ['Give him a partner next time. Courage needs someone watching its back.','He’ll complain about being watched. Then they’ll become inseparable. I’ve seen it before.']),
  ],'The young guard returns with the traveler. Starhold changes how it covers rescues beyond the gate.');
}
{
  const q='roads-distant-fire';
  const a=search('fire-remains','starhold','pass-beacon',350,-650,'A cold hearth above the pass',
    'The fire burned furniture after the wood ran out. A carved chair leg bears a child’s height marks. The family chose warmth over the last thing they owned from home.');
  const b=search('fire-message','starhold','pass-beacon',-380,660,'A message hidden under the last coal',
    'The father wrote that he was ashamed he could not keep the house. His daughter added: you kept us. A porter wrapped both messages together rather than choose which one should survive.');
  side(q,'The House They Burned for Warmth','starhold-quartermaster','crown-summons','An abandoned mountain hearth holds a family’s last winter, and two very different memories of it.',[
    talk('fire-start','starhold-quartermaster','Visit Quartermaster Stores in Starhold, Nardorous.','A man asked whether anyone found a chair on the ridge. A chair, in all that snow. I thought he’d lost his wits.','Then he showed me where he’d marked his daughter’s height. If there’s anything left of it, I’d like to bring it down.'),a,
    fight(q,'fire-path','starhold',a,['gray-wolf'],12,'The Cold Hearth','Predators have made the abandoned shelter their approach to the pass.','The hearth can be searched without drawing the pack down toward the wagons.'),b,
    choice('fire-end','starhold-quartermaster','Return to Quartermaster Stores in Starhold.','He thinks we’re laughing at him for asking. I wish he could hear how his daughter talks about that winter.',
      ['Give him both messages. He deserves to know what she remembers.','I’ll put them together. No grand speech. Just a cup of something warm.'],
      ['Ask his daughter to bring the surviving chair leg to him herself.','She’s waiting outside already. Apparently patience doesn’t run in that family.']),
  ],'A father learns that his daughter remembers being saved, not losing a house.');
}
{
  const q='roads-tamed-tusk';
  const a=search('tusk-harness','redmesa','clan-road-muster',-650,320,'A mount’s harness cut with a familiar blade',
    'The cut freed the mount instead of stealing it. A young rider led the beast away before Krag could use it in a raid. He scratched his name under the saddle so Ugra would know who had taken responsibility.');
  const b=search('tusk-water','redmesa','southern-caravan-rest',420,-380,'A water bowl beside an empty tether',
    'The rider waited until the beast could drink before moving on. His little brother followed him with a bowl too heavy to carry. Their tracks return toward Red Mesa, together.');
  side(q,'The Mount That Would Not Charge','redmesa-beastmaster','crown-summons','Ugra is missing a war-mount and a young rider. Krag’s warriors want both returned for a raid.',[
    talk('tusk-start','redmesa-beastmaster','Speak to Ugra near Red Mesa, Rindass.','He took my best mount. Also my worst saddle. So either he’s a fool or he planned to walk beside her.','I know that boy. He can’t watch an animal suffer. Find him before Krag’s men do.'),a,
    fight(q,'tusk-pursuers','redmesa',a,['rindass-orc-raider','rindass-orc-spearman'],15,'The Stolen Mount','Krag’s riders close around the empty tether.','Ugra’s searchers can follow the young rider without Krag’s men behind them.'),b,
    choice('tusk-end','redmesa-beastmaster','Return to Ugra at Red Mesa.','He’s offered to work until he’s paid for the saddle. I told him it was a dreadful saddle. That made him cry, for some reason.',
      ['Give him work caring for the mounts. He has already shown he cares.','He’ll start tomorrow. And I’ll find him a saddle that doesn’t try to kill its rider.'],
      ['Let him rest first. Responsibility can wait until both brothers have eaten.','Fair. I’ve been giving orders when I should have been fetching bowls.']),
  ],'The brothers and their mount return safely. Compassion is treated as a strength of the clan.');
}
{
  const q='roads-forge-brothers';
  const a=search('brothers-blade','redmesa','southern-caravan-rest',-650,-340,'Two halves of a practice sword',
    'The wooden sword broke long before the fighting. The brothers each kept half. A new blade mark shows one half was used to wedge a shelter door open for the other brother’s family.');
  const b=search('brothers-shelter','redmesa','clan-road-muster',620,-360,'A shelter mark scratched over a clan sign',
    'Someone crossed out the clan challenge and wrote: my brother’s children sleep here. Beneath it, both halves of the old practice sword fit the same notch. Their quarrel did not survive the raid.');
  side(q,'Two Halves of a Sword','redmesa-forgewright','crown-summons','Dorga forged weapons for two feuding brothers. Their old practice sword may explain why one secretly protected the other.',[
    talk('forge-start','redmesa-forgewright','Visit the Clan Forge in Red Mesa, Rindass.','I made their first real swords. They tested them by fighting each other, naturally. I should have charged their mother extra.','Now one’s missing and the other won’t speak. There’s half a wooden sword at the southern shelter. Ask the wood. It’s less stubborn.'),a,
    fight(q,'forge-shelter','redmesa',a,['rindass-orc-raider','rindass-orc-spearman'],12,'The Brothers’ Shelter','Warriors return to the shelter where the brothers’ families hid.','The shelter mark and the old sword survive.'),b,
    choice('forge-end','redmesa-forgewright','Return to Dorga inside Red Mesa’s Clan Forge.','They’re both here. Sitting three stools apart and pretending not to look at each other. This could take years.',
      ['Put the two halves between them. Let them work out the words.','I can manage that. And I’ll put the hammers away, just in case.'],
      ['Ask them to mend the shelter together. They can talk while they work.','Finally, a sensible use for all those muscles. I’ll lend them tools, not opinions.']),
  ],'The brothers begin to repair the shelter they defended for each other.');
}
{
  const q='roads-water-knocks';
  const a=search('knocks-tool','deepford','rootwater-watch',-620,340,'A hammer wrapped in a child’s blanket',
    'The blanket muffled the hammer so an apprentice could work without attracting the spirits. He was trying to cut his teacher free. The teacher’s replies stopped, but a third sound kept answering.');
  const b=search('knocks-echo','deepford','rootwater-watch',610,390,'Three marks on the rescue rope',
    'The apprentice’s warning distinguishes his teacher’s two knocks from the spirits’ three. He dragged the wounded man out when the sounds overlapped. The real survivors left their rope to guide the next rescuers.');
  side(q,'The Third Knock','deepford-boatwright','crown-summons','Thrain hears three knocks beneath the spring. An apprentice’s rescue trail explains which answers can be trusted.',[
    talk('knocks-start','deepford-boatwright','Visit Boatwright Hall in Deepford, Druganwoods.','Two knocks means I’m coming up. Three means stay back. That was the rule. Then the water began doing both.','A young apprentice went after his teacher. Find his wrapped hammer. He’s cleverer than the rest of us put together.'),a,
    fight(q,'knocks-spirits','deepford',a,['marsh-wraith'],15,'The Third Knock','The water answers before you touch the hammer.','The false answering stops along the rescue trail.'),b,
    choice('knocks-end','deepford-boatwright','Return to Boatwright Hall in Deepford.','They’re safe. The old man says the boy disobeyed every order. Sounds proud while he says it, though.',
      ['Teach the new signal to every rescue crew.','Aye. And we’ll practise on dry ground first. I’m fond of hearing my own heartbeat.'],
      ['Ask the apprentice to teach it. The watch should learn from the person who survived.','He’ll go red as a beet. Then talk for an hour. Bring a chair.']),
  ],'The apprentice’s warning becomes part of Deepford’s rescue training.');
}
{
  const q='roads-unfinished-name';
  const a=search('name-stone','deepford','rootwater-watch',380,-650,'A memorial stone with one name unfinished',
    'The last name stops halfway through. Its carver heard the missing miner calling and left his tools beside the spring. The voice repeated a childhood nickname, but the missing man never answered to it.');
  const b=search('name-chisel','deepford','rootwater-watch',-420,650,'A chisel tied to a rescue rope',
    'The carver left his chisel as a weight for the rope. He realised what was calling him and climbed back out. Beneath the mud, his brother’s real final message asks that their mother not wait by the mine.');
  side(q,'The Unfinished Name','deepford-runesmith','crown-summons','A memorial carver goes missing while trying to finish his brother’s name. Bring back the truth without following the voice.',[
    talk('name-start','deepford-runesmith','Visit Hall Archive in Deepford, Druganwoods.','He’s carved names here for forty years. Left his own brother’s until last. I thought it was because his hand was shaking.','Then someone heard him talking to the empty mine. Please bring his tools home. Preferably with him holding them.'),a,
    fight(q,'name-spirits','deepford',a,['marsh-wraith'],12,'The Unfinished Name','Spirits gather around the half-carved stone.','The carver’s escape rope can be recovered.'),b,
    choice('name-end','deepford-runesmith','Return to Mara at Deepford’s Hall Archive.','He’s asked me to finish the letters. Said he can carve everyone else’s grief, but not his own.',
      ['Finish it with him beside you. He need not hold the chisel.','I’ll leave room on the bench. Some things are easier when nobody expects you to speak.'],
      ['Let him choose another day. Keep the stone safe until then.','It has waited this long. We can give him the kindness of another morning.']),
  ],'The carver survives. Finishing his brother’s memorial is his choice, not a test of courage.');
}
{
  const q='roads-empty-berth';
  const a=search('berth-knot','tidewatch','salt-bay-outlook',-650,380,'A sailor’s knot on an empty mooring rope',
    'The knot says the crew left under threat. A second knot says someone stayed behind willingly. The last sailor held the rope so the smaller boat could leave with the children.');
  const b=search('berth-shell','tidewatch','salt-bay-outlook',650,400,'A painted shell beneath a broken oar',
    'A daughter painted a ship with far too many sails. Her father carried it until he was taken aboard the pirates’ boat. A later mark says he was put ashore alive, and which search boat followed him.');
  side(q,'The Empty Berth','tidewatch-harbor-master','crown-summons','Jessa keeps a berth empty for a ship everyone else has given up on. Its last rope still carries the crew’s signals.',[
    talk('berth-start','tidewatch-harbor-master','Visit the Harbor Guild in Tidewatch, Portquill; arrive by boat.','People keep asking me to give that berth away. Plenty of ships waiting, they say. As if I can’t count.','The captain’s daughter comes to look at it every morning. Follow the knots at the outlook. Tell me something I can tell her.'),a,
    fight(q,'berth-raiders','tidewatch',a,['cutlass-pirate','pirate-boatswain'],15,'The Empty Mooring','Pirates return to cut away the crew’s knotted warning.','The rope and the painted shell remain safe.'),b,
    choice('berth-end','tidewatch-harbor-master','Return to Tidewatch’s Harbor Guild.','Alive when he reached shore. That’s not the same as safe. I won’t tell her more than we know.',
      ['Tell her the truth, and give her a place on the next search boat with family.','Her aunt can go. I’ll pay the passage. The berth can wait a little longer.'],
      ['Have the search crew carry her shell. Bring her news without risking another journey.','Aye. Something he’ll recognise even half-asleep. I’ll wrap it myself.']),
  ],'The daughter receives a real lead rather than a false promise that her father is already safe.');
}
{
  const q='roads-blue-mitten';
  const a=search('mitten-track','skallheim','ice-bay-outlook',-620,380,'A blue mitten beside a frozen net',
    'The mitten was deliberately placed where a searcher would see it. Small bootprints follow a hunter’s larger steps. Neither went onto the open ice.');
  const b=search('mitten-shelter','skallheim','ice-bay-outlook',630,420,'A sheltered net with a second mitten',
    'The hunter used the net as a windbreak. The child left her second mitten to point toward the warm shore path. She had listened when Runa taught her how not to disappear in snow.');
  side(q,'The Girl Who Left Her Mittens','skallheim-hunter','crown-summons','Runa’s young pupil vanishes near the bay, leaving a trail that shows she remembered her lessons.',[
    talk('mitten-start','skallheim-hunter','Speak with Runa near Skallheim, Frostlands; arrive by boat.','I taught her to leave something bright. Never thought I’d be grateful to find her mitten in a snowdrift.','There’s a hunter with her, I think. Two sets of tracks. Follow them before the next gust buries everything.'),a,
    fight(q,'mitten-wolves','skallheim',a,['frost-wolf'],15,'The Blue Mitten Trail','Frost wolves cross the child’s marked escape path.','The searchers can follow both sets of prints to the sheltered net.'),b,
    choice('mitten-end','skallheim-hunter','Return to Runa at Skallheim.','She’s home. Her hands are cold, naturally. Looked me straight in the eye and said mittens were replaceable.',
      ['Tell her she listened well. Then buy her warmer mittens.','I already bought two pairs. She asked if she could lose one for practice.'],
      ['Let her teach the younger children how she marked the way.','She’ll enjoy that much too much. Good. Frightened children could use somebody their own size.']),
  ],'Runa’s pupil returns. The village learns from the child who remembered how to ask for help.');
}
{
  const q='roads-last-warm-room';
  const a=search('warm-room-key','skallheim','ice-bay-outlook',350,-650,'A room key frozen into a door latch',
    'The innkeeper left the key outside so strangers could shelter without waking anyone. Wolves followed the smell of the abandoned meal, trapping the last guests behind the drift.');
  const b=search('warm-room-bowl','skallheim','ice-bay-outlook',-380,660,'A bowl set beside a sleeping place',
    'The oldest guest gave his meal to a stranger’s child. The child’s mother left a promise to return the bowl, having nothing else to offer. Their tracks join the hunters’ safe route.');
  side(q,'The Last Warm Room','skallheim-trader','crown-summons','Eyvind opened a shelter to strangers and now fears he left them on the wrong side of the wolves.',[
    talk('warm-start','skallheim-trader','Speak with Eyvind at Skallheim’s longhouse.','I told them the room was safe. Said it myself, quite cheerfully. Now the drift’s down and the hunters can’t get through.','The key is still in the latch. If you find that door, don’t knock politely. They’ve waited long enough.'),a,
    fight(q,'warm-room-pack','skallheim',a,['frost-wolf'],15,'The Last Warm Room','The pack gathers at the snowbound shelter.','The guests can reach the hunters’ route.',{label:'Free the shelter’s frozen latch',duration:4500}),b,
    choice('warm-end','skallheim-trader','Return to Eyvind in Skallheim.','She brought my bowl back. Walked all that way carrying it under her coat. I nearly laughed. Nearly.',
      ['Fill it again. A returned bowl is a fine excuse for supper.','That it is. Stay, if you’ve time. There’s room for another chair.'],
      ['Let her keep it. Then open the shelter together, with hunters watching the path.','She’s offered already. Says a warm room ought to belong to more than the person with the key.']),
  ],'The shelter reopens with a guarded approach, and the guests help care for it.');
}
{
  const q='roads-smiths-daughter';
  const a=search('daughter-hammer','blackspire','darkav:ashwood-watch',-420,380,'A small hammer beside the ash road',
    'The hammer is a child’s gift to her mother. Its head carries a crooked sun. The smith dropped it while carrying another worker away from the first furnace blast.');
  const b=search('daughter-message','blackspire','darkav:cinder-pilgrim-ruin',390,380,'A message scratched around a crooked sun',
    'The smith wrote that she could no longer hold her tools steady, then scratched her daughter’s sun beside the words. She survived the blast and went toward the workers’ shelter, ashamed to return without the gift.');
  side(q,'A Sun Small Enough to Carry','blackspire-forgemaster','crown-summons','Vexa searches for an injured smith who thinks a broken hand has cost her both her craft and her place at home.',[
    talk('sun-start','blackspire-forgemaster','Visit Forge Hall in Blackspire, Darkav; arrive by boat at Ashen Landing.','She thinks I’ll turn her away if she can’t lift a hammer. Has she met me? I’ve been shouting her name down the road for two days.','Her daughter made her a little hammer with a sun on it. Find that, and you’ll find where she went.'),a,
    fight(q,'sun-ashroad','blackspire',a,['marsh-wraith'],15,'The Crooked Sun','The dead gather around the abandoned tools.','The smith’s first escape trail is open.'),b,
    fight(q,'sun-shelter','blackspire',b,['marsh-wraith'],9,'A Place Beyond the Furnace','Spirits block the final approach to the workers’ shelter.','The shelter route is clear for Vexa’s searchers.'),
    choice('sun-end','blackspire-forgemaster','Return to Vexa in Blackspire’s Forge Hall.','She’s home. Keeps staring at her hand. Her daughter keeps putting the little hammer in the other one.',
      ['Ask her to teach. A hand is not everything she knows.','I’ve three apprentices who need her. I’ll ask, not order. There’s been enough of that.'],
      ['Let her choose her work after she has healed. Keep her place here.','Her place was never in question. I’ll tell her that until she believes me.']),
  ],'The smith comes home to her daughter and a place in the forge that does not depend on her injury.');
}

// Continuity pass: each region earns its transition. These are new situations,
// not a requirement to repeat an already defeated boss or wait out a timer.
{
  const q='first-road';
  const warning=search('polish-first-warning','oakmere','royal-waystone',200,600,'The message the rider could not finish',
    'Inside the torn wrapping is an unfinished message: Cecily, the east stone is open. The things under it follow the sound. Edmund must keep the village bell quiet until the iron is covered. The rider tried to carry this warning before finding Lena.');
  chapter(q,'watch-plan','Chapter 1 · The warning he carried',[
    talk('polish-rider-warning','lena-cartwright','Ask Lena east of Oakmere what the wounded rider tried to say.',
      'He wasn’t frightened for himself. Kept asking whether the village bell had rung. I thought he was feverish.',
      'There’s another fold in the cloth, by the king’s waystone. I dropped it when the men came. He tried so hard to give it to me.'),
    warning,puzzle('polish-bell-rule','orin-bell','Ask Etheldreda at Oakmere’s shrine how to protect the village.',
      'The rider heard movement whenever the bell sounded. The covered stone went quiet. What would you have the watch do?',
      ['Send runners. Keep the bell quiet until we cover the iron.','I’ll tell Joan. She can send someone to the farms while I warn the people here.'],
      ['Ring harder so the whole road hears the warning.','And so would whatever is listening beneath it. Read his message again. He was trying to spare us that.']),
  ]);
}
{
  const q='crown-summons';
  chapter(q,'customs','Chapter 2 · A name for the messenger',[
    talk('polish-messenger-name','renna-vale','Ask Cecily inside Highmere’s Royal Archive why the messenger knew about the compass.',
      'Giles. He carried my letters for years. I used to know he’d arrived by the noise he made complaining about the stairs.',
      'Edmund wrote last winter about your mother’s compass. Said it had begun pulling east. I told Giles to ask for the lad Edmund raised—the one with the restless needle.',
      'He must have thought you could warn Oakmere before the men reached it. That’s why he asked for you.',
      'I’ll write to his sister. She should hear it from me. Thank you for telling me what happened.'),
  ]);
}
{
  const q='eight-regions';
  const root=search('polish-grove-memory','moonfall','moon-pilgrim-grove',180,650,'The old keeper’s shelter mark',
    'Beside a carved hand, the old keeper wrote: keep this path clear for travelers. Fresh footprints follow the dry ground. None of the black roots have crossed it.');
  chapter(q,'grove-oath','Chapter 3 · What the Warden was guarding',[
    root,puzzle('polish-grove-understanding','elarion-lorekeeper','Explain the shelter mark to Ilyra in Elarion’s Lore Archive.',
      'The Warden keeps returning to the same wounded root. The pilgrims escaped by the dry path. Why does it leave that path alone?',
      ['It’s guarding the damaged root. We can keep the searchers on the dry path.','Yes. It used to leave that path open for travelers. Perhaps it still remembers.'],
      ['The dry path must hide another piece of valuable iron.','There is no socket there. Think about who was able to use the path, not what we could take from it.']),
    talk('polish-grove-promise','maerwen-reedleaf','Return to Maerwen near Moon Pilgrims’ Clearing before confronting the Warden.',
      'I told the children the Warden would never hurt them. Then it did. I don’t know how to explain that.',
      'If you can stop it without tearing the grove apart, please do. The children used to love coming here. I’d like to bring them back one day.'),
  ]);
  const ridge=search('polish-ridge-shelter','starhold','pass-beacon',-700,-180,'A stone door braced against the wind',
    'Porters marked this as the next convoy’s refuge. The ward once kept the ridge beasts above it. Stonejaw drove them downhill after his own den began shaking. The people and creatures were pushed into the same narrow shelter route.');
  chapter(q,'mountain-code','Chapter 3 · Room beneath the mountain',[
    ridge,fight(q,'polish-ridge-refuge','starhold',ridge,['gray-wolf','hedge-goblin','goblin-stone-slinger'],15,'The Ridge Refuge',
      'Scavengers follow the displaced pack into the refuge approach. Keep the marked doorway open for the waiting convoy.',
      'The refuge approach is clear. The porters take the sheltered route while the watch prepares its signal.',
      {label:'Release the refuge’s wedged outer latch',duration:4500}),
    talk('polish-mountain-scope','starhold-quartermaster','Return to Quartermaster Stores in Starhold before facing Stonejaw.',
      'The porters are safe. The next convoy isn’t, not while Stonejaw holds the pass. I wish one rescued wagon meant the trouble was over.',
      'The iron-cutters hired guards in Rindass. Dorga’s forge mark is on a tool they left. I’ll send a warning ahead. You shouldn’t arrive there alone with accusations.'),
  ]);
  const rally=search('polish-clan-beacon','redmesa','southern-caravan-rest',180,650,'A warning flag stripped of its colours',
    'Someone removed the clan colours so any traveler would recognise the plain distress flag. Krag’s warriors then cut its rope. The rescued rider had tried to warn every family on the road, including clans he had once fought.');
  chapter(q,'well-treaty','Chapter 4 · A road without clan colours',[
    rally,fight(q,'polish-clan-road','redmesa',rally,['rindass-orc-raider','rindass-orc-spearman'],15,'The Colourless Flag',
      'Krag’s rear guard blocks the families’ approach to the plain warning flag.',
      'The plain flag rises. Families from the shelter can reach Ugra without wearing the colours Krag demands.',
      {label:'Raise the plain distress flag',duration:4000}),
    talk('polish-clan-cause','redmesa-beastmaster','Speak with Ugra in Red Mesa before challenging Krag.',
      'He keeps saying I brought outsiders into our quarrel. Look at that road. Everyone on it is already in the quarrel, whether they asked to be or not.',
      'Dorga says the stolen iron went by river to Deepford. Once Krag is stopped, we’ll help the dwarves find it. I don’t want our children growing up inside this same fight.'),
  ]);
  const crossing=search('polish-river-sign','deepford','rootwater-watch',-680,160,'A ferry mark beneath an older carving',
    'An old carving shows the bridge as it stood before the flood. Beside it, a much newer shipping mark copies the same crossing sign. The shipment was ward iron, bound for Portquill; the date is last month.');
  chapter(q,'mine-account','Chapter 4 · What the river carried onward',[
    talk('polish-grief-rest','bruni-stonevein','Speak quietly with Bruni at Rootwater after reading the flood letter.',
      'You don’t have to say anything clever. Or brave. Sit down. The stone’s dry on this side.',
      'I spent years wishing I’d made them stay. Your father would have hated that. He’d have asked who was going back for the people still across the water.',
      'There’s something else by the old ferry mark. Not about their deaths. About who used their kindness afterward. Look when you’re ready.'),
    crossing,talk('polish-river-departure','deepford-boatwright','Visit Thrain in Deepford’s Boatwright Hall before the mine repair.',
      'That is Portquill’s dock mark. Those shipments were recent. Your parents were gone long before anyone began cutting our wards.',
      'I wish I’d known your parents better. From what Bruni says, they’d have liked seeing these boats full of families instead of stolen iron. I’d like that too.'),
  ]);
  const shore=search('polish-shore-refuge','tidewatch','salt-bay-outlook',160,700,'A white cloth beneath the signal lantern',
    'The captives stitched white scraps into their clothing to show the rescue boats whom to approach. One sailor left the same sign along the shore path. The waterline scratched beside it marks safe landing rocks, not another false light.');
  chapter(q,'harbor-account','Chapter 5 · A true light on the shore',[
    shore,fight(q,'polish-shore-refuge','tidewatch',shore,['cutlass-pirate','pirate-boatswain'],15,'The White Cloth Landing',
      'The Salt King’s last shore patrol moves to cut off the captives’ landing path.',
      'The landing path is open. Jessa’s crews can reach the white-cloth signal without bringing boats under the flagship’s side.'),
    talk('polish-shore-next','tidewatch-sailmaker','Speak with Orren in Tidewatch’s Sailmaker House before the Salt King fight.',
      'A sailor brought this back. The lens was meant for Skallheim. Pirates used it to bring boats onto rocks while people there waited in the dark.',
      'When you get to the cold coast, find Eyvind. Tell him which light is theirs. I’d rather send a useful message than another apology.'),
  ]);
  const thaw=search('polish-cold-boundary','skallheim','ice-bay-outlook',680,-170,'A line of melted frost around a black shard',
    'The frost stops in a clean circle, although no fire warmed it. The shard was torn from the beacon’s ward and reforged while still bearing its old marks. The Wyrm followed that broken boundary downhill. A smith’s sun is stamped beneath the damaged sign.');
  chapter(q,'wyrm-preparation','Chapter 5 · The boundary the Wyrm followed',[
    thaw,puzzle('polish-cold-rule','skallheim-hunter','Discuss the shard with Runa near Skallheim before driving the Wyrm away.',
      'The tracks follow the old boundary, even where the road turns away. The shard carries the beacon mark. What are we seeing?',
      ['It’s following the old ward line. Keep people back while we drive it uphill.','Aye. We can guide the boats while you drive it back. Nobody goes chasing it into the cliffs.'],
      ['It must be guarding treasure. We should search its hollow.','There were eggshells in that hollow, not coin. Look at the tracks again. It came down here hurt.']),
    talk('polish-cold-next','skallheim-trader','Visit Eyvind at Skallheim’s longhouse before leaving the coast.',
      'My niece brought the same black metal from a boat out of Darkav. She said it sang when the forge wind blew through it.',
      'Ashen Landing. Then the road north to Blackspire. Ask Vexa about the little sun on the shard. And take the good cloak. This one, not the one full of sword holes.'),
  ]);
  const hearth=search('polish-forge-warning','blackspire','darkav:cinder-pilgrim-ruin',640,190,'A keeper’s warning beneath the cold lamps',
    'The warning says each ward shelters a place; joined together they quiet the roads between them. The Seer crossed out quiet and wrote obey. Beneath that, a surviving worker added: the mountain does not obey her either. The dragon’s chains are failing.');
  chapter(q,'forge-truth','Chapter 6 · The promise she changed',[
    hearth,puzzle('polish-forge-rule','blackspire-forgemaster','Read the keeper’s warning with Vexa inside Blackspire’s Forge Hall.',
      'One bit of iron from every ward, all heated together. She said she could make the whole land listen. What did she leave out?',
      ['She took the iron out of the very stones that kept people safe.','And left the rest of us wondering why the roads had gone bad. We stop her, then mend what she broke.'],
      ['She only needed a hotter furnace to make the promise true.','Listen to the workers who escaped. More heat was her answer every time someone was hurt.']),
    talk('polish-seer-stakes','blackspire-warder','Speak to Dain outside Blackspire before facing the Ashen Seer.',
      'The voices are quieter when you close a lamp. They get louder when the Seer lights another. She knows exactly what she is feeding.',
      'And Varkhul has left the high ridge twice today. Stop her before she opens the last chain. After that, we still have a mountain to hold together.'),
  ]);
  const home=search('polish-home-watch','highmere','crown-freight-camp',-180,-700,'A watch lamp laid beside a false order',
    'The order sends the guards away from the archive. A watchwoman has written beneath the seal: Captain, I know you did not sign this. Men are waiting by the stairs. I am staying at my post.');
  chapter(q,'capital-return','Chapter 7 · The order nobody should obey',[
    home,talk('polish-archive-warning','captain-yselle-ward','Warn Isabel at Highmere’s western watch before the archive attack.',
      'My guard refused that order. Good woman. I should have taught them to question a seal sooner.',
      'Thomas and his mother are safe. Cecily is still upstairs. Go to her; I’ll watch Walter’s house. We’re not chasing him through the streets while someone burns the witnesses behind us.'),
  ]);
  chapter('the-last-ward','covenant-forge','Chapter 8 · Many hands, one binding',[
    talk('polish-forge-assembly','blackspire-forgemaster','Join Vexa inside Blackspire’s Forge Hall for the final binding.',
      'The elves showed us where to leave room for the roots. The mountain smiths explained what the cold would do to the iron. Dorga told me my joints were crooked. Loudly.',
      'Thrain’s river knots will hold when the chain cools. The coast sent a true lens. I couldn’t make this alone. Turns out I was the last to notice.',
      'Your mother marked all those resting places on her map. We’ve matched the links to them. Once they’re fitted, people should be able to use the roads again.'),
    puzzle('polish-binding-answer','blackspire-forgemaster','Confirm the binding’s purpose with Vexa before carrying it toward Varkhul.',
      'Once the dragon retreats, what are we using this chain to do?',
      ['Repair the ward while he’s away. Let him fly off.','Good. Dain has a path marked out for you too. Don’t stay up there once the crews are finished.'],
      ['Chain Varkhul to the furnace so he can never leave.','No. We need to keep him away from the houses, not drag him into them. I’m not trying the Seer’s trick again.']),
  ]);
}

// World recovery is unlocked by the relevant main-story result. These are
// optional: they explain continuing danger without undoing a chapter's victory.
{
  const q='world-oakmere-watch';
  const a=search('world-oakmere-scent','oakmere','royal-waystone',-780,170,'A trail of stolen warning cloths',
    'Goblins stole the bright warning cloths for their camp. Travelers followed the bare stakes onto the wrong path. The cloths were useful because ordinary people could read them without a written notice.');
  const b=search('world-oakmere-path','oakmere','royal-waystone',780,220,'A roadwarden’s mark cut below the moss',
    'Beneath the moss, an arrow points around the roots to dry ground. A roadwarden has scratched a warning beside it: fallen branches ahead. Check the bend before bringing a cart through.');
  world(q,'A Road Is More Than a Sign','elara-voss','Oakmere','return-aldren','Varr is gone, but his broken warning posts still send travelers into danger. Help Joan put a living watch behind the signs.',[
    talk('world-oakmere-start','elara-voss','Speak to Joan near Oakmere after the watchtower road is reopened.','We’ve got the tower back. Now people assume every path beneath it is safe. That’s going to get someone killed.','Find the missing warning cloths by the king’s road. Goblins have been dragging bright things into the brush.'),a,
    fight(q,'world-oakmere-cloths','oakmere',a,['hedge-goblin','goblin-stone-slinger'],15,'The Missing Warning Cloths','Goblins block the path where the road markers were stripped.','The watch can recover the bright cloths.'),b,
    puzzle('world-oakmere-plan','elara-voss','Agree a safer watch with Joan in Oakmere.','The cloths are back. What stops this happening again?',
      ['Pair the signs with regular walks. Let travelers report changes at the inn.','Good. Hawise hears trouble before my runners do half the time. I’ll ask her, politely.'],
      ['Put up a notice saying the road can never be dangerous again.','I’m a guard captain, not a miracle worker. We can promise to look, not that nothing will ever happen.']),
    talk('world-oakmere-end','sena-marrow','Tell Hawise inside Marrow Inn how to report dangerous roads.','Joan asked me politely. I nearly checked whether she was ill.','We’ll keep a place by the door for road news. Tell people what they actually saw, not what their cousin’s neighbour swears ate a horse.'),
  ],'Oakmere restores warning cloths and a routine watch. Bandits and beasts remain, but danger no longer has to arrive as a surprise.');
}
{
  const q='world-narenthil-roots';
  const a=search('world-root-water','elarion','greenward-ruin',780,210,'A spring choked by loose roots',
    'The Warden’s retreat did not remove the roots it threw across the spring. Young thornlings have gathered in the sheltered water. Cutting every root would poison the same trees the keepers hope to save.');
  const b=search('world-root-mouth','moonfall','moon-pilgrim-grove',-760,180,'A narrow spillway beneath the living roots',
    'The old keepers let the spring drain between roots rather than through them. The open channel would carry the stagnant water away without harming the grove.');
  world(q,'What Grows After the Silence','elarion-lorekeeper','Narenthil','report:elarion','The Warden has fallen back, but its wounded grove still needs care. Help the keepers reopen the spring without destroying what survived.',[
    talk('world-root-start','elarion-lorekeeper','Visit Ilyra in Elarion’s Lore Archive after the Warden chapter.','The singing stopped. People think that means the grove is well. I wish it were that simple.','The spring’s trapped behind loose roots. Thornlings are nesting there. Look before you cut, please.'),a,
    fight(q,'world-root-spring','elarion',a,['blighted-thornling','grove-spider'],15,'The Stagnant Spring','Creatures gather around the water the wounded grove cannot drain.','The spring can be examined without the nest closing around it.'),b,
    puzzle('world-root-plan','moonfall-herbalist','Discuss the old spillway inside Moonfall’s herbalist cottage.','Which path lets the water leave without tearing out the living roots?',
      ['The narrow channel between them. Clear that before cutting anything alive.','Yes. There’s room for the water there. We can clear the loose earth without touching the roots.'],
      ['Burn the grove floor so nothing can grow back.','And where would next year’s shade come from? The channel is already there. We need not make another wound.']),
    fight(q,'world-root-channel','moonfall',b,['blighted-thornling'],9,'The Keeper’s Spillway','Thornlings close around the old drainage mouth.','The keepers can tend the open spillway.',{label:'Clear loose debris from the spillway',duration:5000}),
    talk('world-root-end','elarion-lorekeeper','Return to Ilyra inside Elarion’s Lore Archive.','The water’s moving. One of the children asked whether the grove was forgiven now.','I said it wasn’t a punishment. It was a place we hurt, and a place we can help. She brought a very small watering can.'),
  ],'The spring can drain again. The keepers are tending the damaged roots, and the children have begun bringing water for the young trees.');
}
{
  const q='world-starhold-ridge';
  const a=search('world-ridge-road','starhold','pass-beacon',770,180,'A refuge mark covered by fresh scree',
    'Fresh stones lie across the refuge mark. More are loose on the slope above it. A wagon wheel has struck one and broken; the driver has left a warning tied to the axle.');
  const b=search('world-ridge-ward','starhold','pass-beacon',-760,220,'A low shelter hidden below the ridge wind',
    'The opening faces away from falling scree. Porters left a simple plan: one watcher above, one below; stop the wagons when either loses sight of the other.');
  world(q,'After the Mountain Moves','starhold-templar','Nardorous','report:starhold','Stonejaw is driven off, but the pass still sheds rock. Halla needs a refuge and a warning system the next convoy can trust.',[
    talk('world-ridge-start','starhold-templar','Speak to Halla near Starhold after reopening the mountain pass.','We beat the troll, and a fist-sized stone came down on my breakfast. The mountain hasn’t heard the victory speech.','Check the refuge marks. The next convoy needs somewhere to wait without standing under loose rock.'),a,
    fight(q,'world-ridge-scavengers','starhold',a,['hedge-goblin','goblin-stone-slinger'],15,'The Buried Refuge Mark','Scavengers occupy the broken refuge approach.','The route beneath the refuge mark is clear.'),b,
    puzzle('world-ridge-signals','starhold-quartermaster','Plan the convoy watch inside Starhold’s Quartermaster Stores.','Two watchers, one above and one below. If either cannot see the other, do we send the wagons?',
      ['No. Hold them in the low refuge until both can give the signal.','Good. We can be late with a living driver. That’s a complaint I’m happy to hear.'],
      ['Yes. The troll is gone, so the rest must be safe.','The rock doesn’t need a troll to fall. Look at where the refuge sits.']),
    talk('world-ridge-end','starhold-templar','Return to Halla near Starhold.','The first convoy waited an hour, complained the whole time, and arrived with every wheel and driver.','Best complaints I’ve heard all week. I even returned the quartermaster’s mug.'),
  ],'The first convoy reaches Starhold safely. Watchers keep an eye on the loose slope while the next wagons wait below in shelter.');
}
{
  const q='world-redmesa-herds';
  const a=search('world-herd-trail','redmesa','clan-road-muster',-780,160,'A broken water trough beside hoofprints',
    'Krag’s barriers drove the herds toward the same few drinking places. The fighting ended, but the frightened boars still charge anyone squeezing between them and water.');
  const b=search('world-herd-space','redmesa','southern-caravan-rest',760,200,'An old watering path wide enough for a herd',
    'The path leaves room for beasts and walkers to pass separately. The clans once took turns guiding mounts here before Krag fenced it into a private approach.');
  world(q,'Room at the Water','redmesa-beastmaster','Rindass','report:redmesa','Krag’s fall cannot teach frightened mounts that the barriers are gone. Ugra asks for a safer watering route, not a slaughter of every herd.',[
    talk('world-herd-start','redmesa-beastmaster','Speak to Ugra near Red Mesa after Krag’s defeat.','The boars don’t understand that we won. They understand that the last person near their water carried a whip.','Clear the charging beasts from the narrow approach. Leave the quiet herds to me. There’s a difference.'),a,
    fight(q,'world-herd-approach','redmesa',a,['rindass-boar'],12,'The Crowded Watering Place','Charging boars block the narrow approach used by the rescued families.','Ugra can guide the remaining herd toward open water.'),b,
    puzzle('world-herd-path','redmesa-forgewright','Speak to Dorga inside Red Mesa’s Clan Forge about the old path.','We could put the barriers back. That would keep the beasts in one place. Would it fix this?',
      ['No. Give mounts and families separate approaches to the same water.','Aye. We don’t need another chief’s fence to make us feel busy. I’ll help Ugra open the old path.'],
      ['Yes. Make the pens smaller so no beast can move.','Then the next frightened charge will have nowhere to go but through a child. Think wider, not tighter.']),
    talk('world-herd-end','redmesa-beastmaster','Return to Ugra near Red Mesa.','One of the young mounts drank while a human child washed her hands across the way. Neither cared what clan the other belonged to.','Almost insulting, how quickly a boar can put our grand quarrels to shame.'),
  ],'Ugra guides the calmer herds along the old watering path. With room for both beasts and travelers, the families can reach the well again.');
}
{
  const q='world-deepford-spring';
  const a=search('world-spring-channel','deepford','rootwater-watch',760,180,'Dark water behind a cracked waste channel',
    'The Rootfather no longer blocks the repair, but mine waste still reaches the spring. Old hammer marks show that workers reported the crack before anyone blamed the guardian.');
  const b=search('world-spring-gate','deepford','rootwater-watch',-780,180,'A settling pool marked with three waterlines',
    'The highest line means stop the mine flow. The lower two show where the spring can drain while the waste settles. Someone painted over the stop mark to keep the mine working.');
  world(q,'The Water Beneath the Victory','deepford-runesmith','Druganwoods','report:deepford','The guardian has withdrawn, but the cause of its anger is still running into the spring. Help Mara finish what the battle made possible.',[
    talk('world-spring-start','deepford-runesmith','Visit Mara inside Deepford’s Hall Archive after the Rootfather chapter.','The water is still dark. No amount of thanking you will change that. We have a channel to mend.','The workers warned us before the roots rose. I’ve found the old marks. Come and see what we chose not to hear.'),a,
    fight(q,'world-spring-watch','deepford',a,['marsh-wraith','grove-spider'],15,'The Broken Waste Channel','Spirits and nest creatures block the workers’ access to the cracked channel.','The workers can reach the damage.'),b,
    puzzle('world-spring-flow','deepford-boatwright','Read the three waterlines with Thrain in Deepford’s Boatwright Hall.','The water reaches the top mark. The mine wants another shift. What do we do?',
      ['Stop the waste flow until the settling pool drops below the safe line.','Good. I’d rather argue with a foreman than drink his excuses.'],
      ['Paint the line higher so the spring appears safe.','That is what got us here. The water won’t change because we lie about the wall.']),
    fight(q,'world-spring-repair','deepford',b,['marsh-wraith'],9,'The Settling Gate','The last spirits gather at the disused settling gate.','Mara’s crews can complete the channel repair.',{label:'Open the settling gate to the lower channel',duration:5000}),
    talk('world-spring-end','deepford-runesmith','Return to Mara inside Deepford’s Hall Archive.','It’s clearer than yesterday. Don’t drink it yet, mind. I’ve already had to tell two miners to put their cups away.','We’ll keep checking. I’d rather make them carry water a while longer than have anyone fall ill.'),
  ],'The broken channel is mended. Mara keeps watch over the settling pool, and the miners carry clean water from elsewhere while the spring recovers.');
}
{
  const q='world-portquill-lights';
  const a=search('world-port-lens','tidewatch','salt-bay-outlook',-780,150,'A true lens beside a wreckers’ hood',
    'The hood hides the shoreward light while leaving a beam at sea. A true harbour signal must be visible to its own watch as well as incoming crews. The Salt King’s remaining wreckers still use unguarded lamps.');
  const b=search('world-port-answer','tidewatch','salt-bay-outlook',780,180,'A signal cloth with an answering pattern',
    'Incoming boats answer a true shore lamp with two short lights. The shore then leaves a steady light for the safe channel. No answer means the crew waits offshore instead of following an unknown flame.');
  world(q,'Lights Worth Following','tidewatch-harbor-master','Portquill','report:tidewatch','The Salt King can return, and his wreckers still know the rocks. Jessa wants a true harbour signal that pirates cannot imitate with one stolen lantern.',[
    talk('world-port-start','tidewatch-harbor-master','Visit Jessa inside Tidewatch’s Harbor Guild after the Salt King chapter.','We stopped his ship. We didn’t teach every sailor which light to trust. The next wrecker will know that.','Find the old answering cloth by the outlook. Orren says the safe pattern is still stitched into it.'),a,
    fight(q,'world-port-wreckers','tidewatch',a,['cutlass-pirate','pirate-boatswain'],15,'The Last False Lantern','Wreckers defend another hooded shore lamp.','The false lantern can no longer draw boats toward the rocks.'),b,
    puzzle('world-port-signal','tidewatch-sailmaker','Practise the answering pattern with Orren in Tidewatch’s Sailmaker House.','A ship sees a lamp but gets no reply to its two short lights. What does the helmsman do?',
      ['Wait offshore. No reply means the channel has not been checked.','Exactly. A late supper is better than a hungry sea.'],
      ['Follow the brightest light before another boat gets the berth.','That is the wreckers’ favourite answer. Try the one where everyone keeps their feet dry.']),
    talk('world-port-end','tidewatch-harbor-master','Return to Jessa inside Tidewatch’s Harbor Guild.','The watch tried the new pattern in daylight first. Sensible, I thought, until half the harbour came to offer improvements.','Still, they all know it now. Harder to fool a whole shore than one tired sailor.'),
  ],'The harbor watch and the fishing crews have practised the answering lights together. Jessa posts a watch by the shore lamp before the evening boats arrive.');
}
{
  const q='world-frost-shelters';
  const a=search('world-frost-drift','skallheim','ice-bay-outlook',780,150,'A drift covering the shore shelter stakes',
    'The Wyrm has moved back, but the storm covers the shelters just as quickly as before. A lantern alone cannot guide someone who has lost sight of the next marker.');
  const b=search('world-frost-rope','skallheim','ice-bay-outlook',-780,210,'A guide rope tied below the winter wind',
    'The rope runs low enough to find by hand. A knot at each shelter lets a blinded traveler count their way without trusting a voice from the dark. Each knot is different so a child can tell the stops apart.');
  world(q,'A Path You Can Hold','skallheim-hunter','Frostlands','report:skallheim','Runa wants the coast to remain passable when the beacon vanishes in snow. Help the longhouse connect shelters by something more reliable than a distant voice.',[
    talk('world-frost-start','skallheim-hunter','Speak to Runa near Skallheim after driving the Wyrm from the coast.','The Wyrm’s gone uphill. The weather, inconsiderately, has stayed. We lost a marker under the last drift.','Eyvind found an old guide rope. Check where it ran. We need something people can hold when they can’t see the lantern.'),a,
    fight(q,'world-frost-markers','skallheim',a,['frost-wolf'],15,'The Buried Shore Stakes','Frost wolves block the drift-covered shelter approach.','The hunters can uncover the old shelter stakes.'),b,
    puzzle('world-frost-route','skallheim-trader','Discuss the guide knots with Eyvind at Skallheim’s longhouse.','The beacon disappears in snow. Someone calls from farther along the shore. Which do you follow?',
      ['The low rope and its shelter knots. Stop at shelter if the rope is broken.','Aye. A rope won’t pretend to be your father. And if it breaks, we know what needs mending.'],
      ['The voice. If it sounds friendly, it must know the way.','You heard what happened by the beacon. Friendly is not the same as alive.']),
    talk('world-frost-end','skallheim-hunter','Return to Runa near Skallheim.','We tested it with our eyes closed. Eyvind walked into a post and accused the post of moving.','Then the children tried. Got every shelter right. I think we’ll let them teach the adults.'),
  ],'Guide ropes join the shore shelters again. The children know each knot by touch, and Runa has promised to check the ropes after every storm.');
}
{
  const q='world-darkav-lamps';
  const a=search('world-dark-lamp','blackspire','darkav:ashwood-watch',760,150,'An unlit lamp beside a warm workers’ hearth',
    'Survivors kept a real fire for warmth and covered the cold lamps that copied the dead. The Seer’s defeat did not remove every fragment she left in the outposts.');
  const b=search('world-dark-vent','blackspire','darkav:cinder-pilgrim-ruin',-780,200,'A cracked lamp stand above a vent',
    'Ash blocks the vent beneath the stand. Opening it carries smoke out of the shelter without feeding the cold flame. Workers once marked the difference with a warm handprint; the Seer painted it over.');
  world(q,'Warmth Without a Voice','blackspire-warder','Darkav','report:blackspire','The Seer is stopped, but her cold lamps still wait in abandoned shelters. Help Dain make places of warmth without another promise to summon the dead.',[
    talk('world-dark-start','blackspire-warder','Speak to Dain outside Blackspire after the Ashen Seer chapter.','A woman asked whether we should smash every lamp in the shelters. I told her we’d leave her a real fire first.','Check Ashwood. Some of those fragments still draw spirits. We can close them without leaving people in the cold.'),a,
    fight(q,'world-dark-fragments','blackspire',a,['marsh-wraith'],15,'The Abandoned Cold Lamps','The surviving cold fragments gather spirits around the old watch.','Dain’s crews can cover the abandoned cold lamps.'),b,
    puzzle('world-dark-warmth','blackspire-forgemaster','Read the painted handprint with Vexa inside Blackspire’s Forge Hall.','The shelter needs warmth. The cold lamp gives light but draws voices. What do we keep?',
      ['A real hearth and a clear smoke vent. Cover the cold fragment.','Plain work. No miracle promised. I can live with that.'],
      ['The cold lamp. Perhaps the voices will become kind if we wait.','That hope kept people beside her furnace long after they were hurt. We can do better than ask them to wait again.']),
    fight(q,'world-dark-shelter','blackspire',b,['marsh-wraith'],9,'The Warm Hearth','Spirits gather where the cold stand still covers the vent.','The shelter crew can safely clear its smoke vent.',{label:'Close the cold stand and uncover the smoke vent',duration:5000}),
    talk('world-dark-end','blackspire-warder','Return to Dain outside Blackspire.','There’s a fire at Ashwood. Real smoke, real heat. Someone complained the soup was thin.','I’ve never been so pleased to hear a living person complain about supper.'),
  ],'Dain’s crews cover the last cold lamps at Ashwood and clear the smoke vents. A real fire warms the shelter, and the workers gather around it for supper.');
}

export const ROAD_CHAPTERS:readonly RoadChapter[]=chapters;
export const ROAD_SIDE_QUESTS:readonly QuestDefinition[]=sides;
export const WORLD_STORY_QUESTS:readonly QuestDefinition[]=worlds;
export const ROAD_CLUES:readonly RoadClue[]=clues;
export const ROAD_ENCOUNTERS:readonly StoryEncounter[]=encounters;
// Keep validation finite while allowing every authored defeated slot, complete
// marker and choice. The original 512 limit predates these finite operations.
export const ROAD_STORY_FLAG_BUDGET=encounters.reduce((sum,e)=>sum+2+e.waves.reduce((n,w)=>n+w.length,0),0)
  +(sides.length+worlds.length)*2+64;
