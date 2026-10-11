export type EffectsQuality = 'low' | 'normal';
const KEY = 'leighneron:effects-quality';
export const EFFECTS_QUALITY_EVENT = 'leighneron-effects-quality';

export function getEffectsQuality(): EffectsQuality {
  try {
    const setting = localStorage.getItem(KEY);
    if (setting === 'low' || setting === 'normal') return setting;
  } catch { /* Restricted storage: use device defaults. */ }
  return window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'low' : 'normal';
}

export function setEffectsQuality(quality: EffectsQuality) {
  try { localStorage.setItem(KEY, quality); } catch { /* Settings remain session-local. */ }
  window.dispatchEvent(new Event(EFFECTS_QUALITY_EVENT));
}
