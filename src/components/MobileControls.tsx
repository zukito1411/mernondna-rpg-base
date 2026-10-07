import { useEffect, useRef, useState } from 'react';
import { mobileInput } from '../game/input';
import { useGameStore } from '../store/gameStore';

export function MobileControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const panel = useGameStore(s => s.panel);
  const dialogue = useGameStore(s => s.dialogue);
  const blocked = Boolean(panel || dialogue);
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
        <div className="joystick-knob" style={{ transform: `translate(${stick.x * 34}px, ${stick.y * 34}px)` }} />
      </div>

      <div className="touch-actions">
        <button type="button" aria-label="Interact" className="touch-button interact" onPointerDown={() => mobileInput.press('interact')}>E</button>
        <button type="button" aria-label="Dash" className="touch-button dash" onPointerDown={() => mobileInput.press('dash')}>Dash</button>
        <button type="button" aria-label="Attack" className="touch-button attack" onPointerDown={() => mobileInput.press('attack')}>⚔</button>
        <button type="button" aria-label="Sprint" className="touch-button sprint"
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); mobileInput.setSprint(true); }}
          onPointerUp={() => mobileInput.setSprint(false)} onPointerCancel={() => mobileInput.setSprint(false)}
          onLostPointerCapture={() => mobileInput.setSprint(false)}>Run</button>
      </div>
    </div>
  );
}
