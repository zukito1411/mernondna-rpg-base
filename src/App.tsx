import { useEffect, useState } from 'react';
import { DialoguePanel } from './components/DialoguePanel';
import { CharacterPanel } from './components/CharacterPanel';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { InventoryPanel } from './components/InventoryPanel';
import { MapPanel } from './components/MapPanel';
import { MobileControls } from './components/MobileControls';
import { PausePanel } from './components/PausePanel';
import { Toast } from './components/Toast';
import { ShrineTravelPanel } from './components/ShrineTravelPanel';
import { QuestJournal } from './components/QuestJournal';
import { CinematicPanel } from './components/CinematicPanel';
import { HomeMenu } from './components/HomeMenu';
import { mobileInput } from './game/input';
import { useGameStore } from './store/gameStore';
import { allowExplicitNewGame, getSaveRecoveryNotice, hasSavedGame, hasStoredSave, loadGame, saveGame, watchProgressSaves } from './utils/save';

export default function App() {
  const [playing, setPlaying] = useState(false);
  const [canContinue, setCanContinue] = useState(hasSavedGame);
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const resetGame = useGameStore(state => state.resetGame);

  useEffect(() => {
    if (!playing) return;
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
  }, [playing]);

  const continueGame = () => {
    if (loadGame()) {
      setMenuMessage(null);
      setPlaying(true);
      return;
    }
    setCanContinue(hasSavedGame());
    setMenuMessage(getSaveRecoveryNotice() ?? 'No saved game is available to continue.');
  };

  const startNewGame = () => {
    const saved = hasStoredSave();
    if (saved && !window.confirm('Start a new game? Your current progress will be replaced.')) return;
    if (saved) loadGame();
    const ambience = useGameStore.getState().weatherAudio;
    allowExplicitNewGame();
    resetGame();
    useGameStore.getState().hydrate({ weatherAudio: ambience });
    if (!saveGame()) setMenuMessage('The new game started, but could not be saved on this device.');
    else setMenuMessage(null);
    setCanContinue(true);
    setPlaying(true);
  };

  return (
    <main className="game-shell">
      {playing ? <>
        <GameCanvas />
        <HUD />
        <MobileControls />
        <DialoguePanel />
        <MapPanel />
        <InventoryPanel />
        <CharacterPanel />
        <PausePanel />
        <ShrineTravelPanel />
        <QuestJournal />
        <CinematicPanel />
        <Toast />
      </> : <HomeMenu canContinue={canContinue} message={menuMessage} onContinue={continueGame} onNewGame={startNewGame} />}
    </main>
  );
}
