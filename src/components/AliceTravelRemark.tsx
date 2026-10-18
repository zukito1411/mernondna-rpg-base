import {useEffect} from 'react';
import {useGameStore} from '../store/gameStore';
import {aliceIsFollowing} from '../data/aliceCompanion';

export function AliceTravelRemark(){
  const remark=useGameStore(s=>s.aliceRemark),dismiss=useGameStore(s=>s.dismissAliceRemark);
  const blocked=useGameStore(s=>Boolean(s.panel||s.dialogue||s.cinematic||s.pendingCinematic));
  const following=useGameStore(s=>aliceIsFollowing(s.storyFlags));
  useEffect(()=>{
    if(!remark)return;
    if(blocked||!following){dismiss(remark.id);return;}
    const timer=window.setTimeout(()=>dismiss(remark.id),9000);
    return ()=>window.clearTimeout(timer);
  },[remark,blocked,following,dismiss]);
  if(!remark||blocked||!following)return null;
  return <aside className="alice-travel-remark" role="status" aria-live="polite">
    <strong>Alice Fen</strong><p>{remark.text}</p>
    <button type="button" aria-label="Dismiss Alice's remark" onClick={()=>dismiss(remark.id)}>×</button>
  </aside>;
}
