import { useEffect } from 'react';
import { DialoguePanel } from './components/DialoguePanel';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { InventoryPanel } from './components/InventoryPanel';
import { MapPanel } from './components/MapPanel';
import { MobileControls } from './components/MobileControls';
import { PausePanel } from './components/PausePanel';
import { Toast } from './components/Toast';
import { mobileInput } from './game/input';
import { saveGame, watchProgressSaves } from './utils/save';

export default function App() {
  useEffect(() => {
    const interval = window.setInterval(saveGame, 12000);
    const unsubscribe = watchProgressSaves();
    const onPageHide = () => { mobileInput.reset(); saveGame(); };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        mobileInput.reset();
        saveGame();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onPageHide);
    return () => {
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <main className="game-shell">
      <GameCanvas />
      <HUD />
      <MobileControls />
      <DialoguePanel />
      <MapPanel />
      <InventoryPanel />
      <PausePanel />
      <Toast />
    </main>
  );
}
