import { useEffect, useRef, useState } from 'react';
import { ACTIVE_SKILLS } from '../data/activeSkills';
import type { ActiveSkillId } from '../data/activeSkills';
import { mobileInput } from '../game/input';
import { useGameStore } from '../store/gameStore';

const SKILL_ICONS: Record<ActiveSkillId, string> = {
  'azure-cleave': '/assets/ui/actions/azure-cleave.svg',
  'skyfall-slam': '/assets/ui/actions/skyfall-slam.svg',
  'crown-rally': '/assets/ui/actions/crown-rally.svg',
  'crescent-flurry': '/assets/ui/actions/crescent-flurry.svg',
};

export function MobileControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const sprintPointer = useRef<{id:number;startedAt:number;timer:number}|null>(null);
  const panel = useGameStore(s => s.panel);
  const dialogue = useGameStore(s => s.dialogue);
  const cinematic=useGameStore(s=>s.cinematic);
  const activeSkillStatus = useGameStore(s => s.activeSkillStatus);
  const interaction = useGameStore(s => s.navigation.interaction);
  const blocked = Boolean(panel || dialogue || cinematic);
  useEffect(() => {
    const reset = () => {
      pointerId.current = null;
      if(sprintPointer.current)window.clearTimeout(sprintPointer.current.timer);
      sprintPointer.current = null;
      setStick({ x: 0, y: 0 });
      mobileInput.reset();
    };
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

  const releaseSprint = (pointerId: number, dashOnTap: boolean) => {
    const press = sprintPointer.current;
    if (!press || press.id !== pointerId) return;
    window.clearTimeout(press.timer);
    sprintPointer.current = null;
    mobileInput.setSprint(false);
    if (dashOnTap && performance.now() - press.startedAt < 180) mobileInput.press('dash');
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
              <span className="touch-skill-glyph"><img src={SKILL_ICONS[skill.id]} alt="" /></span>
              <span className="touch-skill-slot">{skill.slot}</span>
            </button>
          );
        })}
        {interaction && <button type="button" aria-label={`Interact: ${interaction}`} title={interaction} className="touch-button interact" onPointerDown={() => mobileInput.press('interact')}>
          <span className="touch-glyph">E</span><small>Interact</small>
        </button>}
        <button type="button" aria-label="Attack" className="touch-button attack" onPointerDown={() => mobileInput.press('attack')}>
          <span className="touch-glyph"><img src="/assets/ui/actions/attack.svg" alt="" /></span><small>Attack</small>
        </button>
        <button type="button" aria-label="Tap to dash, hold to sprint" title="Tap to dash · Hold to sprint" className="touch-button sprint"
          onPointerDown={(event) => {
            if (sprintPointer.current) return;
            const press = {id:event.pointerId,startedAt:performance.now(),timer:0};
            press.timer = window.setTimeout(() => {
              if(sprintPointer.current?.id===event.pointerId)mobileInput.setSprint(true);
            },180);
            sprintPointer.current = press;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => releaseSprint(event.pointerId, true)}
          onPointerCancel={(event) => releaseSprint(event.pointerId, false)}
          onLostPointerCapture={(event) => releaseSprint(event.pointerId, false)}>
          <span className="touch-glyph"><img src="/assets/ui/actions/dash.svg" alt="" /></span><small>Dash / Sprint</small>
        </button>
      </div>
    </div>
  );
}
