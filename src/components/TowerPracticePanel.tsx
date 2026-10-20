import {useEffect,useRef} from 'react';
import {useGameStore} from '../store/gameStore';
import {TOWER_CHAMBERS,TOWER_FLOORS,towerPracticeAvailable} from '../data/towerOfMight';
import './tower-practice.css';

export function TowerPracticePanel(){
 const open=useGameStore(s=>s.panel==='tower-practice');
 const ledger=useGameStore(s=>s.dungeons),week=useGameStore(s=>s.nextTowerResetAt);
 const practicing=useGameStore(s=>Boolean(s.towerPractice));
 const select=useGameStore(s=>s.selectTowerPracticeFloor),close=useGameStore(s=>s.closePanel);
 const closeButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement;
  closeButton.current?.focus();
  return ()=>{if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[open]);
 if(!open)return null;
 const available=towerPracticeAvailable(ledger,week);
 return <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="tower-practice-title" aria-describedby="tower-practice-description"
  onKeyDown={event=>{
   if(event.key==='Escape'){event.stopPropagation();close();}
   if(event.key==='Tab'){
    const buttons=event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  }}>
  <section className="panel tower-practice-panel">
   <header><div><h2 id="tower-practice-title">Tower practice</h2>
    <p id="tower-practice-description">Rebattle any floor. No gold, XP, loot, or weekly progress.</p></div>
    <button ref={closeButton} type="button" onClick={close}>{practicing?'Back':'Leave tower'}</button></header>
   <div className="tower-practice-content">
    <p className="tower-practice-renewal">Available until {new Date(week).toLocaleString()}. After weekly renewal, clear the entire tower again to unlock practice.</p>
    {!available?<p role="status">Practice is locked. Complete this week's tower first.</p>:
     <div className="tower-practice-chambers">{TOWER_CHAMBERS.map((chamber,index)=><section key={index} aria-labelledby={'practice-chamber-'+index}>
      <h3 id={'practice-chamber-'+index}>{index+1}. {chamber.name}</h3>
      <div className="tower-practice-floors">{TOWER_FLOORS.slice(index*5,index*5+5).map(floor=><button type="button" key={floor.id}
       onClick={()=>select(floor.id,week)} aria-label={`Practice floor ${floor.tower!.chamber}-${floor.tower!.floor}${floor.tower!.floor===5?': '+chamber.name:''}`}>
       <strong>{floor.tower!.chamber}-{floor.tower!.floor}</strong><small>{floor.tower!.floor===5?'Boss':`${floor.enemies.length} foes`}</small>
      </button>)}</div>
     </section>)}</div>}
   </div>
  </section>
 </div>;
}
