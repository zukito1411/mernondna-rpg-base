import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface HomeMenuProps {
  canContinue: boolean;
  message: string | null;
  onContinue: () => void;
  onNewGame: () => void;
}

export function HomeMenu({ canContinue, message, onContinue, onNewGame }: HomeMenuProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const ambience = useGameStore(state => state.weatherAudio);

  const toggleAmbience = () => {
    useGameStore.getState().hydrate({ weatherAudio: !ambience });
    window.dispatchEvent(new Event('mernondna-weather-audio'));
  };

  return (
    <section className="home-menu" aria-label="Main menu">
      <div className="home-menu-shade" />
      <div className="home-menu-actions">
        <button type="button" className="home-menu-button primary" disabled={!canContinue} onClick={onContinue}>Continue</button>
        <button type="button" className="home-menu-button" onClick={onNewGame}>Start New Game</button>
        <button type="button" className="home-menu-button" onClick={() => setOptionsOpen(true)}>Options</button>
        {message && <p className="home-menu-message" role="status">{message}</p>}
      </div>

      {optionsOpen && (
        <div className="home-options-backdrop" role="presentation" onPointerDown={event => {
          if (event.target === event.currentTarget) setOptionsOpen(false);
        }}>
          <section className="home-options" role="dialog" aria-modal="true" aria-labelledby="home-options-title">
            <header>
              <h2 id="home-options-title">Options</h2>
              <button type="button" aria-label="Close options" onClick={() => setOptionsOpen(false)}>×</button>
            </header>
            <button type="button" className="home-option-toggle" aria-pressed={ambience} onClick={toggleAmbience}>
              <span>World ambience</span><strong>{ambience ? 'On' : 'Off'}</strong>
            </button>
            <p>Adjust the game’s ambient weather audio.</p>
          </section>
        </div>
      )}
    </section>
  );
}
