import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { GameIcon } from './GameIcon';
import { REGIONS, REGION_BY_ID } from '../data/regions';
import { TOWNS, TOWN_BY_ID } from '../data/towns';
import { useGameStore } from '../store/gameStore';
import { localSettlementTravelEnabled } from '../utils/localSettlementTravel';
import { RegionalMap, REGIONAL_SPAN_X, REGIONAL_SPAN_Y } from './RegionalMap';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/world';
import { worldToAtlas } from '../game/systems/worldMapProjection';
import {housingFor} from '../data/housing';
import {PLAYER_HOMES} from '../data/playerHomes';
import {TOWER_DOOR,towerCampaignComplete} from '../data/towerOfMight';

const REGIONAL_ASPECT = 900 / 540;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

type Point = { x: number; y: number };
type DragState = { pointerId: number; startX: number; startY: number; x: number; y: number; lastX: number; lastY: number; lastUpdate: number };

export function MapPanel() {
  const panel = useGameStore(s => s.panel);
  const towerVisible=useGameStore(s=>towerCampaignComplete(s.quests));
  const housing=useGameStore(s=>s.housing),homes=PLAYER_HOMES.filter(h=>housingFor(housing,h.id).owned);
  const close = useGameStore(s => s.closePanel);
  const townId = useGameStore(s => s.townId);
  const x = useGameStore(s => s.worldX);
  const y = useGameStore(s => s.worldY);
  const open = useGameStore(s => s.openPanel);
  const unlockedShrines = useGameStore(s => s.unlockedTownShrines);
  const teleport = useGameStore(s => s.requestMapTravel);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [regionalCenter, setRegionalCenter] = useState<Point>({ x, y });
  const [regionalDragging, setRegionalDragging] = useState(false);
  const [viewport, setViewport] = useState<Point>({ x: 0, y: 0 });
  const [atlasAspect, setAtlasAspect] = useState(4 / 3);
  const selectedPin = useRef<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<DragState | null>(null);
  const localTravel = localSettlementTravelEnabled();

  useEffect(() => {
    setSelectedId(null);
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setRegionalCenter({ x: useGameStore.getState().worldX, y: useGameStore.getState().worldY });
    setRegionalDragging(false);
    dragging.current = null;
  }, [panel]);

  useEffect(() => {
    if (panel !== 'map' && panel !== 'regional-map') return;
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      setViewport(previous => previous.x === width && previous.y === height
        ? previous : { x: width, y: height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [panel]);

  const selected = selectedId ? TOWN_BY_ID[selectedId] : undefined;
  const canTeleport = Boolean(selected && (localTravel || unlockedShrines.includes(selected.id)));
  const closePrompt = () => { setSelectedId(null); selectedPin.current?.focus(); };

  const regional = panel === 'regional-map';
  const aspect = regional ? REGIONAL_ASPECT : atlasAspect;
  const fitWidth = Math.max(0, Math.min(viewport.x, viewport.y * aspect));
  const fitHeight = aspect ? fitWidth / aspect : 0;
  const drawnWidth = fitWidth * zoom;
  const drawnHeight = fitHeight * zoom;
  const maxPanX = Math.max(0, (drawnWidth - viewport.x) / 2);
  const maxPanY = Math.max(0, (drawnHeight - viewport.y) / 2);
  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
  const visualPanX = clamp(pan.x, maxPanX);
  const visualPanY = clamp(pan.y, maxPanY);

  const changeZoom = (delta: number) => {
    setZoom(value => Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value + delta)) * 4) / 4);
    // Reset to center after each zoom step. This also prevents off-screen pins.
    setPan({ x: 0, y: 0 });
  };
  const resetView = () => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    if (regional) setRegionalCenter({ x: useGameStore.getState().worldX, y: useGameStore.getState().worldY });
  };

  // World atlas: pan its zoomed picture. Regional survey: move the survey's
  // sampling center in world coordinates, including when the map is at 100%.
  const moveRegionalCenter = (dx: number, dy: number) => {
    if (!drawnWidth || !drawnHeight) return;
    const halfX = REGIONAL_SPAN_X / (2 * zoom);
    const halfY = REGIONAL_SPAN_Y / (2 * zoom);
    setRegionalCenter(previous => ({
      x: Math.max(halfX, Math.min(WORLD_WIDTH - halfX, previous.x - dx * REGIONAL_SPAN_X / drawnWidth)),
      y: Math.max(halfY, Math.min(WORLD_HEIGHT - halfY, previous.y - dy * REGIONAL_SPAN_Y / drawnHeight)),
    }));
  };

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((!regional && zoom <= MIN_ZOOM) || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    dragging.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: visualPanX, y: visualPanY, lastX: event.clientX, lastY: event.clientY,
      lastUpdate: event.timeStamp,
    };
    if (regional) setRegionalDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragging.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (regional) {
      // Rebuild the terrain canvas no more than ~8 times per second while dragging.
      // The final remainder is always applied in endPan for precise positioning.
      if (event.timeStamp - drag.lastUpdate < 120) return;
      moveRegionalCenter(event.clientX - drag.lastX, event.clientY - drag.lastY);
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastUpdate = event.timeStamp;
    } else {
      setPan({
        x: clamp(drag.x + event.clientX - drag.startX, maxPanX),
        y: clamp(drag.y + event.clientY - drag.startY, maxPanY),
      });
    }
  };
  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragging.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (regional) {
      moveRegionalCenter(event.clientX - drag.lastX, event.clientY - drag.lastY);
      setRegionalDragging(false);
    }
    dragging.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (panel !== 'map' && panel !== 'regional-map') return null;
  const playerPin = worldToAtlas({ x, y });
  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label={regional ? 'Expanded regional minimap' : 'Mernodna world map'}>
      <section className="panel map-panel">
        <header>
          <div><h2>{regional ? 'Regional survey' : 'Mernodna'}</h2>
            <p>{localTravel ? 'Select a settlement to explore.' : `${unlockedShrines.length} shrines attuned · choose a destination.`}</p>
          </div>
          <div className="map-header-actions">
            <button type="button" onClick={() => open(regional ? 'map' : 'regional-map')}><GameIcon name="map" />{regional ? 'World Map' : 'Regional Map'}</button>
            <button type="button" onClick={close}><GameIcon name="close" />Close</button>
          </div>
        </header>
        <div className="atlas-zoom-controls" role="group" aria-label="Map zoom">
          <button type="button" aria-label="Zoom out" onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM}><GameIcon name="zoom-out" /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM}><GameIcon name="zoom-in" /></button>
          <button type="button" onClick={resetView}>{regional ? 'My location' : 'Fit map'}</button>
          <small className="map-help">{regional ? 'Drag to survey nearby roads and regions.' : 'Zoom in, then drag to explore.'}</small>
        </div>
        <div className="map-stage">
          <div className={`map-viewport ${regional || zoom > 1 ? 'is-zoomed' : ''}`} ref={viewportRef}
            onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
            <div className="map-surface" style={{
              width: `${drawnWidth}px`, height: `${drawnHeight}px`,
              transform: `translate(calc(-50% + ${visualPanX}px), calc(-50% + ${visualPanY}px))`,
            }}>
              {regional ? <RegionalMap center={regionalCenter} coarse={regionalDragging}
                select={(id, button) => { selectedPin.current = button; setSelectedId(id); }} /> :
                <div className="world-map-wrap">
                  <div className="atlas-survey">
                    <img src="assets/reference/mernondna-world-map.jpg" alt="Illustrated map of Mernodna" draggable={false}
                      onLoad={event => {
                        const image = event.currentTarget;
                        if (image.naturalWidth && image.naturalHeight) setAtlasAspect(image.naturalWidth / image.naturalHeight);
                      }} />
                    {TOWNS.map(town => (
                      <button type="button" key={town.id}
                        className={`map-marker ${town.id === townId ? 'current' : ''} ${unlockedShrines.includes(town.id) ? 'attuned' : ''} ${localTravel || unlockedShrines.includes(town.id) ? 'available' : 'locked'}`}
                        style={{ left: `${worldToAtlas(town.world).x}%`, top: `${worldToAtlas(town.world).y}%` }}
                        title={`${town.name} — ${town.description}`}
                        aria-label={`Select ${town.name} for teleport`} aria-haspopup="dialog"
                        onClick={event => { selectedPin.current = event.currentTarget; setSelectedId(town.id); }}>
                        <i aria-hidden="true" />
                      </button>
                    ))}
                    {homes.map(home=><span key={home.id} className="owned-home-pin" role="img" aria-label={home.homeName} style={{left:worldToAtlas(home.door).x+'%',top:worldToAtlas(home.door).y+'%'}}>⌂</span>)}
                    {towerVisible&&<span className="owned-home-pin" role="img" aria-label="Tower of Might, north of Oakmere" title="Tower of Might" style={{left:worldToAtlas(TOWER_DOOR).x+'%',top:worldToAtlas(TOWER_DOOR).y+'%',color:'#92d4ff'}}>♜</span>}
                    <span className="atlas-player" style={{ left: `${playerPin.x}%`, top: `${playerPin.y}%` }} title="Leigneron's current position">▲</span>
                  </div>
                </div>}
            </div>
          </div>
          <aside className="map-sidebar" aria-label="Map destinations">
            <div className="map-sidebar-heading"><strong>Destinations</strong><span>{unlockedShrines.length} shrines attuned</span></div>
            {homes.map(home=><p key={home.id} className="owned-home-label">⌂ {home.homeName} · {home.name}</p>)}
              {towerVisible&&<p className="owned-home-label">♜ Tower of Might · north of Oakmere, Trandum</p>}
              <div className="map-destination-grid">
              {TOWNS.map(town => <button type="button" key={town.id} className={town.id === townId ? 'is-current' : ''}
                onClick={event => { selectedPin.current = event.currentTarget; setSelectedId(town.id); }}>
                <span><strong>{town.name}</strong><small>{town.regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[town.regionId]?.name}</small></span>
                <span className="destination-state">{town.id === townId ? 'Here' : localTravel || unlockedShrines.includes(town.id) ? 'Ready' : 'Locked'}</span>
              </button>)}
            </div>
            <details className="map-region-details"><summary>Realm guide</summary>
              <div className="region-strip">{REGIONS.map(region => <span key={region.id}><strong>{region.name}</strong>{region.people} · {region.climate}</span>)}</div>
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
          {['darkav', 'frostlands', 'portquill'].includes(selected.regionId) &&
            <p>For a first visit, board at Highmere River Quay. Darkav's boat lands at Ashen Landing; follow the ash road north to Blackspire.</p>}
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
