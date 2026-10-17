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
add('road-briefing','Seed for the Spring',[npc('aldren-vale',name('aldren-vale')+' needs the seed carts to reach Oakmere. A lost harvest would hurt every household.'),at(oak.x+800,oak.y,'The east road falls quiet near Varr’s old watchtower. Leigneron feels the weight of his father’s sword as he approaches the broken gate.')]);
add('road-cleared','The Blockade Breaks',[at(varr.world.x,varr.world.y,'Varr lies among the scattered sacks. A royal seal gleams beneath the spilled grain. Someone in Highmere has been buying more than stolen food.')]);
add('road-resolution','The Road Opens',[npc('aldren-vale',name('aldren-vale')+' takes responsibility for the eastern watch. Bandit patrols no longer gather along Oakmere’s grain road.'),at(oak.x+600,oak.y,'Aldren turns the seal over in his palm. It is genuine. That troubles him more than any forgery would.')]);
add('highmere-arrival','Highmere — A Seal Bought in Blood',[at(h.x+650,h.y+1100,'Beyond the quay, Highmere’s bells announce another curfew. The messenger’s letter grows heavier in Leigneron’s pocket.'),npc('renna-vale','At the Royal Archive, the blood-marked letter is compared with names struck from the household rolls.'),npc('mairin-reed',name('mairin-reed')+' waits at Morrow Kitchen. Her son is being hunted for a inspector’s murder. Hear her before trusting the warrant.')]);
add('charter-audience','A Witness Before the Crown',[npc('lady-adria-vale','The seal, waybill and witness testimony agree. The theft used the crown’s authority against its own people.'),npc('renna-vale','Renna spreads the map across her desk. Some roads can carry an open warning. Others, she says quietly, may need a trusted rider.')]);
add('regional-charter-return','The Broken Seals',[npc('renna-vale','The recovered fragments fit one pattern. The old seals were broken deliberately; the creatures rose where their protection failed.'),at(h.x-120,h.y,'The archive table is crowded with charcoal rubbings, broken iron, and letters from people who will not be silent again.')]);
add('lower-meeting','The Man Beneath the Weighhouse',[npc('tovin-reed','The dead inspector hid a list of people, not cargo. Tovin saw him refuse to surrender the children. Finding the boy is not enough; he still has to reach his mother alive.')]);
add('grain-resolution','A Witness Protected',[npc('mairin-reed',name('tovin-reed')+' is home. His mother leaves the lamp burning while the watch takes positions outside.'),{...npc('renna-vale','Yselle seals the murder testimony and moves against the named men. Tovin is protected, though the city must trust a hearing it cannot yet see.'),variants:[{flag:'grain-public-inquiry',line:'Tovin speaks beside Yselle in the square. The dead inspector is named before the city; so is the young witness whose face can no longer be hidden.'}]}]);
add('watch-briefing','A Watch Worth Trusting',[npc('captain-yselle-ward','Isabel glances toward the storehouse. Half her guards have never stood together under an alarm. She asks Caldus to see what they can do.')]);
add('guard-muster','The Storehouse Watch',[npc('captain-yselle-ward','The watch signals pass from tower to tower. At last, the flour wagons cross the bridge without an escort shouting them through.')]);
add('relief-briefing','Names That Cannot Be Sold',[npc('renna-vale','Renna opens the household ledger. Names of loved children share the page with sums owed to strangers. Her hand stops on one entry.')]);
add('royal-audience','A Household Is Not a Debt',[{...npc('lady-adria-vale','Guild money will fund guarded searches for missing relatives. The families sit beside the judges, and no employer may move them while their cases are heard.'),variants:[{flag:'relief-household-charter',line:'The forced-service warrants are void at dawn. Crown shelter opens to those leaving their masters; riders continue searching for their kin.'}]},npc('renna-vale','For the children already in loving homes, belonging will not be decided by a payment or a clerk’s line.')]);
add('city-resolution','The Search Riders Leave',[{...npc('renna-vale','The household representatives take their seats beside the judges. The first guild-funded riders carry names instead of arrest warrants.'),variants:[{flag:'relief-household-charter',line:'The shelter doors open before the ink dries. For the first time, the families decide which name to give at the threshold.'}]}]);
add('cibar-dry-fields','The Well That Kept Their Names',[npc('celia-brook','Celia has kept her brother’s cup by the well. No one has used it since the night they called his death an accident.')]);
add('cibar-water-restored','The Broken Clasp',[at(TOWN_BY_ID['cibar-plains'].world.x-360,TOWN_BY_ID['cibar-plains'].world.y+190,'The bronze clasp fits the knife-scored well housing. The struggle has left a witness that cannot be frightened into silence.'),{...npc('celia-brook','The sworn households keep the survivors’ names while the murder evidence goes to Yselle.'),variants:[{flag:'cibar-public-water',line:'Celia speaks publicly about her brother. The survivors choose for themselves whether to give their names.'}]}]);
add('cibar-harvest','He Held the Door',[npc('celia-brook','The lie about an accidental death is over. The children will be told that he held a door open until the travelers escaped.')]);
add('ember-warning','Time for the Furnace Crews',[npc('blackspire-forgemaster','Vexa lays a snapped chain across the anvil. The youngest smith flinches at the distant sound of wings. No one speaks until it passes.')]);
add('ember-retreat','Wings Above the Ridge',[at(DRAGON_LAIR.x,DRAGON_LAIR.y,'The shadow lifts from the ridge. Below, the furnace crews emerge from hiding, one by one. None dares look up for long.')]);
add('ember-resolution','The Chains Can Be Reforged',[npc('blackspire-forgemaster','For the first time since the chains broke, a forge hammer rings without being drowned out by wings. Vexa draws the next link from the coals.')]);
const regions=[
 ['elarion','elarion-lorekeeper','The grove was quiet when I was a child. Now the stones sweat black sap and our sentries will not walk there alone.','I knew that stone. It was clean once. I will write down what you found before someone tries to bury it again.'],
 ['starhold','starhold-quartermaster','Our porters are stranded above the pass. Their beacon went dark last night, and something large has been breaking the wagons.','The first supply cart came through at dawn. I kept the lamp burning until I saw every porter walk through the gate.'],
 ['redmesa','redmesa-beastmaster','The well belongs to all the clans. Krag has posted his riders around it, and the children have learned to ask permission for water.','We took the barriers down ourselves. There are tracks beyond the old road; whoever paid Krag was not one of our own.'],
 ['deepford','deepford-runesmith','Someone poisoned the spring and called it the forest’s curse. My cousin went to prove them wrong. She has not come home.','This mark was cut by a careful hand. Mine are shaking. I will copy it before I tell the guild what they have done.'],
 ['tidewatch','tidewatch-harbor-master','My fishermen can see the Salt King’s colors from the southern outlook. He has taken the channel, and every family here pays for it.','That stamp belongs to the crown road. I have seen it on wagons, never on a pirate’s deck. Someone owes us an explanation.'],
 ['skallheim','skallheim-hunter','The Wyrm came down the cliffs after the last hard snow. Now the boats have nowhere safe to follow the shore.','I found the same mark on our old beacon. If the ice keeps its secrets, perhaps this stone will not.'],
 ['blackspire','blackspire-forgemaster','The Seer has drawn the dead toward the furnaces. Beyond him, the dragon circles. I have workers out there with nowhere left to run.','This metal was taken from our own wards. I recognize the hammer marks. I wish I did not.'],
];
for(const [town,id,warning,resolution] of regions)for(const [suffix,line] of [['warning',warning],['resolution',resolution]])add('regional-'+town+'-'+suffix,TOWN_BY_ID[town].name+' · '+(suffix==='warning'?'What Is at Stake':'Evidence Recovered'),[npc(id,line)]);

