import { NPC_BY_ID } from '../../data/npcs';
import type { QuestRuntimeState } from '../types';
import {nextObjective} from './storyProgress';

/** Event-driven reactions; no additional resident simulation or portrait assets. */
export function reactiveStoryDialogue(id:string,quests:Record<string,QuestRuntimeState>,flags:Record<string,boolean>):string[]|undefined {
  const npc=NPC_BY_ID[id];if(!npc)return;
  const after=(line:string)=>[line,...npc.dialogue];
  if(quests['first-road']?.status==='active'&&id==='aldren-vale'){
    const current=nextObjective('first-road',quests);
    return ['A roadwarden counts the people who need help before the enemies who need fighting. Your questions matter; do not let them make you careless with someone else’s life.',
      current?current.text:'Come home when the work is done.'];
  }
  if(flags['campaign-complete']){
    const home:Record<string,string>={
      'aldren-vale':'You kept the roads without becoming their master. Whatever you choose next, you need not earn your place here again.',
      'mira-fen':'You promised to tell me what lay past the horizon. Sit down. This time I want the whole story, not only the part with a sword.',
      'sena-marrow':'The hearth is lit. Adventures are welcome; so are people who have had enough of one for the evening.',
      'orin-bell':'The needle is quiet because someone is listening to the stones again. Quiet is not the same thing as the end of your road.',
      'renna-vale':flags['covenant-local-keepers']?'The keepers’ accounts have begun arriving. Each bears a local name beside the crown seal.':'The shared watch reports to the regional witnesses. A road belongs to those who must live with its failures.',
    };
    if(home[id])return after(home[id]);
    return after('The wards have keepers again. There will still be storms and hungry creatures, but the roads are no longer left to answer for themselves.');
  }
  if(id==='lena-cartwright'&&(quests['first-road']?.objectiveProgress['lena-safe']??0)>=1)
    return ['My children know you came back for me. They have stopped asking whether every traveler carries bad news.','The recovered seed will go to the growers, not another captain’s store. Thank you for staying until the road was clear.'];
  if(id==='bruni-stonevein'&&(quests['eight-regions']?.objectiveProgress['bruni-rescued']??0)>=1)
    return [flags['relocated:npc:bruni-stonevein']?'My survey is in the archive. This time the guild cannot call a broken spring a miner’s superstition.':'Keep my survey with your records. This time the guild must hear what happened to the spring.',
      'The crews must inspect the water before anyone descends. I will keep the names beside the records, not only the guild’s seal.'];
  const chapter=flags['region-resolved:'+npc.townId];
  if(chapter){
    const reactions:Record<string,string>={
      elarion:flags['narenthil-grove-keepers']?'The lorekeepers tend the stones, and their warnings are open to travelers.':'Bowyers and roadwardens now share the grove watch. Neither can close the paths without answering to the other.',
      redmesa:flags['rindass-clan-water']?'Every clan can read its watering turn. Krag no longer decides whose children drink.':'The well tally is witnessed by clans and carters. A seal cannot buy the water again.',
      tidewatch:flags['portquill-public-cargo']?'The recovered freight account is posted at every quay. The hungry households receive their sacks first.':'The Harbor Guild has bound itself to deliver the recovered cargo under witness.',
      blackspire:flags['darkav-open-account']?'The forge account names the mistakes as well as the guilty. The crews have a right to know.':'The regional archives hold matching forge accounts. No single official can bury them.',
      starhold:'The beacon watch guides the winter convoys. Victory made the passage possible; keeping it takes work every night.',
      deepford:'The spring is inspected before another crew descends. The guild is learning that a living root is not an inconvenient piece of timber.',
      skallheim:'The shore lantern burns again. The children can watch for their families’ boats instead of counting the last provisions.',
    };
    if(reactions[npc.townId])return after(reactions[npc.townId]);
  }
  if(npc.townId==='oakmere'&&flags['oakmere-road-open'])return ['The seed wagons are moving again. The eastern watch stays awake so the growers can sleep.',
    id==='aldren-vale'?'Take the evidence where it leads. Trust the people who can show you their work, not only those who carry a seal.':'The inn hears news from every road. There is still a place here when you need to rest.'];
}
