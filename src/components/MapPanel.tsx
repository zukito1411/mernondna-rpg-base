import { REGIONS } from '../data/regions';
import { TOWNS } from '../data/towns';
import { useGameStore } from '../store/gameStore';

export function MapPanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const townId = useGameStore((s) => s.townId);
  if (panel !== 'map') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Mernodna world map">
      <section className="panel map-panel">
        <header><div><h2>Mernodna</h2><p>Realm and settlement atlas</p></div><button type="button" onClick={close}>Close</button></header>
        <div className="world-map-wrap">
          <img src="assets/reference/mernondna-world-map.jpg" alt="Illustrated map of Mernodna" />
          {TOWNS.map((town) => (
            <span
              className={`map-marker ${town.id === townId ? 'current' : ''}`}
              style={{ left: `${town.mapPercent.x}%`, top: `${town.mapPercent.y}%` }}
              title={`${town.name} — ${town.description}`}
              key={town.id}
            >
              <i />
              <b>{town.starterKnown || town.id === townId ? town.name : 'Unknown'}</b>
            </span>
          ))}
        </div>
        <div className="region-strip">
          {REGIONS.map((region) => <span key={region.id}><strong>{region.name}</strong>{region.people} · {region.climate}</span>)}
        </div>
      </section>
    </div>
  );
}
