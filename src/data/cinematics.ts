import {TOWN_BY_ID} from './towns';
import {NPC_BY_ID,NPC_NAME_ALIASES} from './npcs';
import {rewriteNpcMentions} from './npcPresentation';
import {BOSSES} from './enemies';
import {DRAGON_LAIR} from './dragonLair';
import {CONTENT_BY_ID} from './content';
import {STORY_ENCOUNTERS} from './adventure';
import type {StoryPanelRef} from './storyPanelArt';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string;focusNpcId?:string;interiorId?:string;illustration?:StoryPanelRef;variants?:Array<{flag:string;line:string}>}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const npc=(id:string,line:string):StoryShot=>{const n=NPC_BY_ID[id],t=TOWN_BY_ID[n?.townId]??TOWN_BY_ID.oakmere;
  return {x:t.world.x+(n?.worldOffset.x??0),y:t.world.y+(n?.worldOffset.y??0)-35,zoom:1.15,duration:3400,line,focusNpcId:n?.id};};
const at=(x:number,y:number,line:string):StoryShot=>({x,y,zoom:.95,duration:3400,line});
const name=(id:string)=>NPC_BY_ID[id]?.name??'The household';
export const CINEMATICS:Record<string,StoryScene>={};
const add=(id:string,title:string,shots:StoryShot[])=>{CINEMATICS[id]={id,title,shots};};
const oak=TOWN_BY_ID.oakmere.world,h=TOWN_BY_ID.highmere.world,varr=BOSSES.find(b=>b.id==='captain-varr')!;
add('road-briefing','Seed for the Spring',[npc('aldren-vale',name('aldren-vale')+' is worried about the grain carts. The families here can’t afford to lose another harvest.'),at(oak.x+800,oak.y,'There are no wagons on the east road. At the tower, Leigneron sees guards carrying the missing grain inside.')]);
add('road-cleared','The Blockade Breaks',[at(varr.world.x,varr.world.y,'Varr’s men have dropped the grain sacks. One crate has a royal seal on it. Leigneron didn’t expect to find that here.')]);
add('road-resolution','The Road Opens',[npc('aldren-vale',name('aldren-vale')+' sends guards to the east road. The grain carts can get through again.'),at(oak.x+600,oak.y,'Edmund looks at the seal for a long time. Then he says he recognizes it. Someone in the capital must be involved.')]);
add('highmere-arrival','Highmere — A Seal Bought in Blood',[at(h.x+650,h.y+1100,'The curfew bells are already ringing when Leigneron arrives in Highmere. He still has the messenger’s letter tucked in his coat.'),npc('renna-vale','Renna lays the letter beside the household records. Several of the names have been crossed out. She’s never seen anything like it.'),npc('mairin-reed',name('mairin-reed')+' is waiting at Morrow Kitchen. Her son is missing, and the watch thinks he killed an inspector.')]);
add('charter-audience','A Witness Before the Crown',[npc('lady-adria-vale','These papers all have the same seal. Someone used the crown’s authority to steal from the very people we’re meant to protect.'),npc('renna-vale','Renna opens a map on her desk. She asks whether the warning should be made public or sent quietly with trusted riders.')]);
add('regional-charter-return','The Broken Seals',[npc('renna-vale','The marks on these fragments match. Someone broke the old seals on purpose. That’s why the creatures have become so dangerous.'),at(h.x-120,h.y,'Renna sets the recovered iron beside the letters from the villages. She has enough evidence to show the crown what happened.')]);
add('lower-meeting','The Man Beneath the Weighhouse',[npc('tovin-reed','Tovin found the inspector’s list. There are children’s names on it. He’s hiding because the same men who killed the inspector are looking for him.')]);
add('grain-resolution','A Witness Protected',[npc('mairin-reed',name('tovin-reed')+' is finally home. Mairin won’t let him out of her sight, even with guards outside.'),{...npc('renna-vale','Isabel has the testimony. Her guards are protecting Tovin while she prepares the case against the men named in it.'),variants:[{flag:'grain-public-inquiry',line:'Tovin tells the crowd what he saw. Isabel stays beside him the whole time. His mother looks frightened, but she doesn’t interrupt.'}]}]);
add('watch-briefing','A Watch Worth Trusting',[npc('captain-yselle-ward','Isabel has too few trained guards to watch the storehouse. She asks Caldus to help prepare them before the next delivery.')]);
add('guard-muster','The Storehouse Watch',[npc('captain-yselle-ward','The guards pass the warning from post to post. This time, the flour carts reach the storehouse without trouble.')]);
add('relief-briefing','Names That Cannot Be Sold',[npc('renna-vale','Renna opens the ledger. Some children were adopted. Others were sold under the same kind of paperwork. She has to stop reading for a moment.')]);
add('royal-audience','A Household Is Not a Debt',[{...npc('lady-adria-vale','The guilds will pay to search for the missing families. Nobody can move the children while the court hears their cases.'),variants:[{flag:'relief-household-charter',line:'The forced-service warrants have been cancelled. The palace is opening rooms for people who need somewhere safe to stay.'}]},npc('renna-vale','Renna insists that the children be asked where they want to live. Nobody objects.')]);
add('city-resolution','The Search Riders Leave',[{...npc('renna-vale','The families are allowed into the hearing. Outside, the first search riders set off with lists of missing people.'),variants:[{flag:'relief-household-charter',line:'The shelter opens that afternoon. A mother arrives with her two children. A guard asks for their names and lets them inside.'}]}]);
add('cibar-dry-fields','The Well That Kept Their Names',[npc('celia-brook','Celia still keeps her brother’s cup by the well. She says it doesn’t feel right to move it.')]);
add('cibar-water-restored','The Broken Clasp',[at(TOWN_BY_ID['cibar-plains'].world.x-360,TOWN_BY_ID['cibar-plains'].world.y+190,'Asha fits the damaged clasp against the well. The marks match. Celia starts crying when she sees it.'),{...npc('celia-brook','The evidence is sent to Isabel, but the families are allowed to keep their names private.'),variants:[{flag:'cibar-public-water',line:'Celia tells the town what happened to her brother. She doesn’t ask the people he saved to come forward.'}]}]);
add('cibar-harvest','He Held the Door',[npc('celia-brook','Celia tells the children their uncle died helping three people escape. It’s the first time she’s said it aloud without stopping.')]);
add('ember-warning','Time for the Furnace Crews',[npc('blackspire-forgemaster','Vexa shows the workers where the ward chain broke. A dragon roars in the distance. Everyone stops talking.')]);
add('ember-retreat','Wings Above the Ridge',[at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul flies away from the ridge. The workers start coming out of hiding. Some run for shelter while they still can.')]);
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
add('road-briefing','The People Waiting',[
 npc('aldren-vale','Lena’s missing. One of her children is crying upstairs. Edmund’s asked '+name('mira-fen')+'. They want to look for her before the rain washes away the tracks.'),
]);
add('varr-before','A Survey Worth Stealing',[
 npc('lena-cartwright','Lena’s safe, but she’s shaken. She hid the letter under the grain sacks. It says someone sold a copy of the old ward survey.'),
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'Varr’s tower looks empty until Leigneron sees a guard at the window. The missing sacks are piled just inside the gate.'),
]);
add('road-cleared','A Seal, Not an Answer',[
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'After the fight, Leigneron finds a crate with a royal seal. He can’t understand why the crown’s property would be here.'),
]);
add('road-resolution','The Road Opens',[
 npc('aldren-vale','Lena’s children run downstairs as soon as they hear her. The guards outside are relieved too. For once, the inn is full of happy voices.'),
 npc('orin-bell','Orin recognizes the mark on Leigneron’s compass. He says he’s seen it in a book kept at Highmere’s archive.'),
]);
const approaches:Array<[string,string,string,string]>=[
 ['warden-before','moonlit-warden','moonlit-warden','The path is clear, but the Warden is still here. The iron beneath the roots has been stolen, and the grove is suffering.'],
 ['stonejaw-before','stonejaw-troll','stonejaw','The porters are back in shelter. Stonejaw is still out in the pass, and the next convoy can’t get through.'],
 ['krag-before','iron-tusk','iron-tusk','The clans have agreed to share the well. Krag’s men are still threatening anyone who tries to use it.'],
 ['rootfather-before','rootfather','rootfather','Bruni’s survey shows where the mine waste entered the spring. The workers are ready to repair the channel when the area is safe.'],
 ['salt-before','salt-king','salt-king','The guards have stopped fighting. In the hold, Leigneron finds crates marked with the names of villages that never got their supplies.'],
 ['wyrm-before','frost-wyrm','frost-wyrm','The lantern has been found, but the Wyrm is still near the coast. The fishermen won’t risk bringing their boats in.'],
 ['seer-before','ashen-seer','ashen-seer','The chainworks book shows where the stolen iron went. Vexa recognizes several names on the list. She’s furious.'],
];
const regionalAftermath:Record<string,{title:string;line:string}>={
 'moonlit-warden':{title:'After the Silence',line:'The guardian lies still, but the grove does not grow quiet. Beneath the roots, Leigneron finds an old iron mark where the soil should be clean.'},
 stonejaw:{title:'The Pass at Dawn',line:'Stonejaw no longer blocks the road. Above the shattered wagons, the beacon catches the morning light. Someone in Starhold rings a bell for the missing porters.'},
 'iron-tusk':{title:'The Well Without a Banner',line:'Krag’s banner has fallen into the dust. At the well, an old woman fills two clay cups and offers the first to a child from the rival clan.'},
 rootfather:{title:'Water Beneath the Roots',line:'The Rootfather sinks into the tangled earth. The spring still smells of mine waste. Bruni’s survey rests beside the channel the guild has promised to mend.'},
 'salt-king':{title:'Names in the Cargo Hold',line:'The deck is empty of guards. Under a torn sail, the names of inland villages are still stamped on the stolen crates. A deckhand lowers his eyes as Leigneron reads them.'},
 'frost-wyrm':{title:'The Shore Lantern',line:'The Wyrm retreats among the ice. On the far shore, a small light appears, then another. The hunters answer from the beacon with their own lamps.'},
 'ashen-seer':{title:'Ash on the Ledger',line:'The Seer’s fire fades. Beneath the ash, the furnace book survives with every stolen load marked in the same careful hand. The families waiting outside have not forgotten those names.'},
};
for(const [before,bossId,objectiveId,line] of approaches){
 const p=CONTENT_BY_ID['boss:'+bossId].world;
 add(before,BOSSES.find(b=>b.id===bossId)!.name,[at(p.x,p.y,line)]);
 const aftermath=regionalAftermath[objectiveId];
 add('campaign-'+objectiveId+'-after',aftermath.title,[at(p.x,p.y,aftermath.line)]);
}
add('inheritance-revealed','An Inheritance, Not a Destiny',[
 npc('aldren-vale','Edmund has heard the river account. He had kept hoping there might be another road to search. Now he sits beside the young man he raised, and lets them both grieve.'),
 {...npc('mira-fen','You went looking for an answer and kept finding people who needed help. Perhaps those were never separate roads.'),variants:[
   {flag:'leigneron-protector',line:'You said you wanted Lena’s children to stop waiting in fear. That promise traveled farther than you imagined.'},
   {flag:'leigneron-seeker',line:'You found what your family’s work meant to people who remembered it. You did not have to abandon them to find an answer.'},
 ]},
]);
add('family-relief-account','The Names Beside the Crossing',[
 npc('bruni-stonevein','“Your mother brought food when our crossing flooded. Your father helped us get people out. They went back again when the rest of us could hardly stand.”'),
 npc('deepford-boatwright','The ferryman recorded the last crossing. The families reached shelter before the flooded bridge collapsed. Leigneron’s parents could have left earlier. They stayed to save strangers.'),
 at(TOWN_BY_ID.deepford.world.x,TOWN_BY_ID.deepford.world.y+340,'Leigneron folds the account beside the old compass. There is no enemy here to strike. For a while he simply listens to the river.'),
]);
add('walter-arrest','The Crown’s Betrayal',[
 npc('sevrin-hale','“I did what was necessary.” Walter waits for an answer that does not come. Then Leigneron speaks. “You kept doing it after you knew what it cost.”'),
 npc('captain-yselle-ward','Isabel takes custody of Walter’s orders. His seal will not silence the witnesses again. The regions still need their iron—and someone willing to keep the roads.'),
]);
add('varkhul-before','The Last Furnace',[
 npc('blackspire-warder','Dain counts the last furnace crew through the shelter door. The ridge shudders overhead. Nobody volunteers to go back for the tools.'),
 at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul turns on the basalt shelf. Heat rolls over the black stone as he opens his wings. Far below, Vexa’s people are waiting for the sky to clear.'),
]);
add('ember-retreat','Wings Above the Ridge',[
 at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul rises into the smoke, and the mountain seems to inhale. Along the lower road, voices call out names. The crews are still alive.'),
]);
add('wards-rewoven','A Promise Tempered in Iron',[
 at(DRAGON_LAIR.x-1150,DRAGON_LAIR.y+180,'The reforged chain joins the cinder ward. Leigneron’s compass settles—not toward a throne, but toward the roads whose keepers have agreed to answer one another.'),
 {...npc('renna-vale','Matching covenant records travel to every region. No single seal can sell away a public spring again without witnesses.'),variants:[
   {flag:'covenant-local-keepers',line:'Local keepers publish their accounts and answer to their neighbors. The crown records their promises; it does not own their roads.'},
   {flag:'covenant-shared-watch',line:'A shared road watch answers to witnesses from the regions it serves. Its duty is passage and shelter, not possession.'},
 ]},
]);
add('roadborn-epilogue','A Place at the Table',[
 npc('sena-marrow','At Marrow Inn, a warm bowl waits for someone who came home. Lena’s children no longer listen for every footstep with fear.'),
 npc('aldren-vale','Edmund rests a hand on his shoulder. For years, Leigneron thought his parents had left him behind. Now he knows they stayed so other people could get home.'),
 npc('mira-fen','Alice catches him looking out toward the road. “Not settling down, then?” He smiles. “Not yet.” “Just don’t forget where home is.”'),
 {...npc('renna-vale','The search riders still bring news. Families sit beside the judges, and some reunions begin with an argument about who has grown taller.'),variants:[{flag:'relief-household-charter',line:'The crown shelter has fewer occupied beds this week. Some families went home. Others found a new one without having to buy their freedom.'}]},
 {...npc('redmesa-beastmaster','Clan keepers and caravan witnesses share the water tally. Krag’s banner no longer decides whose children drink.'),variants:[{flag:'rindass-clan-water',line:'The clan watering turns are carved beside the well. No chief can quietly claim the spring again.'}]},
 {...npc('blackspire-forgemaster','The forge account is held by regional witnesses, beyond any one official’s reach.'),variants:[{flag:'darkav-open-account',line:'Blackspire’s public account names the smiths’ mistakes as well as the stolen seals. Its survivors are no longer asked to forget.'}]},
 npc('aldren-vale','The dragon will return. Storms will close passes. Roads will always need tending. Leigneron is free to travel again—and now knows why he would.'),
]);
for(const event of STORY_ENCOUNTERS){
  const focus=event.interiorNpcId??event.npcId;
  const point=event.contentId?CONTENT_BY_ID[event.contentId]?.world:TOWN_BY_ID[event.townId].world;
  add('encounter-'+event.id,event.name,[focus?npc(focus,event.warning):at(point!.x,point!.y,event.warning)]);
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
