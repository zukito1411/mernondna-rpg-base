import { TOWNS } from '../data/towns';
import { REGION_BY_ID } from '../data/regions';
import { useGameStore } from '../store/gameStore';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';

export function ShrineTravelPanel() {
  const panel = useGameStore(s => s.panel);
  const origin = useGameStore(s => s.travelOriginTownId);
  const unlocked = useGameStore(s => s.unlockedTownShrines);
  const travel = useGameStore(s => s.requestShrineTravel);
  const close = useGameStore(s => s.closePanel);
  const localTravel = localSettlementTravelEnabled();
  if (panel !== 'travel') return null;
  return <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Shrine travel">
    <section className="panel shrine-travel-panel">
      <header><div><h2>Shrine travel</h2><p>Interact with a settlement shrine to attune it. Attuned shrines stay unlocked.</p></div>
        <button type="button" onClick={close}>Close</button></header>
      <div className="shrine-destinations">
        {TOWNS.map(town => {
          const attuned = unlocked.includes(town.id), available = attuned || localTravel, current = town.id === origin;
          return <button type="button" key={town.id} disabled={!available || current} onClick={() => travel(town.id)}>
            <span><strong>{town.name}</strong><small>{town.regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[town.regionId]?.name} · {town.kind}</small></span>
            <span>{current ? 'You are here' : available ? 'Travel' : 'Visit shrine to unlock'}</span>
          </button>;
        })}
      </div>
    </section>
  </div>;
}
