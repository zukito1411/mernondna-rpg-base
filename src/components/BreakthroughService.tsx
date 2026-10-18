import {useGameStore} from '../store/gameStore';
import {EDMUND_ATWOOD_ID} from '../data/npcs';
import {breakthroughPhase} from '../data/breakthrough';

export function BreakthroughService({npcId}:{npcId:string}){
 const level=useGameStore(s=>s.level),flags=useGameStore(s=>s.storyFlags),act=useGameStore(s=>s.edmundBreakthrough);
 if(npcId!==EDMUND_ATWOOD_ID||level<50)return null;
 const phase=breakthroughPhase(flags);
 return <section className="breakthrough-service" aria-label="Level breakthrough"><h3>Breakthrough · Beyond level 50</h3>
  <p>{phase==='complete'?'Your level cap is 75. Barrage unlocks automatically at level 60; equip it in a combat-art slot.':phase==='report'?'You have defeated Varkhul for the trial. Report your victory to Edmund to unlock levels 51–75.':phase==='trial'?'Defeat Varkhul, the Returning Ember, in Darkav, then return to Edmund. Earlier victories do not count for this trial.':'Edmund offers a trial to unlock levels 51–75: defeat Varkhul after accepting, then return to report.'}</p>
  {phase!=='complete'&&<button type="button" disabled={phase==='trial'} onClick={act}>{phase==='available'?'Accept breakthrough trial':phase==='report'?'Report victory · Unlock level 75':'Awaiting Varkhul’s defeat'}</button>}
 </section>;
}
export function BreakthroughJournal(){
 const level=useGameStore(s=>s.level),flags=useGameStore(s=>s.storyFlags);
 if(level<50)return null;const phase=breakthroughPhase(flags);
 return <article className="contract-card"><small>Edmund · Breakthrough trial</small><h3>Beyond the old limit</h3><p>{phase==='complete'?'Complete: level cap 75. At level 60, equip Barrage from Status → Usable skills.':phase==='available'?'Speak with Edmund in Oakmere to begin your level-50 breakthrough trial.':phase==='trial'?'Defeat Varkhul in Darkav after accepting Edmund’s trial, then report back to Edmund in Oakmere.':'Varkhul has fallen. Return to Edmund in Oakmere and report to raise your level cap to 75.'}</p></article>;
}
