import {TOWN_BY_ID} from './towns';
import {NPC_BY_ID,NPC_NAME_ALIASES} from './npcs';
import {rewriteNpcMentions} from './npcPresentation';
import {CONTENT_BY_ID} from './content';
import {STORY_ENCOUNTERS} from './adventure';
import {WORLD_STORY_QUESTS} from './roadStories';
import type {StoryPanelRef} from './storyPanelArt';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string;focusNpcId?:string;interiorId?:string;illustration?:StoryPanelRef;variants?:Array<{flag:string;line:string}>}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const npc=(id:string,line:string):StoryShot=>{const n=NPC_BY_ID[id],t=TOWN_BY_ID[n?.townId]??TOWN_BY_ID.oakmere;
  return {x:t.world.x+(n?.worldOffset.x??0),y:t.world.y+(n?.worldOffset.y??0)-35,zoom:1.15,duration:3400,line,focusNpcId:n?.id};};
const at=(x:number,y:number,line:string):StoryShot=>({x,y,zoom:.95,duration:3400,line});
const name=(id:string)=>NPC_BY_ID[id]?.name??'The household';
export const CINEMATICS:Record<string,StoryScene>={};
const add=(id:string,title:string,shots:StoryShot[])=>{CINEMATICS[id]={id,title,shots};};
const oak=TOWN_BY_ID.oakmere.world,h=TOWN_BY_ID.highmere.world;
add('highmere-arrival','Highmere — A Seal Bought in Blood',[at(h.x+650,h.y+1100,'The curfew bells are already ringing when Leigneron arrives in Highmere. He still has the messenger’s letter tucked in his coat.'),npc('renna-vale','Renna lays the letter beside the household records. Several of the names have been crossed out. She’s never seen anything like it.'),npc('mairin-reed',name('mairin-reed')+' is waiting at Morrow Kitchen. Her son is missing, and the watch thinks he killed an inspector.')]);
add('charter-audience','A Witness Before the Crown',[npc('lady-adria-vale','These papers all have the same seal. Someone used the crown’s authority to steal from the very people we’re meant to protect.'),npc('renna-vale','Renna opens a map on her desk. She asks whether the warning should be made public or sent quietly with trusted riders.')]);
add('regional-charter-return','The Broken Seals',[npc('renna-vale','The marks on these fragments match. Someone broke the old seals on purpose. That’s why the creatures have become so dangerous.'),at(h.x-120,h.y,'Renna sets the recovered iron beside the letters from the villages. She has enough evidence to show the crown what happened.')]);
add('lower-meeting','The Man Beneath the Weighhouse',[npc('tovin-reed','Tovin found the inspector’s list. There are children’s names on it. He’s hiding because the same men who killed the inspector are looking for him.')]);
add('grain-resolution','A Witness Protected',[npc('mairin-reed',name('tovin-reed')+' is finally home. Mairin won’t let him out of her sight, even with guards outside.'),{...npc('renna-vale','Isabel has the testimony. Her guards are protecting Tovin while she prepares the case against the men named in it.'),variants:[{flag:'grain-public-inquiry',line:'Tovin tells the crowd what he saw. Isabel stays beside him the whole time. His mother looks frightened, but she doesn’t interrupt.'}]}]);
add('watch-briefing','A Watch Worth Trusting',[npc('captain-yselle-ward','Isabel has too few trained guards to watch the storehouse. She asks Caldus to help prepare them before the next delivery.')]);
add('guard-muster','The Storehouse Watch',[npc('captain-yselle-ward','The guards pass the warning from post to post. This time, the flour carts reach the storehouse without trouble.')]);
add('relief-briefing','No One Left Inside',[npc('renna-vale','Cecily closes the book. A family heard their dead father calling from behind the shelter wall. She asks Leigneron to find them before another voice answers.')]);
add('royal-audience','Somewhere Safe Tonight',[{...npc('lady-adria-vale','The survivors choose warm homes with guards on the street. Nobody is being sent back to the shelter.'),variants:[{flag:'relief-household-charter',line:'The palace fires are lit. A frightened mother asks whether she may keep her children beside her. Matilda brings another blanket.'}]},npc('renna-vale','Cecily stays while the youngest child finishes speaking. This time, nobody asks him to wait until morning.')]);
add('city-resolution','The Doors Stay Open',[{...npc('renna-vale','The first families reach their chosen rooms. Isabel walks with them, carrying a little girl who fell asleep on the way.'),variants:[{flag:'relief-household-charter',line:'The palace doors stay open past sunset. The last family arrives with muddy boots and no belongings. Someone brings them supper.'}]}]);
add('cibar-dry-fields','The Well That Kept Their Names',[npc('celia-brook','Celia still keeps her brother’s cup by the well. She says it doesn’t feel right to move it.')]);
add('cibar-water-restored','The Broken Clasp',[at(TOWN_BY_ID['cibar-plains'].world.x-360,TOWN_BY_ID['cibar-plains'].world.y+190,'Asha fits the damaged clasp against the well. The marks match. Celia starts crying when she sees it.'),{...npc('celia-brook','The evidence is sent to Isabel, but the families are allowed to keep their names private.'),variants:[{flag:'cibar-public-water',line:'Celia tells the town what happened to her brother. She doesn’t ask the people he saved to come forward.'}]}]);
add('cibar-harvest','He Held the Door',[npc('celia-brook','Celia tells the children their uncle died helping three people escape. It’s the first time she’s said it aloud without stopping.')]);
add('ember-warning','Time for the Furnace Crews',[npc('blackspire-forgemaster','Vexa shows the workers where the ward chain broke. A dragon roars in the distance. Everyone stops talking.')]);
add('ember-resolution','The Chains Can Be Reforged',[npc('blackspire-forgemaster','The forge is working again. Vexa helps the younger smiths make the first replacement chain.')]);
const regions=[
 ['elarion','elarion-lorekeeper','I used to play near those stones when I was little. Now the roots are turning black. We’re all worried.','That stone used to be clean. I can’t believe how badly it’s been damaged. I’ll make sure the others see this.'],
 ['starhold','starhold-quartermaster','Our porters are stranded up in the pass. The beacon went out last night. I haven’t heard from half of them.','The first wagon made it back. I stayed by the gate until I saw the last porter. I was so relieved.'],
 ['redmesa','redmesa-beastmaster','Krag put guards around the well. People have to ask them for water now. Even the children. It’s awful.','We’ve taken down the barriers at the well. We also found tracks from a merchant’s wagon. Someone was paying Krag.'],
 ['deepford','deepford-runesmith','Someone poisoned our spring, and now they’re blaming the forest. My cousin went to investigate. She hasn’t come back.','There’s a tool mark here. Someone did this deliberately. I’ll make a copy before the guild tries to deny it.'],
 ['tidewatch','tidewatch-harbor-master','We can see the Salt King’s ship from the southern lookout. He’s stopping our fishing boats again. People are going hungry.','I’ve seen that stamp on royal wagons. What’s it doing on a pirate ship? I want an answer.'],
 ['skallheim','skallheim-hunter','The Wyrm’s been coming down to the coast. The fishermen are too frightened to go out, and I don’t blame them.','That mark was on the old beacon too. I don’t know what it means, but I’m going to ask someone who does.'],
 ['blackspire','blackspire-forgemaster','The Seer has driven spirits toward the furnaces. Some of my workers are still out there. Please, we have to get them out.','I recognize those hammer marks. That iron came from our wards. I’m afraid someone here helped steal it.'],
];
for(const [town,id,warning,resolution] of regions)for(const [suffix,line] of [['warning',warning],['resolution',resolution]])add('regional-'+town+'-'+suffix,TOWN_BY_ID[town].name+' · '+(suffix==='warning'?'What Is at Stake':'Evidence Recovered'),[npc(id,line)]);

