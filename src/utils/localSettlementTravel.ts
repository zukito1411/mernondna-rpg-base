/** Local Vite play can visit every settlement without changing shrine unlocks. */
export function localSettlementTravelEnabled():boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (['localhost','127.0.0.1','::1','[::1]'].includes(host)) return true;
  // Also support phones opening the local development server over home Wi-Fi.
  const ip = host.split('.').map(Number);
  return ip.length === 4 && ip.every(part => Number.isInteger(part) && part >= 0 && part <= 255)
    && (ip[0] === 10 || ip[0] === 192 && ip[1] === 168 || ip[0] === 172 && ip[1] >= 16 && ip[1] <= 31);
}
