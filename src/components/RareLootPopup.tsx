import {useEffect} from 'react';
import {useGameStore} from '../store/gameStore';
import {itemName} from '../data/economy';
import {ItemIcon} from './ItemIcon';
import {ARMOR_BY_ID,ARMOR_SET_BY_ID,ARMORS} from '../data/armor';

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
  if(notice.kind==='armor-set'){
    const set=ARMOR_SET_BY_ID[ARMOR_BY_ID[notice.weaponId].setId];
    return <aside className="rare-loot-popup" role="status" aria-live="polite" key={notice.id}>
      <div className="rare-loot-set-icons">{ARMORS.filter(a=>a.setId===set.id).map(a=><ItemIcon key={a.id} id={a.id}/>)}</div>
      <div><small>Complete armor set found!</small><strong>{set.name} set</strong><span>Chest, boots & cape · {notice.newArmorPieces??0} new pieces added{notice.gold>0?` · duplicates salvaged for ${notice.gold} gold`:''}</span></div>
    </aside>;
  }
  const armor=notice.kind==='armor'||notice.kind==='armor-salvage';
  return <aside className="rare-loot-popup" role="status" aria-live="polite" key={notice.id}>
    <ItemIcon id={notice.weaponId}/>
    <div><small>{armor?(notice.kind==='armor'?'Rare armor found!':'Armor duplicate salvaged'):notice.kind==='weapon'?'Rare weapon found!':notice.kind==='material'?'Rare duplicate found!':'Rare duplicate salvaged'}</small>
      <strong>{itemName(notice.weaponId)}</strong>
      <span>{notice.kind==='weapon'||notice.kind==='armor'?'Added to your bag':notice.kind==='material'?'+1 matching forge material':notice.kind==='armor-salvage'?`Set already collected · +${notice.gold} gold`:`Material storage full · +${notice.gold} gold`}</span>
    </div>
  </aside>;
}
