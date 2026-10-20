import {useEffect,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {towerCheckpoint,TOWER_CHAMBERS} from '../data/towerOfMight';

export function TowerExitPanel(){
 const panel=useGameStore(s=>s.panel),request=useGameStore(s=>s.towerExitRequest),ledger=useGameStore(s=>s.dungeons);
 const nextReset=useGameStore(s=>s.nextTowerResetAt);
 const practice=useGameStore(s=>Boolean(s.towerPractice));
 const cancel=useGameStore(s=>s.closePanel),confirm=useGameStore(s=>s.confirmTowerExit);
 const cancelButton=useRef<HTMLButtonElement>(null),open=panel==='tower-exit'&&Boolean(request);
 useEffect(()=>{if(open)cancelButton.current?.focus();},[open]);
 if(!open)return null;
 const checkpoint=towerCheckpoint(ledger),finished=checkpoint===TOWER_CHAMBERS.length;
 return <div className="overlay-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="tower-exit-title" aria-describedby="tower-exit-warning"
  onKeyDown={event=>{
   if(event.key==='Escape'){event.stopPropagation();cancel();}
   if(event.key==='Tab'){
    const buttons=event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
    if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons[1]?.focus();}
    else if(!event.shiftKey&&document.activeElement===buttons[1]){event.preventDefault();buttons[0]?.focus();}
   }
  }}>
  <section className="panel tower-exit-panel">
   <h2 id="tower-exit-title">Return to Oakmere?</h2>
   <p id="tower-exit-warning">{practice?'Leave this practice battle? Your weekly tower completion is kept.':finished?'You have conquered the tower. All boss checkpoints and earned rewards are safe.':
    `Leaving resets all progress since your last boss checkpoint. Next time you enter, you will start at floor ${checkpoint+1}-1.`}</p>
   {practice?<p>Practice grants no rewards. You can choose another floor when you enter again, until the weekly renewal.</p>:<p>{checkpoint?`Boss checkpoints through ${checkpoint}-5 last until the weekly renewal.`:'You have not defeated a tower boss yet. Leaving means starting again at 1-1.'}
    {' '}Any earned, unopened boss chest will be collected before you leave.</p>}
   <p>Renews every Monday at 6 AM, device local time. Next renewal: {new Date(nextReset).toLocaleString()}. Earned gear and story progress are kept.</p>
   <footer><button type="button" ref={cancelButton} onClick={cancel}>Stay in the tower</button>
    <button type="button" onClick={confirm}>Teleport to Oakmere</button></footer>
  </section>
 </div>;
}
