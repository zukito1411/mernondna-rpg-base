import { saveGame, setSaveSnapshotProvider,allowExplicitNewGame,getSaveRecoveryNotice } from '../utils/save';
import { useGameStore } from '../store/gameStore';

export function PausePanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const reset = useGameStore((s) => s.resetGame);
  const showToast = useGameStore((s) => s.showToast);
  const ambience=useGameStore(s=>s.weatherAudio);
  const recovery=getSaveRecoveryNotice();
  if (panel !== 'pause') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Game menu">
      <section className="panel pause-panel">
        <header><div><h2>Mernodna</h2><p>Base game v0.1 · PC + touch controls</p></div><button type="button" onClick={close}>Resume</button></header>
        <div className="menu-actions">
          <button type="button" onClick={()=>{useGameStore.getState().hydrate({weatherAudio:!ambience});window.dispatchEvent(new Event('mernondna-weather-audio'));}}>World sounds: {ambience?'on':'off'}</button>
          <button type="button" onClick={() => { const saved = saveGame(); showToast(saved ? 'Game saved locally.' : 'Saving is unavailable. Check browser storage.'); close(); }}>Save game</button>
          <button type="button" onClick={() => { if(!window.confirm('Start a new game? Your current progress will be replaced.'))return;setSaveSnapshotProvider();allowExplicitNewGame();reset(); saveGame(); window.location.reload(); }}>Start new game</button>
        </div>
        {recovery&&<p className="menu-note" role="status">{recovery}</p>}
        <p className="menu-note">Regional background music continues while this menu is open. Desktop: WASD, Shift, Q, Space, E, M, I, C. Mobile: virtual joystick plus Attack, Dash and Interact buttons. Spend level-up status and skill points in Status.</p>
      </section>
    </div>
  );
}
