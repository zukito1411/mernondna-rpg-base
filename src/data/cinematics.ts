import {TOWN_BY_ID} from './towns';
import {NPC_BY_ID} from './npcs';
import {BOSSES} from './enemies';
import {DRAGON_LAIR} from './dragonLair';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string;focusNpcId?:string;variants?:Array<{flag:string;line:string}>}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const npc=(id:string,line:string):StoryShot=>{const n=NPC_BY_ID[id],t=TOWN_BY_ID[n.townId];return {x:t.world.x+n.worldOffset.x,y:t.world.y+n.worldOffset.y-35,zoom:1.15,duration:3400,line,focusNpcId:id};};
const at=(x:number,y:number,line:string):StoryShot=>({x,y,zoom:.95,duration:3400,line});
const name=(id:string)=>NPC_BY_ID[id].name;
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
add('ember-retreat','Wings Above the Ridge',[at(DRAGON_LAIR.x,DRAGON_LAIR.y,'Varkhul takes flight. The ward crews have a thirty-minute respite. Report to the warder before challenging the lair again.')]);
add('ember-resolution','The Chains Can Be Reforged',[npc('blackspire-forgemaster','The furnace crews reached shelter. Your victory bought time to repair the chains, even though Varkhul will return.')]);
const regions=[
 ['elarion','elarion-lorekeeper','The ward stones protected the living roots. Find the poisoned stone before facing its guardian.','The forest fragment reveals how the roots were poisoned. The shrine is attuned in thanks.'],
 ['starhold','starhold-quartermaster','The pass carries winter supplies. Find the beacon and learn what drove Stonejaw onto the road.','With the pass open, supplies can move again. The beacon fragment joins the evidence for Renna.'],
 ['redmesa','redmesa-beastmaster','The clans need their wells. Read the marks at the muster before confronting the chieftain who seized them.','The wells are free. Tracks at the old road connect their seizure to the broken seals.'],
 ['deepford','deepford-runesmith','The roots have closed a working route. Inspect the watch stone before entering the deep wood.','The rune belonged to a seal beneath the forest. Bring its pattern to Renna with the other fragments.'],
 ['tidewatch','tidewatch-harbor-master','The coast keeps the island fed. Inspect the outlook and find the mark carried into the Salt King’s cave.','The recovered mark links the cave to the crown road. The shrine remembers your help.'],
 ['skallheim','skallheim-hunter','The wyrm’s descent threatens the fishing households. Read the old beacon before approaching the cliffs.','The shard beneath its scales is another broken seal. The shrine is attuned in thanks.'],
 ['blackspire','blackspire-forgemaster','The vents threaten the furnace road. Inspect the watch stones before facing the Seer; the dragon’s ward is a separate danger.','The forge fragment proves the seal was opened before you arrived. Bring this evidence back to Renna.'],
];
for(const [town,id,warning,resolution] of regions)for(const [suffix,line] of [['warning',warning],['resolution',resolution]])add('regional-'+town+'-'+suffix,TOWN_BY_ID[town].name+' · '+(suffix==='warning'?'What Is at Stake':'Evidence Recovered'),[npc(id,line)]);
