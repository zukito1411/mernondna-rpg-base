import {useEffect} from 'react';
import {useGameStore} from '../store/gameStore';
import {itemName} from '../data/economy';
import {ItemIcon} from './ItemIcon';

/** Loot is already awarded. This nonblocking notification never changes rewards. */
export function RareLootPopup(){
  const notice=useGameStore(state=>state.rareLootQueue[0]);
  const blocked=useGameStore(state=>Boolean(state.cinematic||state.panel||state.dialogue));
  const dismiss=useGameStore(state=>state.dismissRareLoot);
  useEffect(()=>{
    if(!notice||blocked)return;
    const timer=window.setTimeout(()=>dismiss(notice.id),6000);
    return ()=>window.clearTimeout(timer);
  },[notice,blocked,dismiss]);
  if(!notice||blocked)return null;
  return <aside className="rare-loot-popup" role="status" aria-live="polite" key={notice.id}>
    <ItemIcon id={notice.weaponId}/>
    <div><small>{notice.kind==='weapon'?'Rare weapon found!':notice.kind==='material'?'Rare duplicate found!':'Rare duplicate salvaged'}</small>
      <strong>{itemName(notice.weaponId)}</strong>
      <span>{notice.kind==='weapon'?'Added to your bag':notice.kind==='material'?'+1 matching forge material':`Material storage full · +${notice.gold} gold`}</span>
    </div>
  </aside>;
}
