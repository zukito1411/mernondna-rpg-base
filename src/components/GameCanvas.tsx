import { useEffect, useRef,useState } from 'react';
import { createMernondnaGame } from '../game/MernondnaGame';
import { mobileInput } from '../game/input';
import { useGameStore } from '../store/gameStore';
import type Phaser from 'phaser';
import {TitleArtwork} from './TitleArtwork';

declare global { interface Window { __mernondnaGame?: Phaser.Game } }

const LOADING_QUOTES=[
  '“The roads are honest, lad. It is people who lie about where they lead.”',
  '“A candle is not protection, but it reminds travelers who waits for them.”',
  '“Keep the paths open; everybody here depends on them.”',
  '“The beacon is lit, but the pass still feels watched.”',
  '“Our file leaves the crossing clear. Caldus insists on spacing, even on quiet days.”',
  '“Some compasses point toward unfinished stories.”',
];

export function GameCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState({ready:false,progress:0});
  const [quoteIndex,setQuoteIndex]=useState(()=>Math.floor(Math.random()*LOADING_QUOTES.length));

  useEffect(() => {
    if (!ref.current) return;
    let game:Phaser.Game|undefined;
    const failed=(reason:unknown)=>{if(game?.registry.get('worldReady'))return;
      setError(reason instanceof Error?reason.message:'The game could not finish initializing.');};
    const onError=(event:ErrorEvent)=>{if(event.error)failed(event.error);};
    const onRejection=(event:PromiseRejectionEvent)=>failed(event.reason);
    window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);
    // Some overlay focus transitions prevent Phaser from seeing a keydown.
    // Both inputs use the same boolean action queue, so a duplicate event is harmless.
    const onInteractKey = (event:KeyboardEvent) => {
      if(event.code!=='KeyE'||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
      const target=event.target instanceof HTMLElement?event.target:null;
      if(target && (target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
      const state=useGameStore.getState();
      if(state.panel||state.dialogue||state.cinematic||!state.navigation.interaction)return;
      mobileInput.press('interact');
    };
    window.addEventListener('keydown',onInteractKey);
    try{
      game = createMernondnaGame(ref.current);
    }catch(reason){failed(reason);}
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('e2e')) window.__mernondnaGame = game;
    const readinessPoll=window.setInterval(()=>{
      if(!game)return;
      const assetError=game.registry.get('assetError');
      if(typeof assetError==='string'){setError(assetError);return;}
      const progress=game.registry.get('loadingProgress');
      const ready=game.registry.get('worldReady')===true;
      setLoading(current=>current.ready===ready&&current.progress===progress?current:
        {...current,ready,progress:typeof progress==='number'?progress:current.progress});
    },100);
    return () => {window.clearInterval(readinessPoll);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection);window.removeEventListener('keydown',onInteractKey);
      if (window.__mernondnaGame === game) delete window.__mernondnaGame; game?.destroy(true); };
  }, []);

  useEffect(()=>{
    if(loading.ready||error)return;
    const timer=window.setInterval(()=>setQuoteIndex(current=>{
      const next=Math.floor(Math.random()*(LOADING_QUOTES.length-1));
      return next>=current?next+1:next;
    }),4200);
    return ()=>window.clearInterval(timer);
  },[loading.ready,error]);

  const progress=Math.round(Math.min(.92,Math.max(0,loading.progress*.92))*100);
  return <><div ref={ref} className="game-canvas" aria-label="Mernodna game world"/>
    {!loading.ready&&!error&&<div className="game-loading" role="status" aria-live="polite">
      <TitleArtwork/>
      <div className="game-loading-content">
        <p className="game-loading-quote" key={quoteIndex}>{LOADING_QUOTES[quoteIndex]}</p>
        <div className="game-loading-track" role="progressbar" aria-label="Loading game" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{width:`${progress}%`}}/>
        </div>
      </div>
    </div>}
    {error&&<div className="startup-failure" role="alert"><h2>Game initialization stopped</h2><p>{error}</p><p>Your save was not deleted.</p><button onClick={()=>window.location.reload()}>Retry opening</button></div>}</>;
}
