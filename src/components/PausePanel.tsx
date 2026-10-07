import { saveGame, setSaveSnapshotProvider } from '../utils/save';
import { useGameStore } from '../store/gameStore';

export function PausePanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const reset = useGameStore((s) => s.resetGame);
  const showToast = useGameStore((s) => s.showToast);
  if (panel !== 'pause') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Game menu">
      <section className="panel pause-panel">
        <header><div><h2>Mernodna</h2><p>Base game v0.1 · PC + touch controls</p></div><button type="button" onClick={close}>Resume</button></header>
        <div className="menu-actions">
          <button type="button" onClick={() => { const saved = saveGame(); showToast(saved ? 'Game saved locally.' : 'Saving is unavailable. Check browser storage.'); close(); }}>Save game</button>
          <button type="button" onClick={() => { setSaveSnapshotProvider(); reset(); saveGame(); window.location.reload(); }}>Start new game</button>
        </div>
        <p className="menu-note">Desktop: WASD, Shift, Q, Space, E, M, I. Mobile: virtual joystick plus Attack, Dash and Interact buttons.</p>
      </section>
    </div>
  );
}
