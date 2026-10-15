import { NPC_BY_ID,NPC_NAME_ALIASES } from '../../data/npcs';
import {rewriteNpcMentions} from '../../data/npcPresentation';
import type { QuestRuntimeState } from '../types';
import {nextObjective} from './storyProgress';

/** Event-driven reactions; no additional resident simulation or portrait assets. */
export function reactiveStoryDialogue(id:string,quests:Record<string,QuestRuntimeState>,flags:Record<string,boolean>):string[]|undefined {
  return rewriteNpcMentions(storyReaction(id,quests,flags),NPC_NAME_ALIASES);
}
function storyReaction(id:string,quests:Record<string,QuestRuntimeState>,flags:Record<string,boolean>):string[]|undefined {
  const npc=NPC_BY_ID[id];if(!npc)return;
  const after=(line:string)=>[line,...npc.dialogue];
  if(quests['shadows-highmere']?.status==='completed'&&['tovin-reed','mairin-reed','pell-rusk'].includes(id)){
    const publicHearing=flags['grain-public-inquiry'];
    if(id==='tovin-reed')return publicHearing?['I shook so badly Yselle held the page for me. Then someone in the square said Oswin’s name, and I could read the next line.','I do not like being recognized. I am still glad I spoke.']
      :['I slept through the night. Mother made a point of not mentioning it, which is how I knew she had noticed.','Yselle has my words under seal. When I am ready, I want Oswin’s daughter to hear them from me.'];
    return after(publicHearing?'The square was full when Tovin spoke. There are guards at the kitchen, but neighbors have been taking turns there too.'
      :'The testimony is sealed. Some call it another secret. I tell them a frightened boy is not the price we pay to satisfy their curiosity.');
  }
  if(quests['water-stops']?.status==='completed'&&npc.townId==='cibar-plains')return after(flags['cibar-public-water']?
    'Celia spoke by the well. She named what her brother did, not the travelers who needed him. I think he would have approved.'
    :'The sworn households have kept the travelers’ names safe. Yselle has the murder evidence. We can remember him without putting someone else in danger.');
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
    // Ordinary residents retain their own lives and voices after the ending.
    return npc.dialogue;
  }
  if(id==='lena-cartwright'&&(quests['first-road']?.objectiveProgress['lena-safe']??0)>=1)
    return ['My children know you came back for me. They have stopped asking whether every traveler carries bad news.','I kept the shawl. There is a stain I cannot wash out, but my daughter says that means we should remember the man who needed it.'];
  if(id==='bruni-stonevein'&&(quests['eight-regions']?.objectiveProgress['bruni-rescued']??0)>=1)
    return [flags['relocated:npc:bruni-stonevein']?'My survey is in the archive. This time the guild cannot call a broken spring a miner’s superstition.':'Keep my survey with your records. This time the guild must hear what happened to the spring.',
      'The crews must inspect the water before anyone descends. I will keep the names beside the records, not only the guild’s seal.'];
  const chapter=flags['region-resolved:'+npc.townId];
  if(chapter){
    const reactions:Record<string,string>={
      elarion:flags['narenthil-grove-keepers']?'The lorekeepers tend the stones, and their warnings are open to travelers.':'Bowyers and roadwardens now share the grove watch. Neither can close the paths without answering to the other.',
      redmesa:flags['rindass-clan-water']?'Every clan can read its watering turn. Krag no longer decides whose children drink.':'The well tally is witnessed by clans and carters. A seal cannot buy the water again.',
      tidewatch:flags['portquill-public-cargo']?'The routes are posted at every quay. Families choose whether their names go beside them.':'The guild pays for guarded reunions, but the household witnesses keep the names. Nobody asks the passengers to trust another captain’s private book.',
      blackspire:flags['darkav-open-account']?'The forge account names the mistakes as well as the guilty. The crews have a right to know.':'The regional archives hold matching forge accounts. No single official can bury them.',
      starhold:'The beacon watch guides the winter convoys. Victory made the passage possible; keeping it takes work every night.',
      deepford:'Bruni reads a few names at the gallery each morning. Some of the old miners go with her. Others are not ready yet.',
      skallheim:'The shore lantern burns again. The children can watch for their families’ boats instead of counting the last provisions.',
    };
    if(reactions[npc.townId])return after(reactions[npc.townId]);
  }
  if(npc.townId==='oakmere'&&flags['oakmere-road-open']&&id==='aldren-vale')return after('Lena waved to the watch this morning. A small thing, unless you remember when she could not bear the sound of boots.');
}
