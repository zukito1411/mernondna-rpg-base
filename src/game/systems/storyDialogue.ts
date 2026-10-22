import { NPC_BY_ID,NPC_NAME_ALIASES } from '../../data/npcs';
import {rewriteNpcMentions} from '../../data/npcPresentation';
import type { QuestRuntimeState } from '../types';
import {nextObjective} from './storyProgress';
import {ROAD_SIDE_QUESTS,WORLD_STORY_QUESTS} from '../../data/roadStories';

const roadStoriesByGiver=new Map<string,typeof ROAD_SIDE_QUESTS[number][]>();
for(const q of [...ROAD_SIDE_QUESTS,...WORLD_STORY_QUESTS]){
  const stories=roadStoriesByGiver.get(q.giverNpcId)??[];
  stories.unshift(q);roadStoriesByGiver.set(q.giverNpcId,stories);
}

/** Event-driven reactions; no additional resident simulation or portrait assets. */
export function reactiveStoryDialogue(id:string,quests:Record<string,QuestRuntimeState>,flags:Record<string,boolean>):string[]|undefined {
  return rewriteNpcMentions(storyReaction(id,quests,flags),NPC_NAME_ALIASES);
}
function storyReaction(id:string,quests:Record<string,QuestRuntimeState>,flags:Record<string,boolean>):string[]|undefined {
  const npc=NPC_BY_ID[id];if(!npc)return;
  const after=(line:string)=>[line,...npc.dialogue];
  if(id==='maerwen-reedleaf'&&(quests['eight-regions']?.objectiveProgress['pilgrim-safe']??0)>=1)return [
    'The children made it home. One of them held my hand all the way back and wouldn’t let go.',
    'I was so scared I forgot to say thank you. So... thank you.'];
  const aftermath:Record<string,string>={
    'aldren-vale':'When I heard the bell, I started looking for you. I’m glad you’re all right.',
    'mira-fen':'Everyone got inside safely. I counted twice. I know, I worry too much.',
    'elara-voss':'I’ve put guards at the inn. I don’t think Varr’s men will try that again.',
    'sena-marrow':'One of the children thought the alarm bell meant dinner. I wish it had.',
  };
  if(flags['encounter:oakmere-raid:complete']&&quests['first-road']?.status!=='completed'&&aftermath[id])return after(aftermath[id]);
  if(flags['encounter:archive-fire:complete']&&!flags['campaign-complete']){
    if(id==='renna-vale')return ['There’s soot all over my books. I keep checking the pages, just to make sure nothing was lost.',
      'The witnesses are safe, thank goodness. I’m still copying everything. I don’t want to lose it again.'];
    if(id==='captain-yselle-ward')return ['We stopped the men at the archive. They said they had orders, but that doesn’t make what they did right.',
      'I’ve sent guards home with the witnesses. Nobody’s walking alone tonight.'];
    if(id==='sevrin-hale')return ['I’ve given the watch my orders. I’ll tell the court what I did. That’s all I can say.'];
  }
  if(flags['encounter:redmesa-defense:complete']&&!flags['region-resolved:redmesa']&&id==='redmesa-beastmaster')return [
    'You stayed and helped us when Krag attacked. Thank you. I won’t forget it.',
    'The clans are finally talking. I just want to get the well open before anyone starts fighting again.'];
  // Remember the actual chosen response, including after the main ending.
  // The store always gives a current quest conversation priority over this.
  for(const q of roadStoriesByGiver.get(id)??[]){
    if(quests[q.id]?.status!=='completed')continue;
    const ending=q.objectives.at(-1)?.choices?.find(c=>flags[c.flag]);
    if(ending)return [ending.response,...npc.dialogue.slice(0,1)];
    if(q.worldQuest&&q.objectives.at(-1)?.dialogue)return q.objectives.at(-1)!.dialogue;
  }
  if(quests['home-for-two']?.status==='completed'&&id==='willowcross-keeper')return [
    flags['siblings-widow']?'The children moved in with the widow. One of them insisted on bringing that old broken chair. It belonged to their mother.'
      :'Isabel asked the children where they wanted to live. They looked so surprised someone was asking them.',
    'At least they’re staying together. I’m glad of that.'];
  if(quests['hunters-promise']?.status==='completed'&&id==='mira-fen')return ['Silas helped us clear the last traps. I think even he was upset by what we found.',
    'Next time we go out, can we just look for herbs? I’d like one quiet afternoon.'];
  if(quests['tidewatch-debt']?.status==='completed'&&id==='tidewatch-sailmaker')return [
    'She got the letter. She hasn’t answered him. I told him to give her time.',
    flags['pirate-accountability']?'The watch has a copy of the evidence. Saying sorry doesn’t change what he did.':'She can decide for herself whether to forgive him. I don’t want anyone pushing her.'];
  if(quests['shadows-highmere']?.status==='completed'&&['tovin-reed','mairin-reed','pell-rusk'].includes(id)){
    const publicHearing=flags['grain-public-inquiry'];
    if(id==='tovin-reed')return publicHearing?['I was shaking so much Isabel had to hold the paper for me. Then someone said Oswin’s name, and I managed to finish.','I hate being stared at now. But I’m glad I told the truth.']
      :['I slept all night for the first time in ages. Mother noticed. She didn’t say anything, but she made me breakfast.','Isabel’s keeping my statement safe. Someday I’ll tell Oswin’s daughter what happened myself.'];
    return after(publicHearing?'There were so many people in the square when Tovin spoke. The neighbors have been helping us watch the kitchen since then.'
      :'The statement’s safe with Isabel. Some people keep asking why we won’t share it. My boy’s been through enough.');
  }
  if(quests['water-stops']?.status==='completed'&&['celia-brook','asha-stonevein','iren-copperwake','kellan-ashfield','meral-gull'].includes(id))return after(flags['cibar-public-water']?
    'Celia told everyone what happened to her brother. She didn’t name the families he helped. I think he would’ve wanted that.'
    :'We sent the evidence to Isabel, but kept the families’ names private. I don’t want those people hurt again.');
  if(quests['first-road']?.status==='active'&&id==='aldren-vale'){
    const current=nextObjective('first-road',quests);
    const concerns:Record<string,string>={
      'talk-aldren':"Come here a minute. I need to talk to you about Lena.",
      'morning-inn':"Sena was asking after you. She’s worried about Lena too.",
      'field-witness':"Alice found tracks near the farm. She didn’t like what she saw.",
      'blade-check':"Did Joren look at your sword? The poor man worries about you almost as much as I do.",
      'lena-safe':"Please tell me you’ve found Lena. Her children keep asking when she’ll be home.",
      'seed-return':"Is Lena safe? Good. Nella will be relieved. She’s been worried sick.",
      'roadwardens-choice':"I know you’re angry. Just... don’t go looking for a fight because of it.",
      'watch-plan':"Elara’s putting guards by the inn. We can’t have those men coming after Lena again.",
      'break-blockade':"Varr’s men are still up by the tower. Don’t try to take the whole road on your own.",
      'tower-dispatch':"Someone paid for that ambush. There’s a letter near the tower that might tell us who.",
      'kill-varr':"I wish I could go with you. Be careful around Varr. He knows how to fight.",
      'compass-question':"Orin asked about your compass. I think she knows something I don’t.",
      'return-aldren':"You’re back. Thank goodness. Come inside and tell me what happened.",
    };
    return [concerns[current?.id??'']??"I just want you home safe, all right?",
      "And please eat something before you go out again."];
  }
  if(flags['campaign-complete']){
    const home:Record<string,string>={
      'aldren-vale':'You’ve done so much, and you’re still the same lad I raised. I’m glad you’re home.',
      'mira-fen':'Come on, sit down. You promised you’d tell me everything. And don’t leave out the embarrassing parts.',
      'sena-marrow':'There’s food on the table. You look tired. Sit down and eat something.',
      'orin-bell':'That compass of yours is finally pointing straight. I never thought I’d see it.',
      'renna-vale':flags['covenant-local-keepers']?'A letter came from Moonfall. The children are using the grove path again. Their keeper says they’re louder than the birds.':'Edmund sent word from the new watch. Apparently half of them tied their boots wrong. He sounds delighted to have someone to teach.',
    };
    if(home[id])return after(home[id]);
    // Ordinary residents retain their own lives and voices after the ending.
    return npc.dialogue;
  }
  if(id==='lena-cartwright'&&(quests['first-road']?.objectiveProgress['lena-safe']??0)>=1)
    return ['The children finally stopped asking if you’re coming back. They know you kept your promise.','I still have the shawl. I can’t get the stain out. My daughter says I should keep it anyway.'];
  if(id==='bruni-stonevein'&&(quests['eight-regions']?.objectiveProgress['bruni-rescued']??0)>=1)
    return [flags['relocated:npc:bruni-stonevein']?'The guild has my survey now. They can’t keep pretending nothing happened to the spring.':'Please keep my survey. I don’t trust the guild to keep the only copy.',
      'I won’t send anyone back into the mine until we’ve checked the water. We’ve already lost too many people.'];
  // Local aftermath may be heard from neighbors, but keep it personal rather
  // than giving every resident the same authoritative political announcement.
  const chapter=flags['region-resolved:'+npc.townId];
  if(chapter){
    const reactions:Record<string,string>={
      elarion:flags['narenthil-grove-keepers']?'Ilyra and the other lorekeepers have started repairing the stones. I hope the paths will be safe again soon.':'The bowyers are helping guard the path. It’s been a relief to see people working together.',
      redmesa:flags['rindass-clan-water']?'We’ve put the watering times up by the well. At least the children don’t have to wait for Krag’s men anymore.':'We’ve agreed to share the well. I hope nobody tries to take it over again.',
      tidewatch:flags['portquill-public-cargo']?'Did you see the white sail coming in? Someone on the quay started crying before the boat even tied up. I hope it was good news.':'Jessa’s crews brought people in by the sheltered shore. We took blankets down. Some of them could barely stand.',
      blackspire:flags['darkav-open-account']?'We finally told the workers what happened. They were angry. I don’t blame them.':'We sent copies of the forge records to the other towns. I’d feel better if no one could hide them again.',
      starhold:'The beacon’s working again. Someone still has to keep watch every night, but at least the wagons are getting through.',
      deepford:'Bruni’s been reading the missing miners’ names at the gallery. Some people come to listen. Others aren’t ready.',
      skallheim:'The lantern’s lit again. The children keep running outside every time a boat comes in.',
    };
    if(reactions[npc.townId])return after(reactions[npc.townId]);
  }
  if(npc.townId==='oakmere'&&flags['oakmere-road-open']&&id==='aldren-vale')return after('Lena waved to the guards this morning. A few days ago she was scared to go near them. It’s good to see her feeling safer.');
}