add('roadborn-opening','A Road Before a Sword',[
 {...at(oak.x,oak.y,'Years ago, rain tapped against the windows of Marrow Inn. Leigneron waited beside a bowl of soup that had long since gone cold.'),
   duration:7400,illustration:{page:'prologue-waiting',panel:0}},
 {...at(oak.x,oak.y,'Then wheels rattled along the road. He was out of his chair before the wagon had stopped. Perhaps this time they had come home.'),
   duration:7000,illustration:{page:'prologue-waiting',panel:1}},
 {...at(oak.x,oak.y,'But the people at the door were strangers. His parents had not returned. Days became weeks. Still, he listened for their wagon.'),
   duration:7400,illustration:{page:'prologue-waiting',panel:2}},
 npc('aldren-vale','When his parents failed to return from their relief journey, '+name('aldren-vale')+' raised him. He taught the boy to read roads, mend harnesses and notice who had been left behind.'),
 at(oak.x+380,oak.y+100,'Of his family, Leigneron kept a repaired sword and a compass whose needle sometimes forgot north. He wanted an answer. The village needed another pair of hands.'),
 npc('mira-fen','A messenger died under Lena’s roof before dawn. Now she is missing too. Her children wait upstairs at the inn, listening for the door.'),
]);
add('road-briefing','The People Waiting',[
 npc('aldren-vale','Lena has not come home. There is a letter on the inn table and a frightened child waiting upstairs. Edmund has sent for '+name('mira-fen')+'. The tracks outside will not last another hour in this rain.'),
]);
add('varr-before','A Survey Worth Stealing',[
 npc('lena-cartwright','Lena is alive. The letter she hid beneath the sacks warns that a ward survey and household rolls were sold together. The dispatch outside Varr’s tower orders her silence.'),
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'From the road, the tower looks abandoned. Then a lookout moves behind a broken window. The stolen sacks are inside, guarded by men who know the road too well.'),
]);
add('road-cleared','A Seal, Not an Answer',[
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'The fighting is over. In the wreckage lies a crate stamped with the crown’s seal. Someone cared enough about this cargo to kill for it.'),
]);
add('road-resolution','The Road Opens',[
 npc('aldren-vale','Lena’s children run down the inn stairs when they hear her voice. Outside, a watch takes the eastern road. The messenger’s killers no longer have an unguarded way into Oakmere.'),
 npc('orin-bell','Orin knows the carving on the compass. He has seen it in an old book at Highmere. His voice falters when he sees the seal beside it.'),
]);
const approaches:Array<[string,string,string,string]>=[
 ['warden-before','moonlit-warden','moonlit-warden','The thornlings and nests are cleared from the approach. The wounded guardian is not the author of the theft: its roots remember the missing binding.'],
 ['stonejaw-before','stonejaw-troll','stonejaw','The porters reached shelter, and the beacon crew has its oil. Stonejaw still holds the pass between the winter convoy and the hearths above it.'],
 ['krag-before','iron-tusk','iron-tusk','Both occupied camps have been cleared. The clans have agreed how to keep the shared well open; Krag’s rule is the last obstacle to their promise.'],
 ['rootfather-before','rootfather','rootfather','Bruni’s survey shows how the mine waste reached the spring. The guild has promised to repair the channel while Leigneron draws the wounded guardian away.'],
 ['salt-before','salt-king','salt-king','The deck falls quiet. Below the captain’s cabin, crates of ward-iron still bear the names of inland villages that never saw their shipments arrive.'],
 ['wyrm-before','frost-wyrm','frost-wyrm','The winter cache is clear and the shore lantern recovered. The injured, ground-dwelling Wyrm still threatens the boats that must return to that light.'],
 ['seer-before','ashen-seer','ashen-seer','The chainworks account links the stolen crown seal to the melted ward iron. The Seer’s promise of unbound heat has cost the crews their road and their dead their rest.'],
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
// The well's future belongs to the already-selected clan agreement, not to a
// new ruler; the art is intentionally neutral to either water-sharing choice.
for(const shot of CINEMATICS['roadborn-epilogue'].shots)if(shot.focusNpcId==='redmesa-beastmaster'){
  shot.illustration={page:'wards-rewoven',panel:2};shot.duration=Math.max(shot.duration,6000);
}
for(const id of Object.keys(CINEMATICS))CINEMATICS[id]=rewriteNpcMentions(CINEMATICS[id],NPC_NAME_ALIASES);
