import { useGameStore } from '../store/gameStore';
export function CinematicPanel() {
  const cinematic=useGameStore(s=>s.cinematic),skip=useGameStore(s=>s.requestCinematicSkip);
  if(!cinematic)return null;
  return <section className="cinematic-presentation" aria-label="Story scene">
    <div className="cinematic-top"><span>{cinematic.title}</span><button onClick={skip}>Skip scene · Esc</button></div>
    <div className="cinematic-caption" role="status">{cinematic.line}</div>
  </section>;
}
