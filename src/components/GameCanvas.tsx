import { useEffect, useRef,useState } from 'react';
import { createMernondnaGame } from '../game/MernondnaGame';
import type Phaser from 'phaser';

declare global { interface Window { __mernondnaGame?: Phaser.Game } }

export function GameCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let game:Phaser.Game|undefined;
    const failed=(reason:unknown)=>{if(game?.registry.get('worldReady'))return;
      setError(reason instanceof Error?reason.message:'The game could not finish initializing.');};
    const onError=(event:ErrorEvent)=>{if(event.error)failed(event.error);};
    const onRejection=(event:PromiseRejectionEvent)=>failed(event.reason);
    window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);
    try{game = createMernondnaGame(ref.current);}catch(reason){failed(reason);}
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('e2e')) window.__mernondnaGame = game;
    return () => {window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection);
      if (window.__mernondnaGame === game) delete window.__mernondnaGame; game?.destroy(true); };
  }, []);

  return <><div ref={ref} className="game-canvas" aria-label="Mernodna game world"/>
    {error&&<div className="startup-failure" role="alert"><h2>Game initialization stopped</h2><p>{error}</p><p>Your save was not deleted.</p><button onClick={()=>window.location.reload()}>Retry opening</button></div>}</>;
}
