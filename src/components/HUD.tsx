import { REGION_BY_ID } from '../data/regions';
import { TOWN_BY_ID } from '../data/towns';
import { useGameStore } from '../store/gameStore';
import { activeObjective } from '../game/systems/questNavigation';
import { MiniMap } from './MiniMap';
import { QuestCompass } from './QuestCompass';

function barPercent(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
}

export function HUD() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const stamina = useGameStore((s) => s.stamina);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const level = useGameStore((s) => s.level);
  const gold = useGameStore((s) => s.gold);
  const regionId = useGameStore((s) => s.regionId);
  const townId = useGameStore((s) => s.townId);
  const day = useGameStore((s) => s.day);
  const minute = useGameStore((s) => s.minuteOfDay);
  const quests = useGameStore((s) => s.quests);
  const openPanel = useGameStore((s) => s.openPanel);
  const interaction = useGameStore(s => s.navigation.interaction);
  const blocked = useGameStore(s => Boolean(s.panel || s.dialogue));

  const active = activeObjective(quests);

  const hour = Math.floor(minute / 60);
  const mins = Math.floor(minute % 60);
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const regionName = regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[regionId]?.name ?? regionId;
  const location = townId ? TOWN_BY_ID[townId]?.name ?? regionName : regionName;

  return (
    <div className="hud-layer" aria-live="polite">
      <section className="status-card">
        <div className="status-title"><strong>Leigneron</strong><span>Lv. {level}</span></div>
        <div className="meter"><div className="meter-fill hp" style={{ width: barPercent(hp, maxHp) }} /></div>
        <div className="meter"><div className="meter-fill stamina" style={{ width: barPercent(stamina, maxStamina) }} /></div>
        <div className="status-meta"><span>{location}</span><span>Day {day} · {timeLabel}</span><span>{gold}g</span></div>
      </section>

      <section className="quest-card">
        <strong>{active?.quest.name ?? 'No active quest'}</strong>
        <span className="quest-objective">{active?.objective.text ?? 'Explore Mernodna freely.'}</span>
        <QuestCompass />
      </section>
      <MiniMap />
      {!blocked && interaction && <div className="interaction-hint"><kbd>E</kbd><span>{interaction}</span><small>or tap nearby</small></div>}

      <div className="hud-actions">
        <button type="button" onClick={() => openPanel('map')}>Map <kbd>M</kbd></button>
        <button type="button" onClick={() => openPanel('inventory')}>Gear <kbd>I</kbd></button>
        <button type="button" onClick={() => openPanel('pause')}>Menu <kbd>Esc</kbd></button>
      </div>

      <div className="pc-hint">WASD move · Shift sprint · Q dash · Space attack · E interact</div>
    </div>
  );
}
