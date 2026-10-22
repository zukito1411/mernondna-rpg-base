import { QUESTS, QUEST_BY_ID } from '../data/quests';
import { NPC_BY_ID } from '../data/npcs';
import { CONTENT_BY_ID } from '../data/content';
import { useGameStore } from '../store/gameStore';
import {questObjectiveText,questTravelHint} from '../game/systems/questDestinations';
import {AcceptedContracts} from './ContractBoard';
import {BreakthroughJournal} from './BreakthroughService';
import {TOWER_QUEST_ID,towerCampaignComplete} from '../data/towerOfMight';

export function QuestJournal() {
  const panel=useGameStore(s=>s.panel),quests=useGameStore(s=>s.quests),trackedQuestId=useGameStore(s=>s.trackedQuestId),closePanel=useGameStore(s=>s.closePanel),trackQuest=useGameStore(s=>s.trackQuest),storyChoices=useGameStore(s=>s.storyChoices);
  const navigation=useGameStore(s=>s.navigation),flags=useGameStore(s=>s.storyFlags);
  const region=useGameStore(s=>s.regionId);
  if(panel!=='journal')return null;
  return <div className="overlay-backdrop"><section className="quest-journal" aria-label="Quest journal">
    <header><h2>Leigneron’s journal</h2><button onClick={closePanel}>Close</button></header>
    <div className="journal-content">
    <AcceptedContracts/>
    <BreakthroughJournal/>
    <button type="button" onClick={()=>useGameStore.getState().openPanel('codex')}>Bestiary, characters & weapon lore · B</button>
    {flags['campaign-complete']&&<p className="journal-resolution">The roads have keepers again. Your campaign is concluded; exploration, unfinished side quests and repeat boss battles remain available.</p>}
    <details><summary>Reaching the islands</summary><p>At Highmere, follow the river to the quay east of the Lower Ward. Interact with the pier to board a crewed boat. Tidewatch and Skallheim have return passages. For Darkav, choose Ashen Landing, then follow the ash road north to Blackspire. Helping a region attunes its shrine for later journeys.</p></details>
    {QUESTS.filter(q=>(q.id!==TOWER_QUEST_ID||towerCampaignComplete(quests))&&(quests[q.id]?.status==='active'||quests[q.id]?.status==='completed')).map(q=>{
      const runtime=quests[q.id];
      const current=q.objectives.find(o=>(runtime.objectiveProgress[o.id]??0)<o.amount);
      const visible=q.objectives.filter(o=>(runtime.objectiveProgress[o.id]??0)>=o.amount||o===current);
      const chapters=[...new Set(visible.map(o=>o.chapter??q.chapter??'Journal record'))];
      const target=navigation.target;
      const dependency=current?.type==='quest'?QUEST_BY_ID[current.targetId]:undefined;
      const milestone=current?.targetObjectiveId?dependency?.objectives.find(o=>o.id===current.targetObjectiveId):undefined;
      const contact=NPC_BY_ID[current?.targetId??'']??(dependency?NPC_BY_ID[milestone?.targetId??dependency.giverNpcId]:undefined);
      const travel=current?questTravelHint(current,region):undefined;
      return <article key={q.id}><small>{q.kind==='main'?'Main story':q.worldQuest?'World quest':'Side adventure'} · {q.chapter??'A story of Mernodna'}</small><h3>{q.name} <small>{runtime.status}</small></h3><p>{q.summary}</p>
        {runtime.status==='active'&&<button onClick={()=>trackQuest(q.id)}>{trackedQuestId===q.id?'Tracking':'Track this quest'}</button>}
        {current&&<div className="journal-current"><strong>Now: {questObjectiveText(current)}</strong>
          {travel&&<p>{travel}</p>}
          {current.amount>1&&<p>{runtime.objectiveProgress[current.id]??0} / {current.amount} completed in the marked encounter.</p>}
          {contact&&<p>Contact: {contact.name} — {contact.title}</p>}
          {dependency&&<p>Continue “{dependency.name}”{milestone?` until: ${milestone.text}`:'. Its current objective is tracked through this chapter.'}</p>}
          {target&&(target.questId===q.id||target.questId===dependency?.id)&&<p>Destination: {target.label}{target.travelHint&&<small> · {target.travelHint}</small>}</p>}
          {current.type==='escort'&&<p>Stay near the survivor. They will stop if you move too far ahead; the guide switches between them and the safe arrival point.</p>}
          {current.type==='encounter'&&<p>Follow the marker to begin this story event. Defeat its waves, then interact with the marked site if work remains. Moving away interrupts that work. Leaving or falling in battle preserves defeated attackers.</p>}
        </div>}
        {runtime.status==='completed'&&q.resolution&&<p className="journal-resolution">{q.resolution}</p>}
        <small>Completion reward: {q.rewardXp} XP · {q.rewardGold} gold{q.objectives.some(o=>o.rewardXp)&&' · Chapter milestones also grant experience'}</small>
        {chapters.map(chapter=><details key={chapter} open={runtime.status==='active'&&(current?.chapter??q.chapter??'Journal record')===chapter}>
          <summary>{chapter}</summary><ol>{visible.filter(o=>(o.chapter??q.chapter??'Journal record')===chapter).map(o=><li key={o.id}>
          {(runtime.objectiveProgress[o.id]??0)>=o.amount?'✓ ':''}{questObjectiveText(o)}
          {o.amount>1&&` (${runtime.objectiveProgress[o.id]??0}/${o.amount})`}
          {storyChoices[q.id+':'+o.id]&&<small> Decision: {o.choices?.find(c=>c.id===storyChoices[q.id+':'+o.id])?.text}</small>}
          {o.type==='investigate'&&(runtime.objectiveProgress[o.id]??0)>=o.amount&&(()=>{
            const clue=CONTENT_BY_ID[o.contentId??o.targetId];
            return clue&&'description' in clue?<details><summary>Read recovered evidence</summary><p>{clue.description}</p></details>:null;
          })()}
        </li>)}</ol></details>)}</article>;
    })}
    </div>
  </section></div>;
}
