/** Small reusable vector icons. Matches medieval game UI without relying on OS glyph fonts. */
export type GameIconName = 'map' | 'quest' | 'bag' | 'status' | 'menu' | 'chevron-left' | 'chevron-right' | 'close' | 'zoom-in' | 'zoom-out';
export function GameIcon({ name }: { name: GameIconName }) {
  const strokeProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" {...strokeProps}>
    {name === 'map' && <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16"/><circle cx="15" cy="10" r="1.4"/></>}
    {name === 'quest' && <><path d="M6 3h11a2 2 0 0 1 2 2v16H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/><path d="M3 18a3 3 0 0 1 3-3h13M8 7h8M8 11h6"/></>}
    {name === 'bag' && <><path d="M4 8h16l-1.5 13h-13z"/><path d="M9 8V6a3 3 0 0 1 6 0v2M4 12h16"/><path d="M12 12v4"/></>}
    {name === 'status' && <><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3z"/><path d="m12 13 2 3-2 3-2-3z"/></>}
    {name === 'menu' && <><path d="M4 6h16M4 12h16M4 18h16"/><path d="M7 4v4M17 10v4M10 16v4"/></>}
    {name === 'chevron-left' && <path d="m15 4-8 8 8 8"/>}
    {name === 'chevron-right' && <path d="m9 4 8 8-8 8"/>}
    {name === 'close' && <path d="M5 5l14 14M19 5 5 19"/>}
    {(name === 'zoom-in' || name === 'zoom-out') && <><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5M7 10h6"/>{name === 'zoom-in' && <path d="M10 7v6"/>}</>}
  </svg>;
}
