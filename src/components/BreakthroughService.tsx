import {useEffect,useState} from 'react';
import {useGameStore} from '../store/gameStore';
import {EDMUND_ATWOOD_ID} from '../data/npcs';
import {breakthroughPhase,WORLD_ASCENSION} from '../data/breakthrough';
import {saveGame} from '../utils/save';

function WorldAscensionService(){
 const level=useGameStore(s=>s.level),flags=useGameStore(s=>s.storyFlags);
 const readyAt=useGameStore(s=>s.worldAscensionReadyAt),act=useGameStore(s=>s.edmundWorldAscension);
 const [ready,setReady]=useState(false);
 useEffect(()=>{setReady(false);if(!readyAt)return;
  const timer=window.setTimeout(()=>setReady(true),Math.max(0,readyAt-Date.now()));
  return ()=>window.clearTimeout(timer);
 },[readyAt]);
 if(level<75||breakthroughPhase(flags)!=='complete')return null;
 if(flags[WORLD_ASCENSION])return <section className="contract-card"><h3>World Ascension · Permanent</h3><p>All enemies are level 120 with stronger health and attacks. Each attribute can be trained to 60. Player level cap remains 75.</p><p>Weapon awakening remains available: boss hearts have a 50% drop chance. Bring three matching hearts and that boss’s weapon to a blacksmith.</p></section>;
 return <section className="contract-card" aria-label="World Ascension">
  <h3>World Ascension · Level 75</h3><p>Ask Edmund to unlock a harsher world and raise each attribute cap from 40 to 60. No further trial is required.</p>
  {!readyAt?<button type="button" onClick={e=>{e.stopPropagation();act('warn');}}>Ask about permanent World Ascension</button>:
   <div role="alertdialog" aria-labelledby="ascension-title" aria-describedby="ascension-warning" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.repeat)e.preventDefault();}}>
    <h4 id="ascension-title">Warning: this cannot be undone</h4>
    <p id="ascension-warning">Every enemy in every region, including bosses and caves, will permanently become level 120 with 60% extra HP and 35% extra attack damage on top of level scaling. Each stat cap rises to 60, but your level cap stays 75 and no extra stat points are granted. Retraining cannot undo this choice.</p>
    <p>Weapon awakening does not require World Ascension. Boss hearts keep their 50% drop chance before and after this choice.</p>
    <button type="button" onClick={()=>act('cancel')}>Keep my current world</button>
    <button type="button" disabled={!ready} onClick={()=>{
      act('confirm');
      if(useGameStore.getState().storyFlags[WORLD_ASCENSION]&&!saveGame())useGameStore.setState({toast:'World Ascension is active, but saving failed. Save or export your progress before closing the game.'});
    }}>Confirm permanently · Enable World Ascension</button>
   </div>}
 </section>;
}

export function BreakthroughService({npcId}:{npcId:string}){
 const level=useGameStore(s=>s.level),flags=useGameStore(s=>s.storyFlags),act=useGameStore(s=>s.edmundBreakthrough);
 if(npcId!==EDMUND_ATWOOD_ID||level<50)return null;
 const phase=breakthroughPhase(flags);
 return <section className="breakthrough-service" aria-label="Level breakthrough"><h3>Breakthrough · Beyond level 50</h3>
  <p>{phase==='complete'?'Your level cap is 75. Barrage unlocks automatically at level 60; equip it in a combat-art slot.':phase==='report'?'You have defeated Varkhul for the trial. Report your victory to Edmund to unlock levels 51–75.':phase==='trial'?'Defeat Varkhul, the Returning Ember, in Darkav, then return to Edmund. Earlier victories do not count for this trial.':'Edmund offers a trial to unlock levels 51–75: defeat Varkhul after accepting, then return to report.'}</p>
  {phase!=='complete'&&<button type="button" disabled={phase==='trial'} onClick={act}>{phase==='available'?'Accept breakthrough trial':phase==='report'?'Report victory · Unlock level 75':'Awaiting Varkhul’s defeat'}</button>}
  <WorldAscensionService/>
 </section>;
}
export function BreakthroughJournal(){
 const level=useGameStore(s=>s.level),flags=useGameStore(s=>s.storyFlags);
 if(level<50)return null;const phase=breakthroughPhase(flags);
 return <article className="contract-card"><small>Edmund · Breakthrough trial</small><h3>Beyond the old limit</h3><p>{phase==='complete'?'Complete: level cap 75. At level 60, equip Barrage from Status → Usable skills.':phase==='available'?'Speak with Edmund in Oakmere to begin your level-50 breakthrough trial.':phase==='trial'?'Defeat Varkhul in Darkav after accepting Edmund’s trial, then report back to Edmund in Oakmere.':'Varkhul has fallen. Return to Edmund in Oakmere and report to raise your level cap to 75.'}</p></article>;
}
