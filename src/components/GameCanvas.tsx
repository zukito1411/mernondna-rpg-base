import { useEffect, useRef } from 'react';
import { createMernondnaGame } from '../game/MernondnaGame';
import type Phaser from 'phaser';

declare global { interface Window { __mernondnaGame?: Phaser.Game } }

export function GameCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const game = createMernondnaGame(ref.current);
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('e2e')) window.__mernondnaGame = game;
    return () => { if (window.__mernondnaGame === game) delete window.__mernondnaGame; game.destroy(true); };
  }, []);

  return <div ref={ref} className="game-canvas" aria-label="Mernodna game world" />;
}