add('roadborn-opening','A Road Before a Sword',[
 {...at(oak.x,oak.y,'When Leigneron was small, he waited at the inn for his parents to come home. He refused to eat until they arrived.'),
   duration:7400,illustration:{page:'prologue-waiting',panel:0}},
 {...at(oak.x,oak.y,'He heard a wagon outside and ran to the door. He thought it might be them.'),
   duration:7000,illustration:{page:'prologue-waiting',panel:1}},
 {...at(oak.x,oak.y,'It wasn’t his parents. They never came back. For a long time, he ran to the door whenever he heard wheels.'),
   duration:7400,illustration:{page:'prologue-waiting',panel:2}},
 npc('aldren-vale','When his parents failed to return from their relief journey, '+name('aldren-vale')+' raised him. He taught the boy to read roads, mend harnesses and notice who had been left behind.'),
 at(oak.x+380,oak.y+100,'He grew up in Oakmere with his father’s sword and his mother’s compass. He still wanted to know what happened to them.'),
 npc('mira-fen','A wounded messenger died after Lena helped him. Now Lena is missing, and her children are waiting for her at the inn.'),
]);
add('road-cleared','A Seal, Not an Answer',[
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'After the fight, Leigneron finds a crate with a royal seal. He can’t understand why the crown’s property would be here.'),
]);
add('road-resolution','The Road Opens',[
 npc('aldren-vale','Lena’s children run downstairs as soon as they hear her. The guards outside are relieved too. For once, the inn is full of happy voices.'),
 npc('orin-bell','Orin recognizes the mark on Leigneron’s compass. She says she’s seen it in a book kept at Highmere’s archive.'),
]);
const aftermathBosses:Array<[string,string]>=[['moonlit-warden','moonlit-warden'],['stonejaw-troll','stonejaw'],
 ['iron-tusk','iron-tusk'],['rootfather','rootfather'],['salt-king','salt-king'],['frost-wyrm','frost-wyrm']];
