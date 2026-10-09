import { REGION_BY_ID } from '../data/regions';
import { TOWN_BY_ID } from '../data/towns';
import { useGameStore } from '../store/gameStore';
import { activeObjective } from '../game/systems/questNavigation';
import { MiniMap } from './MiniMap';
import { QuestCompass } from './QuestCompass';
import { XP_PER_LEVEL } from '../data/progression';

function barPercent(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
}

export function HUD() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const stamina = useGameStore((s) => s.stamina);
  const maxStamina = useGameStore((s) => s.maxStamina);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const gold = useGameStore((s) => s.gold);
  const regionId = useGameStore((s) => s.regionId);
  const townId = useGameStore((s) => s.townId);
  const day = useGameStore((s) => s.day);
  const minute = useGameStore((s) => s.minuteOfDay);
  const quests = useGameStore((s) => s.quests);
  const tracked=useGameStore(s=>s.trackedQuestId);
  const openPanel = useGameStore((s) => s.openPanel);
  const interaction = useGameStore(s => s.navigation.interaction);
  const blocked = useGameStore(s => Boolean(s.panel || s.dialogue || s.cinematic));
  const bossEncounter = useGameStore(s => s.bossEncounter);
  const cinematic=useGameStore(s=>s.cinematic);

  const active = activeObjective(quests,tracked);

  const hour = Math.floor(minute / 60);
  const mins = Math.floor(minute % 60);
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const xpInLevel = xp % XP_PER_LEVEL;
  const regionName = regionId === 'dead-sea' ? 'Dead Sea' : REGION_BY_ID[regionId]?.name ?? regionId;
  const location = townId ? TOWN_BY_ID[townId]?.name ?? regionName : regionName;

  if(cinematic)return null;
  return (
    <div className="hud-layer" aria-live="polite">
      <div className="hud-primary-stack">
        <section className="status-card">
          <div className="status-title"><strong>Leigneron</strong><span>Lv. {level}</span></div>
          <div className="meter"><div className="meter-fill hp" style={{ width: barPercent(hp, maxHp) }} /></div>
          <div className="meter"><div className="meter-fill stamina" style={{ width: barPercent(stamina, maxStamina) }} /></div>
          <div className="xp-meter" role="progressbar" aria-label="Experience to next level" aria-valuemin={0} aria-valuemax={XP_PER_LEVEL} aria-valuenow={xpInLevel}>
            <div className="xp-meter-fill" style={{ width: barPercent(xpInLevel, XP_PER_LEVEL) }} />
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
          </div>
          <div className="status-meta"><span>{location}</span><span>Day {day} · {timeLabel}</span><span>{gold}g</span></div>
        </section>

        <section className="quest-card">
          <strong>{active?.quest.name ?? 'No active quest'}</strong>
          <span className="quest-objective">{active?.objective.text ?? 'Explore Mernodna freely.'}</span>
          <QuestCompass />
          <button className="journal-link" onClick={()=>openPanel('journal')}>Journal · J</button>
        </section>
      </div>
      {bossEncounter && <section className="boss-encounter-card" aria-label={`${bossEncounter.name} boss health`}>
        <strong>{bossEncounter.name}</strong>
        <div className="boss-health-meter" role="progressbar" aria-label={`${bossEncounter.name} health`}
          aria-valuemin={0} aria-valuemax={bossEncounter.maxHp} aria-valuenow={bossEncounter.hp}>
          <div style={{ width: barPercent(bossEncounter.hp, bossEncounter.maxHp) }} />
        </div>
      </section>}
      <MiniMap />
      {!blocked && interaction && <div className="interaction-hint"><kbd>E</kbd><span>{interaction}</span><small>or tap nearby</small></div>}

      <div className="hud-actions">
        <button type="button" aria-label="World Map" onClick={() => openPanel('map')}><span className="hud-icon" aria-hidden="true">⌖</span><span>Map</span><kbd>M</kbd></button>
        <button type="button" aria-label="Quest Journal" onClick={() => openPanel('journal')}><span className="hud-icon" aria-hidden="true">☷</span><span>Quest</span><kbd>J</kbd></button>
        <button type="button" aria-label="Gear" onClick={() => openPanel('inventory')}><span className="hud-icon" aria-hidden="true">▣</span><span>Bag</span><kbd>I</kbd></button>
        <button type="button" aria-label="Status" onClick={() => openPanel('character')}><span className="hud-icon" aria-hidden="true">♙</span><span>Status</span><kbd>C</kbd></button>
        <button type="button" aria-label="Menu" onClick={() => openPanel('pause')}><span className="hud-icon" aria-hidden="true">☰</span><span>Menu</span><kbd>Esc</kbd></button>
      </div>

      <div className="pc-hint">WASD move · Shift sprint · Q dash · Space attack · 1–4 combat arts · E interact · C status</div>
    </div>
  );
}
