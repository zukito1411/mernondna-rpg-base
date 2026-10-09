import { QUESTS } from '../data/quests';
import { useGameStore } from '../store/gameStore';

export function QuestJournal() {
  const panel=useGameStore(s=>s.panel),quests=useGameStore(s=>s.quests),trackedQuestId=useGameStore(s=>s.trackedQuestId),closePanel=useGameStore(s=>s.closePanel),trackQuest=useGameStore(s=>s.trackQuest),storyChoices=useGameStore(s=>s.storyChoices);
  if(panel!=='journal')return null;
  return <div className="overlay-backdrop"><section className="quest-journal" aria-label="Quest journal">
    <header><h2>Leigneron’s journal</h2><button onClick={closePanel}>Close</button></header>
    <details><summary>Reaching the islands</summary><p>At Highmere, follow the river to the quay east of the Lower Ward. Interact with the pier to board a crewed boat. Tidewatch and Skallheim have return passages. For Darkav, choose Ashen Landing, then follow the ash road north to Blackspire. Helping a region attunes its shrine for later journeys.</p></details>
    {QUESTS.filter(q=>quests[q.id]?.status!=='locked').map(q=>{
      const runtime=quests[q.id];
      const current=q.objectives.find(o=>(runtime.objectiveProgress[o.id]??0)<o.amount);
      return <article key={q.id}><h3>{q.name} <small>{runtime.status}</small></h3><p>{q.summary}</p>
        {runtime.status==='active'&&<button onClick={()=>trackQuest(q.id)}>{trackedQuestId===q.id?'Tracking':'Track this quest'}</button>}
        <ol>{q.objectives.filter(o=>(runtime.objectiveProgress[o.id]??0)>=o.amount || o===current).map(o=><li key={o.id}>
          {(runtime.objectiveProgress[o.id]??0)>=o.amount?'✓ ':''}{o.text}
          {o.amount>1&&` (${runtime.objectiveProgress[o.id]??0}/${o.amount})`}
          {storyChoices[q.id+':'+o.id]&&<small> Decision: {o.choices?.find(c=>c.id===storyChoices[q.id+':'+o.id])?.text}</small>}
        </li>)}</ol></article>;
    })}
  </section></div>;
}
