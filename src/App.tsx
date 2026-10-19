import { useEffect, useState } from 'react';
import { SafeDialoguePanel } from './components/DialoguePanel';
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
import { LoreJournal } from './components/LoreJournal';
import { CinematicPanel } from './components/CinematicPanel';
import { HomeMenu } from './components/HomeMenu';
import {HarborPanel} from './components/HarborPanel';
import { mobileInput } from './game/input';
import { useGameStore } from './store/gameStore';
import {installUiInputGuard,noteUiTransition} from './utils/uiInputGuard';
import {dismissStartupSplash} from './utils/startupSplash';
import { allowExplicitNewGame, getSaveRecoveryNotice, hasSavedGame, hasStoredSave, loadGame, saveGame, watchProgressSaves } from './utils/save';
import {RareLootPopup} from './components/RareLootPopup';
import {LevelUpNotice} from './components/LevelUpNotice';
import {ContractBoard} from './components/ContractBoard';

export default function App() {
  const [playing, setPlaying] = useState(false);
  // Continue must not write a checkpoint until Phaser has a playable world.
  const [worldReady, setWorldReady] = useState(false);
  const [canContinue, setCanContinue] = useState(hasSavedGame);
  const [menuMessage, setMenuMessage] = useState<string | null>(null);
  const resetGame = useGameStore(state => state.resetGame);

  useEffect(dismissStartupSplash,[]);

  useEffect(()=>{
    const dispose=installUiInputGuard(()=>{
      const s=useGameStore.getState();return Boolean(s.panel||s.dialogue||s.cinematic);
    });
    const unsubscribe=useGameStore.subscribe((next,previous)=>{
      if(next.panel!==previous.panel||next.dialogue!==previous.dialogue||Boolean(next.cinematic)!==Boolean(previous.cinematic)){
        noteUiTransition();mobileInput.reset();
      }
    });
    return ()=>{unsubscribe();dispose();};
  },[]);

  useEffect(() => {
    if (!playing || !worldReady) return;
    // Periodic autosave, plus progress-triggered saves and a checkpoint
    // whenever the player opens the pause menu.
    const interval = window.setInterval(saveGame, 12000);
    const unsubscribe = watchProgressSaves();
    const unsubscribePause = useGameStore.subscribe((next,previous)=>{
      if(next.panel==='pause'&&previous.panel!=='pause')saveGame();
    });
    const onPageHide = () => { mobileInput.reset(); saveGame(); };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        mobileInput.reset();
        saveGame();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('freeze',onPageHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onPageHide);
    return () => {
      window.clearInterval(interval);
      unsubscribe();
      unsubscribePause();
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('freeze',onPageHide);
    };
  }, [playing, worldReady]);

  const continueGame = () => {
    if (loadGame()) {
      setMenuMessage(null);
      setWorldReady(false);
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
    setWorldReady(false);
    setPlaying(true);
  };

  return (
    <main className="game-shell" onPointerDown={event=>{
      if(event.target instanceof Element&&event.target.closest('.overlay-backdrop,.dialogue-wrap,.cinematic-presentation'))event.stopPropagation();
    }} onPointerUp={event=>{
      if(event.target instanceof Element&&event.target.closest('.overlay-backdrop,.dialogue-wrap,.cinematic-presentation'))event.stopPropagation();
    }} onKeyDown={event=>{
      if(event.key!=='Escape'&&event.target instanceof Element&&event.target.closest('.overlay-backdrop,.dialogue-wrap,.cinematic-presentation')
        &&event.target.closest('button,input,select,textarea'))event.stopPropagation();
    }} onClick={event=>{
      if(event.target instanceof Element&&event.target.closest('.overlay-backdrop,.dialogue-wrap,.cinematic-presentation'))event.stopPropagation();
    }}>
      {playing ? <>
        <GameCanvas onReady={() => setWorldReady(true)} onExit={() => {
          // Unmount Phaser without saving a partially initialized world.
          setWorldReady(false);
          setPlaying(false);
          setCanContinue(hasSavedGame());
        }} />
        <HUD />
        <MobileControls />
        <SafeDialoguePanel />
        <MapPanel />
        <InventoryPanel />
        <CharacterPanel />
        <PausePanel />
        <ShrineTravelPanel />
        <QuestJournal />
        <LoreJournal />
        <HarborPanel />
        <CinematicPanel />
        <Toast />
        <RareLootPopup />
        <LevelUpNotice />
        <ContractBoard />
      </> : <HomeMenu canContinue={canContinue} message={menuMessage} onContinue={continueGame} onNewGame={startNewGame} />}
    </main>
  );
}
