import { useGameStore } from '../store/gameStore';
import {NPC_BY_ID} from '../data/npcs';
import {SpritePortrait} from './SpritePortrait';
import {useEffect,useState,type CSSProperties} from 'react';
import {StoryPanels} from './StoryPanels';
import {acceptUiAction} from '../utils/uiInputGuard';
import {CINEMATIC_FADE_MS,STORY_PANEL_ART} from '../data/storyPanelArt';
export function CinematicPanel() {
  const cinematic=useGameStore(s=>s.cinematic),skip=useGameStore(s=>s.requestCinematicSkip);
  const [focused,setFocused]=useState(()=>typeof document==='undefined'||(!document.hidden&&document.hasFocus()));
  const active=Boolean(cinematic);
  useEffect(()=>{
    if(!active)return;
    const focus=()=>setFocused(!document.hidden&&document.hasFocus());focus();
    window.addEventListener('focus',focus);window.addEventListener('blur',focus);
    document.addEventListener('visibilitychange',focus);
    return ()=>{window.removeEventListener('focus',focus);window.removeEventListener('blur',focus);
      document.removeEventListener('visibilitychange',focus);};
  },[active]);
  if(!cinematic)return null;
  const npc=cinematic.focusNpcId?NPC_BY_ID[cinematic.focusNpcId]:undefined;
  const artwork=cinematic.illustration;
  return <section className={'cinematic-presentation'+(artwork?' cinematic-illustrated':'')+(!focused?' is-paused':'')
    +(cinematic.covered?' is-covered':'')+(!cinematic.ready?' is-preparing':'')+(cinematic.ending?' is-ending':'')}
    style={{'--cinematic-fade':`${CINEMATIC_FADE_MS}ms`} as CSSProperties}
    aria-label="Story scene" onPointerDown={event=>event.stopPropagation()} onPointerUp={event=>event.stopPropagation()}
    onClick={event=>event.stopPropagation()}>
    <div className="cinematic-top"><span>{cinematic.title}{artwork&&<small className="cinematic-memory-label">Illustrated scene · {artwork.panel+1}/{STORY_PANEL_ART[artwork.page].panels.length}</small>}</span>
      <button type="button" onClick={()=>{if(acceptUiAction())skip();}}>Skip scene · Esc</button></div>
    {artwork&&<StoryPanels key={artwork.page} artwork={artwork} ready={cinematic.ready}/>}
    <div className="cinematic-caption" role="status">
      {cinematic.ready ? <>
        {npc&&<div className="cinematic-identity"><SpritePortrait npc={npc} frame={npc.spriteFrame} texture={npc.spriteTexture} name={npc.name}/><span>{npc.name}<small>{npc.title}</small></span></div>}
        <p>{cinematic.line}</p>
      </> : <p>Preparing scene…</p>}
    </div>
    <div className="cinematic-curtain" aria-hidden="true"/>
  </section>;
}
