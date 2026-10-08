import { useEffect, useRef, useState } from 'react';
import { ACTIVE_SKILLS } from '../data/activeSkills';
import type { ActiveSkillId } from '../data/activeSkills';
import { mobileInput } from '../game/input';
import { useGameStore } from '../store/gameStore';

function SkillGlyph({ id }: { id: ActiveSkillId }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (id === 'azure-cleave') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 18c8 1 14-5 13-13M5 18l4-5m-4 5 6 1M18 5l-5 4m5-4-1 6" /></svg>;
  }
  if (id === 'skyfall-slam') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="m13 2-2 8 5-1-6 13 1-9-4 1 6-12ZM4 20h16" /></svg>;
  }
  if (id === 'crown-rally') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="m3 7 5 4 4-7 4 7 5-4-2 11H5L3 7ZM6 21h12" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 19c7 0 13-6 13-13M7 20c6 0 11-5 11-11M10 21c5 0 9-4 9-9M4 19l4-1m-1 2 1-4" /></svg>;
}

export function MobileControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const panel = useGameStore(s => s.panel);
  const dialogue = useGameStore(s => s.dialogue);
  const cinematic=useGameStore(s=>s.cinematic);
  const activeSkillStatus = useGameStore(s => s.activeSkillStatus);
  const blocked = Boolean(panel || dialogue || cinematic);
  useEffect(() => {
    const reset = () => { pointerId.current = null; setStick({ x: 0, y: 0 }); mobileInput.reset(); };
    reset();
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => { reset(); window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset); };
  }, [blocked]);

  const updateStick = (clientX: number, clientY: number) => {
    const node = joystickRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let x = (clientX - cx) / (rect.width * 0.36);
    let y = (clientY - cy) / (rect.height * 0.36);
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    setStick({ x, y });
    mobileInput.setMove(x, y);
  };

  const release = () => {
    pointerId.current = null;
    setStick({ x: 0, y: 0 });
    mobileInput.releaseMove();
  };

  return (
    <div className="mobile-controls" aria-label="Touch controls" style={blocked ? { display: 'none' } : undefined}>
      <div
        ref={joystickRef}
        className="joystick"
        onPointerDown={(event) => {
          if (pointerId.current !== null) return;
          pointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateStick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (pointerId.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) updateStick(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => { if (pointerId.current === event.pointerId) release(); }}
        onPointerCancel={(event) => { if (pointerId.current === event.pointerId) release(); }}
        onLostPointerCapture={(event) => { if (pointerId.current === event.pointerId) release(); }}
        aria-label="Movement joystick"
      >
        <div className="joystick-knob" style={{ transform: `translate(calc(-50% + ${stick.x * Math.min(34, (joystickRef.current?.clientWidth ?? 116) * .25)}px), calc(-50% + ${stick.y * Math.min(34, (joystickRef.current?.clientHeight ?? 116) * .25)}px))` }} />
      </div>

      <div className="touch-actions">
        {ACTIVE_SKILLS.map(skill => {
          const remaining = activeSkillStatus.cooldowns[skill.id];
          const cooldown = remaining > 0;
          const progress = Math.max(0, Math.min(1, remaining / skill.cooldownMs));
          const cooldownLabel = cooldown ? `cooldown ${Math.ceil(remaining / 1000)} seconds` : 'ready';
          return (
            <button
              key={skill.id}
              type="button"
              aria-label={`${skill.name}, ${cooldownLabel}`}
              title={`${skill.name} · ${skill.staminaCost} stamina${cooldown ? ` · ${cooldownLabel}` : ' · ready'}`}
              className={`touch-button touch-skill skill-${skill.slot}${cooldown ? ' cooling' : ''}`}
              onPointerDown={() => mobileInput.press(skill.action)}
            >
              {cooldown && <span className="touch-cooldown-ring" style={{
                background: `conic-gradient(rgba(12, 19, 23, .78) ${progress * 360}deg, transparent 0)`,
              }} />}
              <span className="touch-skill-glyph"><SkillGlyph id={skill.id} /></span>
              <span className="touch-skill-slot">{skill.slot}</span>
            </button>
          );
        })}
        <button type="button" aria-label="Interact" className="touch-button interact" onPointerDown={() => mobileInput.press('interact')}>
          <span className="touch-glyph">E</span><small>Talk / use</small>
        </button>
        <button type="button" aria-label="Dash" className="touch-button dash" onPointerDown={() => mobileInput.press('dash')}>
          <span className="touch-glyph">⇢</span><small>Dash</small>
        </button>
        <button type="button" aria-label="Attack" className="touch-button attack" onPointerDown={() => mobileInput.press('attack')}>
          <span className="touch-glyph">⚔</span><small>Attack</small>
        </button>
        <button type="button" aria-label="Sprint" className="touch-button sprint"
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); mobileInput.setSprint(true); }}
          onPointerUp={() => mobileInput.setSprint(false)} onPointerCancel={() => mobileInput.setSprint(false)}
          onLostPointerCapture={() => mobileInput.setSprint(false)}>
          <span className="touch-glyph">»</span><small>Sprint</small>
        </button>
      </div>
    </div>
  );
}
