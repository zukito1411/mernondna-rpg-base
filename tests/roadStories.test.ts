import {describe,expect,it} from 'vitest';
import {QUESTS,QUEST_BY_ID} from '../src/data/quests';
import {ROAD_CHAPTERS,ROAD_CLUES,ROAD_ENCOUNTERS,ROAD_SIDE_QUESTS,WORLD_STORY_QUESTS,ROAD_STAGE_PREFIX} from '../src/data/roadStories';
import {NPC_BY_ID} from '../src/data/npcs';
import {ENEMY_BY_ID} from '../src/data/enemies';
import {CONTENT_BY_ID} from '../src/data/content';
import {migrateRoadStoryProgress} from '../src/game/systems/roadStoryMigration';
import {questDependencyComplete,questRequirementsMet} from '../src/game/systems/questDependencies';
import {initialQuests} from '../src/game/systems/storyProgress';
import {advanceQuests} from '../src/game/systems/questProgress';
import {CINEMATICS} from '../src/data/cinematics';

describe('authored road expansion',()=>{
  it('binds every chapter, clue, giver and finite wave to existing runtime content',()=>{
    expect(ROAD_SIDE_QUESTS).toHaveLength(16);
    expect(WORLD_STORY_QUESTS).toHaveLength(8);
    expect(new Set(QUESTS.map(q=>q.id)).size).toBe(QUESTS.length);
    for(const q of QUESTS)expect(new Set(q.objectives.map(o=>o.id)).size,q.id).toBe(q.objectives.length);
    for(const chapter of ROAD_CHAPTERS){
      const q=QUEST_BY_ID[chapter.questId],anchor=q.objectives.findIndex(o=>o.id===chapter.before);
      expect(anchor,chapter.before).toBeGreaterThanOrEqual(0);
      for(const o of chapter.objectives){
        const index=q.objectives.findIndex(stage=>stage.id===o.id);
        expect(index,o.id).toBeGreaterThanOrEqual(0);expect(index,o.id).toBeLessThan(anchor);
      }
    }
    for(const clue of ROAD_CLUES)expect(CONTENT_BY_ID[clue.id],clue.id).toMatchObject({kind:'interactable',repeatable:true});
    for(const e of ROAD_ENCOUNTERS){
      expect(CONTENT_BY_ID[e.contentId!],e.id).toBeDefined();
      expect(QUEST_BY_ID[e.questId].objectives.find(o=>o.id===e.objectiveId),e.id).toMatchObject({type:'encounter',targetId:e.id});
      for(const wave of e.waves){expect(wave.length).toBeLessThanOrEqual(3);for(const id of wave)expect(ENEMY_BY_ID[id],id).toBeDefined();}
    }
    for(const q of [...ROAD_SIDE_QUESTS,...WORLD_STORY_QUESTS]){
      expect(NPC_BY_ID[q.giverNpcId].questIds).toContain(q.id);
      if(q.prerequisiteQuestId)expect(QUEST_BY_ID[q.prerequisiteQuestId]).toBeDefined();
      if(q.prerequisiteObjective)expect(QUEST_BY_ID[q.prerequisiteObjective.questId].objectives
        .find(o=>o.id===q.prerequisiteObjective!.objectiveId)).toBeDefined();
    }
  });
  it('keeps completed saves completed without fabricating choices or mutating source progress',()=>{
    const objectives=QUEST_BY_ID['first-road'].objectives;
    const old=Object.fromEntries(objectives.filter(o=>!o.id.startsWith(ROAD_STAGE_PREFIX)).map(o=>[o.id,o.amount]));
    const migrated=migrateRoadStoryProgress(objectives,'completed',old);
    for(const o of objectives)expect(migrated[o.id]).toBe(o.amount);
    expect(old[ROAD_STAGE_PREFIX+'orchard-call']).toBeUndefined();
  });
  it('skips only missing additions behind an active saved frontier',()=>{
    const objectives=QUEST_BY_ID['first-road'].objectives;
    const old={'watch-plan':1,'roads:orchard-rescue':0};
    const migrated=migrateRoadStoryProgress(objectives,'active',old);
    expect(migrated['roads:orchard-call']).toBe(1);
    expect(migrated['roads:orchard-rescue']).toBe(0);
    expect(migrated['roads:tower-hollow']).toBeUndefined();
    expect(migrateRoadStoryProgress(objectives,'locked',old)).toBe(old);
  });
  it('requires the forge stage, not the completed final quest, before the dragon approach',()=>{
    const gate=QUEST_BY_ID['returning-ember'].objectives.find(o=>o.id==='roads:final-forge-ready')!;
    expect(gate.targetObjectiveId).toBe('covenant-forge');
    const quests=initialQuests();
    quests['returning-ember']={status:'active',objectiveProgress:{'vexa-warning':1}};
    quests['the-last-ward']={status:'active',objectiveProgress:{}};
    expect(questDependencyComplete(gate,quests,QUEST_BY_ID)).toBe(false);
    const blocked=advanceQuests(quests,[],{type:'quest',targetId:'the-last-ward',amount:1,questId:'returning-ember'});
    expect(blocked.quests['returning-ember'].objectiveProgress[gate.id]).toBeUndefined();
    quests['the-last-ward'].objectiveProgress['covenant-forge']=1;
    expect(questDependencyComplete(gate,quests,QUEST_BY_ID)).toBe(true);
    expect(advanceQuests(quests,[]).quests['returning-ember'].objectiveProgress[gate.id]).toBe(1);
    expect(quests['the-last-ward'].status).toBe('active');
  });
  it('does not grandfather the preparation gate on an active save or erase earned battles',()=>{
    const old={'vexa-warning':1,'repel-varkhul':1};
    const result=migrateRoadStoryProgress(QUEST_BY_ID['returning-ember'].objectives,'active',old);
    expect(result['roads:final-forge-ready']).toBeUndefined();
    expect(result['repel-varkhul']).toBe(1);
  });
  it('offers world recovery only after its regional result and binds its closing scene',()=>{
    for(const q of WORLD_STORY_QUESTS){
      const quests=initialQuests();
      expect(questRequirementsMet(q,quests,QUEST_BY_ID)).toBe(false);
      const gate=q.prerequisiteObjective!;
      quests[gate.questId].objectiveProgress[gate.objectiveId]=1;
      expect(questRequirementsMet(q,quests,QUEST_BY_ID)).toBe(true);
      expect(CINEMATICS[q.objectives.at(-1)!.cinematicId!].shots.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('has staged boss introductions and a resolved messenger scene using the existing director',()=>{
    for(const id of ['varr-before','warden-before','stonejaw-before','krag-before','rootfather-before',
      'salt-before','wyrm-before','seer-before','varkhul-before','roads-messenger-known'])
      expect(CINEMATICS[id].shots.length,id).toBeGreaterThanOrEqual(3);
    for(const q of QUESTS)for(const o of q.objectives)if(o.cinematicId)expect(CINEMATICS[o.cinematicId],o.cinematicId).toBeDefined();
  });
});
