import { useEffect, useRef, useState } from 'react';
import { REGIONS, REGION_BY_ID } from '../data/regions';
import { TOWNS, TOWN_BY_ID } from '../data/towns';
import { useGameStore } from '../store/gameStore';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';

export function MapPanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const townId = useGameStore((s) => s.townId);
  const unlockedShrines = useGameStore(s => s.unlockedTownShrines);
  const teleport = useGameStore(s => s.requestMapTravel);
  const [selectedId,setSelectedId] = useState<string | null>(null);
  const selectedPin = useRef<HTMLButtonElement | null>(null);
  const localTravel = localSettlementTravelEnabled();
  useEffect(() => { if (panel !== 'map') setSelectedId(null); },[panel]);
  const selected = selectedId ? TOWN_BY_ID[selectedId] : undefined;
  const canTeleport = Boolean(selected && (localTravel || unlockedShrines.includes(selected.id)));
  const closePrompt = () => { setSelectedId(null); selectedPin.current?.focus(); };
  if (panel !== 'map') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Mernodna world map">
      <section className="panel map-panel">
        <header><div><h2>Mernodna</h2><p>{localTravel ? 'Local exploration: click any settlement pin to teleport.'
          : `Click a settlement pin to teleport · ${unlockedShrines.length} shrines attuned.`}</p></div><button type="button" onClick={close}>Close</button></header>
        <div className="world-map-wrap">
          <img src="assets/reference/mernondna-world-map.jpg" alt="Illustrated map of Mernodna" />
          {TOWNS.map((town) => (
            <button
              type="button"
              className={`map-marker ${town.id === townId ? 'current' : ''} ${unlockedShrines.includes(town.id) ? 'attuned' : ''} ${localTravel || unlockedShrines.includes(town.id) ? 'available' : 'locked'}`}
              style={{ left: `${town.mapPercent.x}%`, top: `${town.mapPercent.y}%` }}
              title={`${town.name} — ${town.description}`}
              aria-label={`Select ${town.name} for teleport`}
              aria-haspopup="dialog"
              onClick={event => { selectedPin.current = event.currentTarget; setSelectedId(town.id); }}
              key={town.id}
            >
              <i aria-hidden="true" />
              <b>{localTravel || unlockedShrines.includes(town.id) || town.starterKnown || town.id === townId ? town.name : 'Unknown'}</b>
            </button>
          ))}
        </div>
        <details className="map-settlement-list">
          <summary>Settlement destinations</summary>
          <div>{TOWNS.map(town => <button type="button" key={town.id}
            onClick={event => { selectedPin.current = event.currentTarget; setSelectedId(town.id); }}>
            <strong>{town.name}</strong>
            <small>{localTravel || unlockedShrines.includes(town.id) ? 'Teleport available' : 'Shrine locked'}</small>
          </button>)}</div>
        </details>
        <div className="region-strip">
          {REGIONS.map((region) => <span key={region.id}><strong>{region.name}</strong>{region.people} · {region.climate}</span>)}
        </div>
      </section>
      {selected && <div className="map-travel-prompt" role="alertdialog" aria-modal="true"
        aria-labelledby="map-travel-title" aria-describedby="map-travel-description"
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closePrompt(); } }}>
        <section className="map-travel-card">
          <h3 id="map-travel-title">Teleport to {selected.name}?</h3>
          <small>{selected.regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[selected.regionId]?.name} · {selected.kind}</small>
          <p>{selected.description}</p>
          <p id="map-travel-description">{canTeleport
            ? localTravel && !unlockedShrines.includes(selected.id)
              ? 'Available for local exploration. This trip does not unlock the shrine.'
              : 'You will arrive beside this settlement’s unlocked shrine.'
            : 'Reach this settlement and interact with its shrine to unlock teleporting here.'}</p>
          <div className="map-travel-actions">
            <button type="button" onClick={closePrompt} autoFocus={!canTeleport}>Cancel</button>
            <button type="button" disabled={!canTeleport} autoFocus={canTeleport} onClick={() => teleport(selected.id)}>Teleport</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
