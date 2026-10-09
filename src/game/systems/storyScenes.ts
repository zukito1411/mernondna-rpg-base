import {QUESTS} from '../../data/quests';
import type {QuestRuntimeState} from '../types';
type Quests=Record<string,QuestRuntimeState>;
export function completedStoryScenes(before:Quests,after:Quests,flags:Record<string,boolean>){
 return QUESTS.flatMap(q=>q.objectives.filter(o=>o.cinematicId&&!flags['scene:'+o.cinematicId]
  &&(before[q.id]?.objectiveProgress[o.id]??0)<o.amount&&(after[q.id]?.objectiveProgress[o.id]??0)>=o.amount).map(o=>o.cinematicId!));
}
export function sceneQueue(pending:string|null,queue:string[],requests:string[],flags:Record<string,boolean>){
 const all=[...new Set([...(pending?[pending]:[]),...queue,...requests])].filter(id=>!flags['scene:'+id]);
 return {pendingCinematic:all[0]??null,cinematicQueue:all.slice(1)};
}
export function questConsequences(quests:Quests,flags:Record<string,boolean>){
 const next={...flags};
 for(const [quest,flag] of Object.entries({'first-road':'oakmere-road-open','crown-summons':'crown-sea-charter','royal-guard-trial':'granary-watch-manned','kingdom-divided':'grain-relief-dispatched','water-stops':'cibar-harvest-secured','returning-ember':'darkav-evacuation-safe'}))
  if(quests[quest]?.status==='completed')next[flag]=true;
 return Object.entries(next).some(([key,value])=>flags[key]!==value)?next:flags;
}
