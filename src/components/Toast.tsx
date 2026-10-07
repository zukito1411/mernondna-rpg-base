import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 5200);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  return toast ? <div className="toast" role="status">{toast}</div> : null;
}
