import { useEffect, useRef, useState } from 'react';
import { GameIcon } from './GameIcon';
import { REGIONS, REGION_BY_ID } from '../data/regions';
import { TOWNS, TOWN_BY_ID } from '../data/towns';
import { useGameStore } from '../store/gameStore';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';
import { RegionalMap } from './RegionalMap';
import { worldToAtlas } from '../game/systems/worldMapProjection';

export function MapPanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const townId = useGameStore((s) => s.townId);
  const x=useGameStore(s=>s.worldX),y=useGameStore(s=>s.worldY),open=useGameStore(s=>s.openPanel);
  const unlockedShrines = useGameStore(s => s.unlockedTownShrines);
  const teleport = useGameStore(s => s.requestMapTravel);
  const [selectedId,setSelectedId] = useState<string | null>(null);
  const [zoom,setZoom]=useState(1);
  const selectedPin = useRef<HTMLButtonElement | null>(null);
  const localTravel = localSettlementTravelEnabled();
  useEffect(() => { setSelectedId(null); },[panel]);
  const selected = selectedId ? TOWN_BY_ID[selectedId] : undefined;
  const canTeleport = Boolean(selected && (localTravel || unlockedShrines.includes(selected.id)));
  const closePrompt = () => { setSelectedId(null); selectedPin.current?.focus(); };
  if (panel !== 'map'&&panel!=='regional-map') return null;
  const regional=panel==='regional-map',playerPin=worldToAtlas({x,y});

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label={regional?'Expanded regional minimap':'Mernodna world map'}>
      <section className="panel map-panel">
        <header><div><h2>{regional?'Regional survey':'Mernodna'}</h2><p>{localTravel ? 'Select a settlement to explore.' : `${unlockedShrines.length} shrines attuned · choose a destination.`}</p></div>
          <div className="map-header-actions">
            <button type="button" onClick={()=>open(regional?'map':'regional-map')}><GameIcon name="map" />{regional?'World Map':'Regional Map'}</button>
            <button type="button" onClick={close}><GameIcon name="close" />Close</button>
          </div>
        </header>
        {!regional&&<div className="atlas-zoom-controls" role="group" aria-label="Map zoom">
          <button type="button" aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(1,z-.25))} disabled={zoom<=1}><GameIcon name="zoom-out" /></button>
          <span>{Math.round(zoom*100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(3,z+.25))} disabled={zoom>=3}><GameIcon name="zoom-in" /></button>
          <button type="button" onClick={()=>setZoom(1)}>Reset</button>
        </div>
        <div className="map-stage">{regional?<RegionalMap select={(id,button)=>{selectedPin.current=button;setSelectedId(id);}}/>:<div className="world-map-wrap"><div className="atlas-survey" style={{height:zoom*100+'%'}}>
          <img src="assets/reference/mernondna-world-map.jpg" alt="Illustrated map of Mernodna" />
          {TOWNS.map((town) => (
            <button
              type="button"
              className={`map-marker ${town.id === townId ? 'current' : ''} ${unlockedShrines.includes(town.id) ? 'attuned' : ''} ${localTravel || unlockedShrines.includes(town.id) ? 'available' : 'locked'}`}
              style={{ left: `${worldToAtlas(town.world).x}%`, top: `${worldToAtlas(town.world).y}%` }}
              title={`${town.name} — ${town.description}`}
              aria-label={`Select ${town.name} for teleport`}
              aria-haspopup="dialog"
              onClick={event => { selectedPin.current = event.currentTarget; setSelectedId(town.id); }}
              key={town.id}
            >
              <i aria-hidden="true" />
            </button>
          ))}
          <span className="atlas-player" style={{left:playerPin.x+'%',top:playerPin.y+'%'}} title="Leigneron’s current world position">▲</span>
        </div></div>}
          <aside className="map-sidebar" aria-label="Map destinations">
            <div className="map-sidebar-heading"><strong>Destinations</strong><span>{unlockedShrines.length} shrines attuned</span></div>
            <div className="map-destination-grid">
              {TOWNS.map(town => <button type="button" key={town.id} className={town.id===townId ? 'is-current' : ''} onClick={event => {selectedPin.current=event.currentTarget;setSelectedId(town.id);}}>
                <span><strong>{town.name}</strong><small>{town.regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[town.regionId]?.name}</small></span>
                <span className="destination-state">{town.id===townId?'Here':localTravel||unlockedShrines.includes(town.id)?'Ready':'Locked'}</span>
              </button>)}
            </div>
            <details className="map-region-details">
              <summary>Realm guide</summary>
              <div className="region-strip">{REGIONS.map(region=><span key={region.id}><strong>{region.name}</strong>{region.people} · {region.climate}</span>)}</div>
            </details>
          </aside>
        </div>
      </section>
      {selected && <div className="map-travel-prompt" role="alertdialog" aria-modal="true"
        aria-labelledby="map-travel-title" aria-describedby="map-travel-description"
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closePrompt(); } }}>
        <section className="map-travel-card">
          <h3 id="map-travel-title">Teleport to {selected.name}?</h3>
          <small>{selected.regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[selected.regionId]?.name} · {selected.kind}</small>
          <p>{selected.description}</p>
          {['darkav','frostlands','portquill'].includes(selected.regionId)&&<p>For a first visit, board at Highmere River Quay. Darkav’s boat lands at Ashen Landing; follow the ash road north to Blackspire.</p>}
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
