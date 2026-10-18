import { memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { compassDirection, questBearing } from '../game/systems/questNavigation';
import { TILE_SIZE } from '../data/world';

export const QuestCompass = memo(function QuestCompass() {
  const target = useGameStore(s => s.navigation.target);
  const position=useGameStore(s=>s.navigation.playerPosition);
  const worldX = useGameStore(s => s.worldX), worldY = useGameStore(s => s.worldY);
  const openPanel=useGameStore(s=>s.openPanel);
  const x=position?.x??worldX,y=position?.y??worldY;
  if (!target) return null;
  const approach=target;
  const distance = Math.hypot(approach.x - x,approach.y - y), bearing = questBearing({ x,y },approach);
  return (
    <div className="quest-guidance" data-objective={target.objectiveId} role="button" tabIndex={0}
      title="Open the journal for the full destination and travel directions"
      aria-label={`Open quest directions: ${target.label}`} onClick={()=>openPanel('journal')}
      onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openPanel('journal');}}}>
      <svg className="compass-arrow" viewBox="0 0 32 32" aria-hidden="true" style={{ transform: `rotate(${bearing}rad)`, visibility:distance<=10?'hidden':'visible' }}>
        <path d="M16 3 26 26 16 21 6 26Z" />
      </svg>
      <div><span className="quest-destination">{target.label}</span>
        <small className="quest-next-step">{target.travelHint??'Go directly toward the marked destination'}</small>
        <small className="quest-step-distance">{distance < 72 ? 'Destination nearby'
          : `${compassDirection(bearing)} · ${Math.max(1,Math.round(distance / TILE_SIZE))} paces to destination`}</small>
      </div>
    </div>
  );
});
