import { useGameStore } from '../store/gameStore';
import { compassDirection, questBearing } from '../game/systems/questNavigation';
import { TILE_SIZE } from '../data/world';

export function QuestCompass() {
  const target = useGameStore(s => s.navigation.target);
  const x = useGameStore(s => s.worldX), y = useGameStore(s => s.worldY);
  if (!target) return null;
  const distance = Math.hypot(target.x - x,target.y - y), bearing = questBearing({ x,y },target);
  return (
    <div className="quest-guidance" data-objective={target.objectiveId} aria-label={`Quest destination: ${target.label}`}>
      <svg className="compass-arrow" viewBox="0 0 32 32" aria-hidden="true" style={{ transform: `rotate(${bearing}rad)` }}>
        <path d="M16 3 26 26 16 21 6 26Z" />
      </svg>
      <div><span className="quest-destination">{target.label}</span><small>{distance < 72 ? 'Nearby' : `${compassDirection(bearing)} · ${Math.max(1,Math.round(distance / TILE_SIZE))} paces`}</small></div>
    </div>
  );
}