const regionalAftermath:Record<string,{title:string;line:string}>={
 'moonlit-warden':{title:'After the Silence',line:'The Warden stops moving. Leigneron finds a cut mark beneath the roots. Someone removed an old piece of iron from the grove.'},
 stonejaw:{title:'The Pass at Dawn',line:'The pass is open again. The porters come down from the mountain one at a time. Their families are waiting at the gate.'},
 'iron-tusk':{title:'The Well Without a Banner',line:'Krag’s men have gone. People from both clans line up at the well. An older woman offers a cup of water to a child she doesn’t know.'},
 rootfather:{title:'Water Beneath the Roots',line:'The Rootfather falls back into the roots. The water is still polluted. Bruni shows the miners where the damaged channel needs repairing.'},
 'salt-king':{title:'Names in the Cargo Hold',line:'The ship’s guards have fled. Leigneron finds stolen crates from several villages. A deckhand admits the crew knew where the cargo came from.'},
 'frost-wyrm':{title:'The Shore Lantern',line:'The Wyrm moves back toward the cliffs. The hunters light the beacon, and a boat answers with its own lantern.'},
};
for(const [bossId,objectiveId] of aftermathBosses){
 const p=CONTENT_BY_ID['boss:'+bossId].world;
 const aftermath=regionalAftermath[objectiveId];
 add('campaign-'+objectiveId+'-after',aftermath.title,[at(p.x,p.y,aftermath.line)]);
}
add('inheritance-revealed','An Inheritance, Not a Destiny',[
 npc('aldren-vale','Edmund has read what happened at the river. He sits beside Leigneron for a long time. Neither knows what to say.'),
 {...npc('mira-fen','You went looking for your parents. And you helped a lot of people along the way. I think they’d be proud of you.'),variants:[
   {flag:'leigneron-protector',line:'Remember how worried you were about Lena’s children? You helped bring them home. You’ve done a lot of good since then.'},
   {flag:'leigneron-seeker',line:'You found out what your parents did. I know it hurts. I’m glad you didn’t have to face it all alone.'},
 ]},
]);
add('roadborn-epilogue','A Place at the Table',[
 npc('sena-marrow','Sena sets a bowl on the table when Leigneron walks into the inn. Lena’s children are playing nearby. They seem happy again.'),
 npc('aldren-vale','Edmund sits down beside Leigneron. They talk about his parents for a while. Some of the stories make them laugh; others don’t.'),
 npc('mira-fen','Alice catches him looking toward the road again. She laughs. “You’re leaving already?” He smiles. “Not yet.”'),
 {...npc('renna-vale','Families are still arriving from the search. Last week a mother found her grown daughter. She barely recognized her.'),variants:[{flag:'relief-household-charter',line:'Some of the families have gone home. The others can stay in the shelter as long as they need to.'}]},
 {...npc('redmesa-beastmaster','The clans have been taking turns at the well. I still hear arguments, but nobody’s drawing a weapon over water.'),variants:[{flag:'rindass-clan-water',line:'We wrote the watering turns on a board by the well. People can check it for themselves now.'}]},
 {...npc('blackspire-forgemaster','The other regions have copies of the forge records. I don’t want the truth disappearing again.'),variants:[{flag:'darkav-open-account',line:'I’ve told the workers exactly what happened. Some of them are angry with me. I understand.'}]},
 npc('aldren-vale','Edmund smiles when Leigneron looks toward the road. “You’ll be leaving again, won’t you?” He nods. “Then come home safe.”'),
]);
for(const event of STORY_ENCOUNTERS){
  const focus=event.interiorNpcId??event.npcId;
  const point=event.contentId?CONTENT_BY_ID[event.contentId]?.world:TOWN_BY_ID[event.townId].world;
  add('encounter-'+event.id,event.name,[focus?npc(focus,event.warning):at(point!.x,point!.y,event.warning)]);
}
// Full turning-point sequences use the existing director's concealed camera
// cuts, streaming, interior restoration and skippable fades. No new renderer
// or eagerly decoded illustration set is introduced for these story changes.
const place=(id:string,line:string):StoryShot=>{
  const p=CONTENT_BY_ID[id].world;return at(p.x,p.y,line);
};
add('road-briefing','The Bell Beneath the Orchard',[
 npc('aldren-vale','Edmund stops halfway through calling Leigneron over. A low note hangs beneath the ordinary sounds of Oakmere. “That isn’t our bell.”'),
 npc('mira-fen','Alice has mud on her boots and no patience for the strange sound. “Lena’s missing. We can be puzzled after we find her.”'),
 npc('sena-marrow','At Marrow Inn, Hawise turns a bowl so the children cannot see the empty place beside it. Leigneron knows that small kindness too well.'),
]);
add('roads-silent-alarm','A Warning for the Living',[
 npc('orin-bell','Etheldreda wraps the bell-rope around its peg. “Runners, until the iron is covered. We’re not calling those things any closer.”'),
 npc('elara-voss','Joan sends two guards toward the farms. “Check every cottage. Tell them to come to the inn if they hear anything.”'),
]);
add('roads-messenger-known','His Name Was Giles',[
 npc('renna-vale','Cecily sets the blood-marked letter flat. “Giles. He used to complain that no one ever remembered the rider’s name.”'),
 npc('renna-vale','“I told him about your compass. Edmund wrote to me last winter. I said you might be able to help him find the broken stone.”'),
 npc('renna-vale','Leigneron touches the crease the rider tried to keep dry. “Then remember that he got the warning through.” Cecily nods. “I will.”'),
]);
add('varr-before','What He Chose to Wake',[
 place('boss:captain-varr','Above the opened stones, Varr waits among the stolen tools. He has heard the bell beneath the road. He ordered his men to keep digging.'),
 place('boss:captain-varr','“They paid you to frighten a village?” Leigneron asks. Varr looks toward the quiet road. “They paid me not to ask what was under it.”'),
 place('boss:captain-varr','“And after you heard it?” Varr draws Rededge. “After that, boy, I was already paid.” Leigneron lifts his sword. “That was when you still had a choice.”'),
]);
add('roads-borrowed-song','A Voice Is Not a Return',[
 npc('elarion-lorekeeper','Ilyra closes the window before the familiar song can reach the room. “My brother never sang that verse properly.”'),
 npc('elarion-lorekeeper','“For a moment, I thought he’d come back.” Leigneron looks down at the compass. “I know.” She leaves her hand on the closed window.'),
 place('discovery:greenward-ruin','The song carries between the trees. Beyond the torn roots, the Warden moves back and forth across the path.'),
]);
add('warden-before','The Guardian at the Wound',[
 place('boss:moonlit-warden','The Warden stands over the torn root. Every step away lets the black growth spread; every return draws it back around the guardian’s feet.'),
 place('boss:moonlit-warden','Leigneron sees the dry path left open behind it. The pilgrims used that path. Even now, the Warden has not forgotten what it once protected.'),
 place('boss:moonlit-warden','“They’re here to help the trees,” Leigneron says. “Please, let them through.” The pale figure turns toward him. A sharp cry rises from the roots.'),
]);
add('roads-pass-awaits','Not the Last Wagon',[
 npc('starhold-quartermaster','The quartermaster counts porters and insists that the donkey stand still. A driver takes his coat out of its mouth. “Count him last. He’s not going anywhere.”'),
 npc('starhold-templar','Halla watches the pass instead of joining the laughter. “They’re safe. The next lot aren’t. Stonejaw still holds the road.”'),
 place('discovery:pass-beacon','A stone falls beside the signal fire. Farther down the road, another wagon waits. Its driver pulls the frightened horses back from the slope.'),
]);
add('stonejaw-before','The Mountain Has Moved',[
 place('boss:stonejaw-troll','Stonejaw drags one hand across the pass. Loose rock slides from a ridge that has not stopped shaking since its ward was broken.'),
 place('boss:stonejaw-troll','Behind him, fallen rock has crushed the mouth of his den. He turns at the sound of the wagons below.'),
 place('boss:stonejaw-troll','Behind Leigneron, a porter raises the last refuge light. There must be a way through for the people as well. The troll sees the flame, lowers his club and charges.'),
]);
add('roads-common-road','No Colours at the Refuge',[
 npc('redmesa-beastmaster','A plain flag rises above the shelter. Ugra watches two families pass beneath it without first asking whose banner should go higher.'),
 npc('redmesa-beastmaster','“Krag said this would make us weak.” She offers Leigneron a cup. “Funny. First time today I haven’t felt afraid of my own neighbours.”'),
 npc('redmesa-forgewright','At the forge, Dorga turns a stolen tool over in her hand. “I sold these to a crew heading for Deepford. I’ll ask who hired them.”'),
]);
add('krag-before','The Chief Who Needed Fear',[
 place('boss:iron-tusk','Krag looks past Leigneron toward the plain distress flag. Families from rival clans are waiting together beneath it.'),
 place('boss:iron-tusk','“You brought strangers into our quarrel.” Leigneron shakes his head. “You put their children on that road. They were already in it.”'),
 place('boss:iron-tusk','Krag slams his axe against the ground. “They need a chief strong enough to make them obey.” Leigneron draws. “You’ve made them afraid to fetch water. Is that what you call strength?”'),
]);
add('family-relief-account','The Last Crossing',[
 npc('bruni-stonevein','Bruni recognises the spoon tied into the rescue rope. “Your father’s idea. Said little hands shouldn’t need a sailor’s grip.”'),
 npc('deepford-boatwright','The last families reached dry ground. Leigneron’s parents went back across the bridge once more. The boards gave way before they could return.'),
 place('roads-clue:last-crossing','Leigneron reads the last line twice. He starts to ask Bruni something, then stops. His hand closes around the worn rope.'),
]);
add('roads-river-breathing','Enough Truth for One Moment',[
 npc('bruni-stonevein','“You can sit,” Bruni says. Leigneron lowers himself onto the dry stone. He keeps looking from the letter to the far bank.'),
 npc('bruni-stonevein','“They could have left?” he asks. Bruni nods. “Aye.” After a while he says, “But they didn’t.” There is nothing she can add that would make it easier.'),
 npc('bruni-stonevein','Bruni stays beside him. After a while, he folds the letter and puts it inside his coat. “Thank you for keeping it.” She nods. Neither gets up yet.'),
]);
add('rootfather-before','Room to Mend the Spring',[
 place('boss:rootfather','The Rootfather rises where black water enters the roots. Splintered mine timbers hang in its branches; the spring still runs dark beneath it.'),
 place('boss:rootfather','Behind the guardian, workers wait with shovels and braces for the broken channel. Mara points to the crack. “There. That’s where we start.”'),
 place('boss:rootfather','Leigneron lays the flood letter safely inside his coat. He could not bring his parents home. He can keep this road open for the people waiting behind him.'),
]);
add('roads-white-sail','A Light That Means Help',[
 npc('tidewatch-sailmaker','Orren hoists the white cloth and watches a boat answer it. “That one knows the rocks. That one will bring them in.”'),
 npc('tidewatch-harbor-master','Jessa gives her crews a final warning: no one jumps toward a captive ship looking for glory. They wait where frightened people can reach them.'),
 place('roads-clue:shore-chain','Small marks are scratched into the posts along the shore. Beside the last one, a captive has tied a strip of white cloth where a rescue boat can see it.'),
]);
add('salt-before','A Captain Is Not the Sea',[
 place('boss:salt-king','The Salt King waits above the opened hold. Beyond his ship, the white rescue sail is visible from the rocks.'),
 place('boss:salt-king','“The crown stole the iron. I merely carried it.” Leigneron glances at the captives’ escape marks. “You carried people too.”'),
 place('boss:salt-king','The captain smiles without looking toward the boats. “My sea. My price.” Leigneron steps onto the cleared deck. “Those people aren’t yours. Step aside.”'),
]);
add('roads-cold-to-ash','The Mark Beneath the Ice',[
 npc('skallheim-trader','Eyvind holds the dark shard with cloth around his fingers. A little sun is stamped beneath the frozen ward mark. “Blackspire. Vexa will know.”'),
 npc('skallheim-hunter','Runa watches the boats answer their true lantern. “Drive the Wyrm back. Don’t chase it. We want a coast people can live on, not a fine story about how someone died.”'),
 place('discovery:ice-bay-outlook','Eyvind wraps the shard again. “Show Vexa this mark. And tell her we found it in a wounded Wyrm, not in a trader’s chest.”'),
]);
add('wyrm-before','The Wound That Came Downhill',[
 place('boss:frost-wyrm','The Wyrm follows the broken boundary through the frost. Black iron catches beneath a split scale. Each breath leaves a white plume over the shore.'),
 place('boss:frost-wyrm','Runa’s hunters remain behind the marked shelter line. The lantern stays lit. Nobody is trying to take the hollow or its broken shells.'),
 place('boss:frost-wyrm','Leigneron moves between the creature and the fishing huts. Understanding its pain is not enough. He must survive its anger long enough for the boats to reach their people.'),
]);
add('seer-before','What Answered the Lamps',[
 place('boss:ashen-seer','The Seer raises a hand above the furnace. Voices rise with it: promises, familiar names, the words grieving people have waited years to hear.'),
 place('boss:ashen-seer','“You came looking for your parents,” she says. “Listen. I could give you one more moment.” Leigneron keeps the letter inside his coat. “You don’t know what they would say.”'),
 place('boss:ashen-seer','“The old keepers buried this power.” Her voice hardens. “I can make it answer.” Leigneron draws. “You locked people in there. Don’t call that helping them.”'),
 place('boss:ashen-seer','A roar rolls down from Varkhul’s ridge. The furnace flares, and the Seer turns toward it too quickly. The mountain has never belonged to her.'),
]);
add('campaign-ashen-seer-after','The Voices Fall Silent',[
 place('boss:ashen-seer','The cold flames lose their voices. For a breath, Leigneron hears only the ordinary furnace wind. It is enough.'),
 npc('blackspire-forgemaster','Vexa looks toward the dragon’s ridge. “We stopped what she was doing. We still have to mend what she broke.”'),
]);
add('walter-arrest','The Choice He Kept Making',[
 npc('sevrin-hale','Walter stops beside Isabel’s guards. “I thought I could fix it before anyone understood what I’d done.”'),
 npc('sevrin-hale','Leigneron holds up the torn warning. “Giles tried to tell you. Oswin tried. How many times did you choose not to hear them?” Walter has no answer.'),
 npc('captain-yselle-ward','Isabel takes him away without a victory speech. Cecily goes back to the witnesses. The living still need rooms, food and someone who will listen.'),
]);
add('roads-many-hands','Many Hands, One Binding',[
 npc('blackspire-forgemaster','Vexa turns the new binding so the eight marks catch the forge light. No mark is higher than another.'),
 npc('blackspire-forgemaster','“I thought I needed better iron,” she says. “Turns out I needed people willing to tell me when I was wrong.” Leigneron smiles. “You found plenty.”'),
 npc('blackspire-warder','Dain waits outside with the workers. He checks the path markings one last time. “Stay behind me until I signal. Nobody carries a link alone.”'),
]);
add('varkhul-before','The Returning Ember',[
 npc('blackspire-warder','Dain counts the workers twice. Every person has shelter, a task and a marked way back. “Yours is marked too,” he tells Leigneron.'),
 place('boss:varkhul','Varkhul lands on the basalt shelf. His wings scatter ash across the broken chains. Leigneron raises an arm against the heat.'),
 place('boss:varkhul','A worker drops a chain link behind him. Leigneron remembers the child at the orchard and the porters huddled beside their wagons. He looks back until Dain signals that everyone is under cover.'),
 place('boss:varkhul','“When he lifts off, let him go,” Vexa said. Leigneron draws his sword. Below the ridge, the crews wait. “All right, then. Let’s give them their road.”'),
]);
add('ember-retreat','The Opening They Needed',[
 place('boss:varkhul','Varkhul lifts into the smoke with a furious roar. Leigneron does not follow. Beyond the ridge, the dragon is already finding another place to land.'),
 npc('blackspire-warder','“Now! Stay together!” Dain calls the crews out of shelter. Two smiths lift the first link while he waves the others toward the ward.'),
]);
add('wards-rewoven','The Roads Answer Together',[
 place('clue:varkhul-ward','The binding settles against Cinderwatch. Eight marks catch the heat, then hold it. The compass needle stops fighting Leigneron’s hand.'),
 {...place('clue:varkhul-ward','Far from the furnace, a grove falls quiet, a mountain beacon burns steadily and a shore lantern answers a waiting boat. The wards protect the places around them again.'),illustration:{page:'wards-rewoven',panel:1}},
 {...place('clue:varkhul-ward','Vexa checks the new links. Dain counts the workers once more, then leads them down toward home.'),illustration:{page:'wards-rewoven',panel:0},variants:[
   {flag:'covenant-local-keepers',line:'The village keepers have agreed to check their stones and send for help if anything changes. Tonight, the roads are quiet.'},
   {flag:'covenant-shared-watch',line:'The new watch will set out together in the morning. Tonight, the people who mended the wards are going home.'},
 ]},
]);
for(const q of WORLD_STORY_QUESTS){
  const end=q.objectives.at(-1)!,scene='world-after-'+q.id;
  // These are the resident's own words, not the journal's quest-resolution
  // summary. Keep their aftermath at the resident who actually says it.
  const lines=end.dialogue??[];
  add(scene,q.name,lines.map(line=>npc(end.targetId,line)));
}
// Art decorates the existing story beats; it never queues events, bypasses a
// battle, changes a choice, or marks quest objectives complete. In particular,
// aftermath panels remain on aftermath scenes rather than pre-battle reveals.
const illustrate=(id:string,page:StoryPanelRef['page'],panels:Array<StoryPanelRef['panel']>)=>{
  CINEMATICS[id].shots.forEach((shot,index)=>{
    const panel=panels[index];
    if(panel!==undefined){shot.illustration={page,panel};shot.duration=Math.max(shot.duration,6000);}
  });
};
illustrate('varr-before','varr-survey',[0,1]);
illustrate('road-cleared','varr-survey',[2]);
illustrate('highmere-arrival','highmere-arrival',[0,1,2]);
illustrate('lower-meeting','witness-protected',[0]);
illustrate('grain-resolution','witness-protected',[1,2]);
illustrate('charter-audience','crown-audience',[0,1]);
illustrate('royal-audience','crown-audience',[2]);
const regionalPages:Array<[string,string,string,StoryPanelRef['page']]>=[
  ['elarion','warden-before','campaign-moonlit-warden-after','mourning-grove'],
  ['starhold','stonejaw-before','campaign-stonejaw-after','last-beacon'],
  ['redmesa','krag-before','campaign-iron-tusk-after','broken-clan'],
  ['deepford','rootfather-before','campaign-rootfather-after','wounded-root'],
  ['tidewatch','salt-before','campaign-salt-king-after','stolen-sea'],
  ['skallheim','wyrm-before','campaign-frost-wyrm-after','frozen-light'],
  ['blackspire','seer-before','campaign-ashen-seer-after','ashen-truth'],
];
for(const [town,before,after,page] of regionalPages){
  illustrate('regional-'+town+'-warning',page,[0]);
  illustrate(before,page,[1]);
  illustrate(after,page,[2]);
}
illustrate('family-relief-account','river-account',[0,1,2]);
illustrate('encounter-archive-fire','crown-betrayal',[0]);
illustrate('walter-arrest','crown-betrayal',[1,2]);
illustrate('varkhul-before','returning-ember',[0,1]);
illustrate('ember-retreat','returning-ember',[2]);
illustrate('wards-rewoven','wards-rewoven',[0,1]);
illustrate('roadborn-epilogue','place-at-table',[0,1,2]);
// The well’s future belongs to the already-selected clan agreement, not to a
// new ruler; the art is intentionally neutral to either water-sharing choice.
for(const shot of CINEMATICS['roadborn-epilogue'].shots)if(shot.focusNpcId==='redmesa-beastmaster'){
  shot.illustration={page:'wards-rewoven',panel:2};shot.duration=Math.max(shot.duration,6000);
}
for(const id of Object.keys(CINEMATICS))CINEMATICS[id]=rewriteNpcMentions(CINEMATICS[id],NPC_NAME_ALIASES);
