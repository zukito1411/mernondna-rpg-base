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
  if(id==='maerwen-reedleaf'&&(quests['eight-regions']?.objectiveProgress['pilgrim-safe']??0)>=1)return [
    'The little ones kept hold of each other all the way back. One would not let go even after we reached the hearth.',
    'I do not think I thanked you properly. I could hardly remember my own name. Thank you.'];
  const aftermath:Record<string,string>={
    'aldren-vale':'When that bell rang, I looked for you before I reached for my sword. Old habits. I am glad you were here.',
    'mira-fen':'Everyone reached shelter. I counted them twice. Do not laugh; I may count them again.',
    'elara-voss':'The inn has a watch now. Varr will not get another quiet chance at those records.',
    'sena-marrow':'One of the little ones asked whether the bell meant supper. I said not yet. I will be glad when I can ring it for something ordinary.',
  };
  if(flags['encounter:oakmere-raid:complete']&&quests['first-road']?.status!=='completed'&&aftermath[id])return after(aftermath[id]);
  if(flags['encounter:archive-fire:complete']&&!flags['campaign-complete']){
    if(id==='renna-vale')return ['There is soot on every page I touch. I keep finding myself checking whether the ink is still there.',
      'The witnesses are safe. That matters more. But I am making another copy of everything.'];
    if(id==='captain-yselle-ward')return ['My watch answers to the crown’s law, not a steward’s purse. His men learned the difference at the archive doors.',
      'The witnesses have an escort home. Nobody walks that lane alone tonight.'];
    if(id==='sevrin-hale')return ['The watch has my orders. I will answer before the court. I have no more promises to offer you.'];
  }
  if(flags['encounter:redmesa-defense:complete']&&!flags['region-resolved:redmesa']&&id==='redmesa-beastmaster')return [
    'You stood beside our people when Krag came for them. That is what I will remember, not which blood you carry.',
    'The clans are ready to hear one another. Let us settle the well before another chief tries settling it with swords.'];
  if(quests['home-for-two']?.status==='completed'&&id==='willowcross-keeper')return [
    flags['siblings-widow']?'They carried their own blankets to the widow’s house. One insisted on taking the broken chair too. It was their mother’s.'
      :'Isabel asked the children what they wanted before asking anyone about the deed. They had been waiting a long time for that question.',
    'They will stay together. That much is settled.'];
  if(quests['hunters-promise']?.status==='completed'&&id==='mira-fen')return ['No more snares by the village. Silas has been helping the watch pull up the last stakes.',
    'Next time we go tracking, I am choosing something that does not end with you drawing a sword.'];
  if(quests['tidewatch-debt']?.status==='completed'&&id==='tidewatch-sailmaker')return [
    'She has the letter. No, she has not answered him. I told him that silence was an answer he would have to learn to live with.',
    flags['pirate-accountability']?'The harbor watch kept its copy. An apology does not make the ledger disappear.':'Whether she forgives him is her own business. We have done enough deciding things for her.'];
  if(quests['shadows-highmere']?.status==='completed'&&['tovin-reed','mairin-reed','pell-rusk'].includes(id)){
    const publicHearing=flags['grain-public-inquiry'];
    if(id==='tovin-reed')return publicHearing?['I shook so badly Yselle held the page for me. Then someone in the square said Oswin’s name, and I could read the next line.','I do not like being recognized. I am still glad I spoke.']
      :['I slept through the night. Mother made a point of not mentioning it, which is how I knew she had noticed.','Yselle has my words under seal. When I am ready, I want Oswin’s daughter to hear them from me.'];
    return after(publicHearing?'The square was full when Tovin spoke. There are guards at the kitchen, but neighbors have been taking turns there too.'
      :'The testimony is sealed. Some call it another secret. I tell them a frightened boy is not the price we pay to satisfy their curiosity.');
  }
  if(quests['water-stops']?.status==='completed'&&['celia-brook','asha-stonevein','iren-copperwake','kellan-ashfield','meral-gull'].includes(id))return after(flags['cibar-public-water']?
    'Celia spoke by the well. She named what her brother did, not the travelers who needed him. I think he would have approved.'
    :'The sworn households have kept the travelers’ names safe. Yselle has the murder evidence. We can remember him without putting someone else in danger.');
  if(quests['first-road']?.status==='active'&&id==='aldren-vale'){
    const current=nextObjective('first-road',quests);
    const concerns:Record<string,string>={
      'talk-aldren':"Come here a minute. I need to talk to you about Lena.",
      'morning-inn':"Sena was asking after you. She's worried about Lena too.",
      'field-witness':"Alice found tracks near the farm. She didn't like what she saw.",
      'blade-check':"Did Joren look at your sword? The poor man worries about you almost as much as I do.",
      'lena-safe':"Please tell me you've found Lena. Her children keep asking when she'll be home.",
      'seed-return':"Is Lena safe? Good. Nella will be relieved. She's been worried sick.",
      'roadwardens-choice':"I know you're angry. Just... don't go looking for a fight because of it.",
      'watch-plan':"Elara's putting guards by the inn. We can't have those men coming after Lena again.",
      'break-blockade':"Varr's men are still up by the tower. Don't try to take the whole road on your own.",
      'tower-dispatch':"Someone paid for that ambush. There's a letter near the tower that might tell us who.",
      'kill-varr':"I wish I could go with you. Be careful around Varr. He knows how to fight.",
      'compass-question':"Orin asked about your compass. I think he knows something I don't.",
      'return-aldren':"You're back. Thank goodness. Come inside and tell me what happened.",
    };
    return [concerns[current?.id??'']??"I just want you home safe, all right?",
      "And please eat something before you go out again."];
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
  // Local aftermath may be heard from neighbors, but keep it personal rather
  // than giving every resident the same authoritative political announcement.
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
