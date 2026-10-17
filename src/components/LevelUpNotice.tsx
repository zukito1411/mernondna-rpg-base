import {useEffect} from 'react';
import {useGameStore} from '../store/gameStore';

export function LevelUpNotice(){
  const notice=useGameStore(state=>state.levelUpNotice);
  const blocked=useGameStore(state=>Boolean(state.panel||state.dialogue||state.cinematic||state.pendingCinematic));
  const dismiss=useGameStore(state=>state.dismissLevelUp);
  useEffect(()=>{
    if(!notice||blocked)return;
    const timer=window.setTimeout(()=>dismiss(notice.id),6500);
    return ()=>window.clearTimeout(timer);
  },[notice,blocked,dismiss]);
  if(!notice||blocked)return null;
  return <aside className="level-up-notice" role="status" aria-live="polite" key={notice.id}>
    <span className="level-up-crest" aria-hidden="true">✦</span>
    <div><small>LEVEL UP!</small><strong>Level {notice.level}</strong>
      <span>+{notice.attributes} attribute points{notice.learning>0?` · +${notice.learning} learning points`:''}</span>
    </div>
  </aside>;
}
