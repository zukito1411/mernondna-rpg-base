import type {QuestObjective,QuestRuntimeState} from '../types';
import {ROAD_STAGE_PREFIX} from '../../data/roadStories';

/** Only newly inserted stages behind an existing save's completed frontier are
 * grandfathered. No event is emitted and no XP/coins/choices are fabricated. */
export function migrateRoadStoryProgress(objectives:readonly QuestObjective[],status:QuestRuntimeState['status'],
  progress:Record<string,unknown>):Record<string,unknown>{
  if(status==='locked')return progress;
  const frontier=status==='completed'?objectives.length-1:objectives.reduce((last,o,i)=>
    !o.id.startsWith(ROAD_STAGE_PREFIX)&&progress[o.id]===o.amount?i:last,-1);
  let result=progress;
  for(let i=0;i<=frontier;i++){
    const o=objectives[i];
    // A new final-preparation gate must remain real on an active older save.
    // Already earned battle/report stages stay intact behind it; completing
    // the preparation never asks that player to defeat the dragon again.
    if(status==='active'&&o.type==='quest'&&o.targetObjectiveId)continue;
    if(o.id.startsWith(ROAD_STAGE_PREFIX)&&progress[o.id]===undefined){
      if(result===progress)result={...progress};
      result[o.id]=o.amount;
    }
  }
  return result;
}
