import {TOWN_BY_ID} from './towns';
import {NPC_BY_ID} from './npcs';
import {BOSSES} from './enemies';
import {DRAGON_LAIR} from './dragonLair';
import {CONTENT_BY_ID} from './content';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string;focusNpcId?:string;variants?:Array<{flag:string;line:string}>}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const npc=(id:string,line:string):StoryShot=>{const n=NPC_BY_ID[id],t=TOWN_BY_ID[n?.townId]??TOWN_BY_ID.oakmere;
  return {x:t.world.x+(n?.worldOffset.x??0),y:t.world.y+(n?.worldOffset.y??0)-35,zoom:1.15,duration:3400,line,focusNpcId:n?.id};};
const at=(x:number,y:number,line:string):StoryShot=>({x,y,zoom:.95,duration:3400,line});
const name=(id:string)=>NPC_BY_ID[id]?.name??'The household';
export const CINEMATICS:Record<string,StoryScene>={};
const add=(id:string,title:string,shots:StoryShot[])=>{CINEMATICS[id]={id,title,shots};};
const oak=TOWN_BY_ID.oakmere.world,h=TOWN_BY_ID.highmere.world,varr=BOSSES.find(b=>b.id==='captain-varr')!;
add('road-briefing','Seed for the Spring',[npc('aldren-vale',name('aldren-vale')+' needs the seed carts to reach Oakmere. A lost harvest would hurt every household.'),at(oak.x+800,oak.y,'The eastern road leads to Varr’s ruined watchtower. Break the blockade, then return with the stolen royal seal.')]);
add('road-cleared','The Blockade Breaks',[at(varr.world.x,varr.world.y,'Varr is defeated. His supplies carry a royal seal: the theft reaches beyond this tower.')]);
add('road-resolution','The Road Opens',[npc('aldren-vale',name('aldren-vale')+' takes responsibility for the eastern watch. Bandit patrols no longer gather along Oakmere’s grain road.'),at(oak.x+600,oak.y,'The seal is evidence, not an answer. Take the testimony to Renna in Highmere.')]);
add('highmere-arrival','Highmere — Crown of Trandum',[at(h.x+650,h.y+1100,'The Crown River brings cargo into Highmere. Its quay also carries passengers to the islands.'),npc('renna-vale','Renna records the grain office’s petitions. The missing flour and stolen royal seal need an explanation.'),npc('mairin-reed',name('mairin-reed')+' waits for news of '+name('tovin-reed')+'. Ask her what happened before following the flour carts.')]);
add('charter-audience','A Witness Before the Crown',[npc('lady-adria-vale','The seal, waybill and witness testimony agree. The theft used the crown’s authority against its own people.'),npc('renna-vale','Renna prepares a warning for the far lands. Decide how it should travel before you follow the strange marks.')]);
add('regional-charter-return','The Broken Seals',[npc('renna-vale','The recovered fragments fit one pattern. The old seals were broken deliberately; the creatures rose where their protection failed.'),at(h.x-120,h.y,'The communities’ evidence gives the crown a way to repair the seals. Carry the final report home to Oakmere.')]);
add('lower-meeting','A Forged Tally',[npc('tovin-reed','The hidden tally contradicts the official account. Its witness still needs an escort to the kitchen; the rescue is not over.')]);
add('grain-resolution','A Witness Protected',[npc('mairin-reed',name('tovin-reed')+' reached the kitchen safely. His testimony identifies the stolen grain.'),{...npc('renna-vale','The watch will protect the witness and secure the stolen grain for the kitchens.'),variants:[{flag:'grain-public-inquiry',line:'The recovered tally will be read publicly, where the wards can inspect the account and question its keeper.'}]}]);
add('watch-briefing','A Watch Worth Trusting',[npc('captain-yselle-ward','The captain needs disciplined guards at the stores. Practise in the yard, decode the signals, then keep the watch.')]);
add('guard-muster','The Storehouse Watch',[npc('captain-yselle-ward','Your training and the restored signals give the storehouse a reliable guard. The flour route will no longer be left unprotected.')]);
add('relief-briefing','Whose Grain?',[npc('renna-vale','A petition needs more than a rumor. Hear the merchants and workers, inspect the tally, then ask the crown to open its stores.')]);
add('royal-audience','A Charter for Relief',[{...npc('lady-adria-vale','The crown approves a joint council to distribute the grain.'),variants:[{flag:'relief-household-charter',line:'The crown approves a household charter: the public granaries must serve every ward.'}]},npc('renna-vale','The charter is recorded. Tell the households how the grain will be shared before closing the petition.')]);
add('city-resolution','An Account Kept Open',[{...npc('renna-vale','The kitchens and merchants will keep the relief tally together.'),variants:[{flag:'relief-household-charter',line:'The household charter is entered into the public tally. The wards can hold the grain office to its promise.'}]}]);
add('cibar-dry-fields','Water Before Seed',[npc('celia-brook','Cibar cannot trade away its seed for water. Recover the hidden fittings so the growers can plant again.')]);
add('cibar-water-restored','The Pump Turns',[at(TOWN_BY_ID['cibar-plains'].world.x-360,TOWN_BY_ID['cibar-plains'].world.y+190,'The fittings are installed and the pump runs. The repair preserves the seed needed for the harvest.'),{...npc('celia-brook','The growers will share the work of tending the pump.'),variants:[{flag:'cibar-public-water',line:'Watering turns will be agreed at the public well, where every family can see the schedule.'}]}]);
add('cibar-harvest','A Harvest Shared',[npc('celia-brook','The fields can be planted. Cibar will share its harvest with the households that helped it through the drought.')]);
add('ember-warning','Time for the Furnace Crews',[npc('blackspire-forgemaster','The chains are broken. Force Varkhul away long enough for the furnace crews to reach shelter; killing the dragon is not the goal.')]);
add('ember-retreat','Wings Above the Ridge',[at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul takes flight. The ward crews have a twenty-minute respite. Report to the warder before challenging the lair again.')]);
add('ember-resolution','The Chains Can Be Reforged',[npc('blackspire-forgemaster','The furnace crews reached shelter. Your victory bought time to repair the chains, even though Varkhul will return.')]);
const regions=[
 ['elarion','elarion-lorekeeper','The ward stones protected the living roots. Find the poisoned stone before facing its guardian.','The forest fragment reveals how the roots were poisoned. The shrine is attuned in thanks.'],
 ['starhold','starhold-quartermaster','The pass carries winter supplies. Find the beacon and learn what drove Stonejaw onto the road.','With the pass open, supplies can move again. The beacon fragment joins the evidence for Renna.'],
 ['redmesa','redmesa-beastmaster','The clans need their wells. Read the marks at the muster before confronting the chieftain who seized them.','The wells are free. Tracks at the old road connect their seizure to the broken seals.'],
 ['deepford','deepford-runesmith','The roots have closed a working route. Inspect the watch stone before entering the deep wood.','The rune belonged to a seal beneath the forest. Bring its pattern to Renna with the other fragments.'],
 ['tidewatch','tidewatch-harbor-master','The coast keeps the island fed. Inspect the outlook, then follow the eastern shore south and board the Salt King’s flagship by its gangplank.','The recovered cargo mark links the flagship to the crown road. The shrine remembers your help.'],
 ['skallheim','skallheim-hunter','The wyrm’s descent threatens the fishing households. Read the old beacon before approaching the cliffs.','The shard beneath its scales is another broken seal. The shrine is attuned in thanks.'],
 ['blackspire','blackspire-forgemaster','The vents threaten the furnace road. Inspect the watch stones before facing the Seer; the dragon’s ward is a separate danger.','The forge fragment proves the seal was opened before you arrived. Bring this evidence back to Renna.'],
];
for(const [town,id,warning,resolution] of regions)for(const [suffix,line] of [['warning',warning],['resolution',resolution]])add('regional-'+town+'-'+suffix,TOWN_BY_ID[town].name+' · '+(suffix==='warning'?'What Is at Stake':'Evidence Recovered'),[npc(id,line)]);

add('roadborn-opening','A Road Before a Sword',[
 at(oak.x,oak.y,'Leigneron grew up in Oakmere, where a late wagon meant a worried household long before it meant an adventure.'),
 npc('aldren-vale','When his parents failed to return from their relief journey, '+name('aldren-vale')+' raised him. He taught the boy to read roads, mend harnesses and notice who had been left behind.'),
 at(oak.x+380,oak.y+100,'Of his family, Leigneron kept a repaired sword and a compass whose needle sometimes forgot north. He wanted an answer. The village needed another pair of hands.'),
 npc('mira-fen','This morning, the seed cart has not come home. Begin with the people waiting for it, not with the name of a man to kill.'),
]);
add('road-briefing','The People Waiting',[
 npc('aldren-vale','Ask at Marrow Inn, compare the tracks with '+name('mira-fen')+', and see the smith before leaving. A seed cart is missing; learn who needs help.'),
]);
add('varr-before','A Survey Worth Stealing',[
 npc('lena-cartwright','Lena’s rescue proves the road can be reclaimed one person at a time. The tower dispatch reveals that Varr’s buyers wanted the old ward survey as well as grain.'),
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'A former caravan guard holds the ruined watchtower. His knowledge of the road was bought. Break his blockade and recover the cargo; the seal may lead to the buyer.'),
]);
add('road-cleared','A Seal, Not an Answer',[
 at(CONTENT_BY_ID['boss:captain-varr'].world.x,CONTENT_BY_ID['boss:captain-varr'].world.y,'Varr’s blockade breaks. Search the sealed cargo before returning: a defeated captain cannot explain why someone wanted your family’s survey.'),
]);
add('road-resolution','The Road Opens',[
 npc('aldren-vale','The seed road has a watch. Lena’s children will see their mother again, and the growers can save their harvest.'),
 npc('orin-bell','The recovered compass carving belongs to the old ward keepers. Carry the survey and seal to Highmere’s archive. Your family’s road is part of a larger theft.'),
]);
const approaches:Array<[string,string,string,string]>=[
 ['warden-before','moonlit-warden','moonlit-warden','The thornlings and nests are cleared from the approach. The wounded guardian is not the author of the theft: its roots remember the missing binding.'],
 ['stonejaw-before','stonejaw-troll','stonejaw','The porters reached shelter, and the beacon crew has its oil. Stonejaw still holds the pass between the winter convoy and the hearths above it.'],
 ['krag-before','iron-tusk','iron-tusk','Both occupied camps have been cleared. The clans have agreed how to keep the shared well open; Krag’s rule is the last obstacle to their promise.'],
 ['rootfather-before','rootfather','rootfather','Bruni’s survey and the repaired growers’ pump expose a wounded spring, not an evil forest. Free the working route while the guild repairs what it refused to name.'],
 ['salt-before','salt-king','salt-king','The five deck guards are defeated and the freight account is copied. The Salt King still holds the stolen bindings; confront him for the cargo, not for ownership of the sea.'],
 ['wyrm-before','frost-wyrm','frost-wyrm','The winter cache is clear and the shore lantern recovered. The injured, ground-dwelling Wyrm still threatens the boats that must return to that light.'],
 ['seer-before','ashen-seer','ashen-seer','The chainworks account links the stolen crown seal to the melted ward iron. The Seer’s promise of unbound heat has cost the crews their road and their dead their rest.'],
];
for(const [before,bossId,objectiveId,line] of approaches){
 const p=CONTENT_BY_ID['boss:'+bossId].world;
 add(before,'Before '+BOSSES.find(b=>b.id===bossId)!.name,[at(p.x,p.y,line)]);
 add('campaign-'+objectiveId+'-after','The Cost of a Broken Ward',[
   at(p.x,p.y,'The confrontation ends, but a battle cannot repair the binding. Return the recovered account to the people who helped you prepare; their watch must last after you leave.'),
 ]);
}
add('inheritance-revealed','An Inheritance, Not a Destiny',[
 npc('aldren-vale','Your mother’s relief survey was stolen to locate the ward iron. Her legacy was shelter open to strangers, not a secret claim to rule them.'),
 {...npc('mira-fen','You went looking for an answer and kept finding people who needed help. Perhaps those were never separate roads.'),variants:[
   {flag:'leigneron-protector',line:'You said you wanted Lena’s children to stop waiting in fear. That promise traveled farther than you imagined.'},
   {flag:'leigneron-seeker',line:'You found what your family’s work meant to people who remembered it. You did not have to abandon them to find an answer.'},
 ]},
]);
add('family-relief-account','The Names Beside the Crossing',[
 npc('bruni-stonevein','The copied river-guild account remembers Leigneron’s parents by the people they brought to shelter. They were lost on the final crossing, not on a search for treasure.'),
 npc('deepford-boatwright','Their survey kept the spring open for travelers they would never meet. The compass is a tool they left him; protecting others is a choice he can make for himself.'),
]);
add('varkhul-before','The Last Furnace',[
 npc('blackspire-warder','The furnace crews wait in shelter. The regional agreements and witnessed chainwork are ready; no civilian follows the challenger into the molten rim.'),
 at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul guards the basalt furnace shelf. Force him to take flight, buying the keepers time to join the cinder binding. The dragon will survive this battle.'),
]);
add('ember-retreat','Wings Above the Ridge',[
 at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul takes flight. The crews have a twenty-minute respite before his return. Report to the warder and forge, then finish the Cinderwatch binding.'),
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
 {...npc('renna-vale','Highmere’s kitchens and merchants keep the relief account together.'),variants:[{flag:'relief-household-charter',line:'Highmere’s granaries serve every household under the public charter. A hungry ward no longer has to beg in secret.'}]},
 {...npc('redmesa-beastmaster','Clan keepers and caravan witnesses share the water tally. Krag’s banner no longer decides whose children drink.'),variants:[{flag:'rindass-clan-water',line:'The clan watering turns are carved beside the well. No chief can quietly claim the spring again.'}]},
 {...npc('blackspire-forgemaster','The forge account is held by regional witnesses, beyond any one official’s reach.'),variants:[{flag:'darkav-open-account',line:'Blackspire’s public account names the smiths’ mistakes as well as the stolen seals. Its survivors are no longer asked to forget.'}]},
 npc('aldren-vale','The dragon will return. Storms will close passes. Roads will always need tending. Leigneron is free to travel again—and now knows why he would.'),
]);
