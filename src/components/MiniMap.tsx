import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { WorldGenerator } from '../game/systems/WorldGenerator';
import { mapPoint, questBearing } from '../game/systems/questNavigation';
import type { TerrainKind } from '../game/types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../data/world';
import { nightStrength } from '../data/environmentLights';

const SIZE = 192, RANGE = 1100;
const world = new WorldGenerator();
const COLORS: Record<TerrainKind,string> = {
  grass: '#617849', forest: '#324e37', dirt: '#ab8b60', stone: '#96908a', snow: '#d1ddd9',
  ash: '#66544e', sand: '#c3ac78', water: '#294d63', farmland: '#918449',
  marsh:'#657363',lava:'#b85835',ice:'#9fc8df',
};

export function MiniMap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const terrainCache = useRef<{ key: string; x: number; y: number; canvas: HTMLCanvasElement } | null>(null);
  const x = useGameStore(s => s.worldX), y = useGameStore(s => s.worldY);
  const navigation = useGameStore(s => s.navigation);
  const day = useGameStore(s => s.day);
  const minute = useGameStore(s => s.minuteOfDay);
  const weather=useGameStore(s=>s.weatherLabel);
  const open = useGameStore(s => s.openPanel);
  const hour = Math.floor(minute / 60), mins = Math.floor(minute % 60);
  const night = nightStrength(minute) >= .5;
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const player = { x, y }, originX = Math.floor(x / 256) * 256, originY = Math.floor(y / 256) * 256;
    const key = `${originX}:${originY}`;
    const extent = RANGE * 8 / 3;
    if (terrainCache.current?.key !== key) {
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
      const background = canvas.getContext('2d')!;
      const left = originX - extent / 2, top = originY - extent / 2;
      for (let row = 0; row < 48; row++) for (let column = 0; column < 48; column++) {
        const px = left + (column + .5) * extent / 48, py = top + (row + .5) * extent / 48;
        const terrain = px < 0 || py < 0 || px >= WORLD_WIDTH || py >= WORLD_HEIGHT ? 'water' : world.getTerrainAt(px,py);
        background.fillStyle = COLORS[terrain];
        background.fillRect(column * 256 / 48,row * 256 / 48,Math.ceil(256 / 48),Math.ceil(256 / 48));
      }
      terrainCache.current = { key, x: left, y: top, canvas };
    }
    const cache = terrainCache.current;
    const scale = SIZE / (2 * RANGE);
    ctx.clearRect(0,0,SIZE,SIZE); ctx.save(); ctx.beginPath(); ctx.arc(SIZE / 2,SIZE / 2,SIZE / 2 - 2,0,Math.PI * 2); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cache.canvas,(cache.x - x + RANGE) * scale,(cache.y - y + RANGE) * scale,extent * scale,extent * scale);
    ctx.strokeStyle = '#f5e6bb33'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(SIZE/2,SIZE/2,SIZE * .25,0,Math.PI * 2); ctx.stroke();
    for (const marker of navigation.markers) {
      const point = mapPoint(marker,player,RANGE,SIZE);
      if (point.offscreen) continue;
      ctx.fillStyle = marker.kind === 'enemy' || marker.kind === 'boss' ? '#df735f' : marker.kind === 'npc' ? '#9ad6ca' : '#eee0b9';
      ctx.strokeStyle = '#211d17'; ctx.lineWidth = 1.3;
      if (marker.kind === 'building' || marker.kind === 'town') ctx.fillRect(point.x - 2,point.y - 2,4,4);
      else { ctx.beginPath(); ctx.arc(point.x,point.y,marker.kind === 'boss' ? 4 : 2.5,0,Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if (navigation.target) {
      const point = mapPoint(navigation.target,player,RANGE,SIZE,true);
      ctx.save(); ctx.translate(point.x,point.y); ctx.rotate(questBearing(player,navigation.target));
      ctx.fillStyle = '#ffdb79'; ctx.strokeStyle = '#342711'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(5,5); ctx.lineTo(0,2); ctx.lineTo(-5,5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.translate(SIZE / 2,SIZE / 2); ctx.rotate(navigation.heading);
    ctx.fillStyle = '#fff7dc'; ctx.strokeStyle = '#202a21'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(5,5); ctx.lineTo(0,2); ctx.lineTo(-5,5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#fff2c6'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.shadowColor = '#121a12'; ctx.shadowBlur = 3;
    ctx.fillText('N',SIZE / 2,17); ctx.restore();
  }, [x,y,navigation]);
  return (
    <button type="button" className="minimap-card" onClick={() => open('regional-map')} aria-label="Open expanded regional minimap">
      <span className="minimap-heading">LOCAL MAP <span> N ↑</span></span>
      <canvas ref={ref} width={SIZE} height={SIZE} aria-label="Local terrain, Leigneron, nearby NPCs and quest destination" />
      <span className="minimap-legend"><i className="legend-player" /> You <i className="legend-people" /> People <i className="legend-quest" /> Quest <i className="legend-danger" /> Danger</span>
      <span className={`minimap-clock ${night ? 'night' : 'day'}`}><i aria-hidden="true">{night ? '☾' : '☀'}</i><b>Day {day}</b><time>{String(hour).padStart(2, '0')}:{String(mins).padStart(2, '0')}</time></span>
      <span className="minimap-weather">{weather}</span>
    </button>
  );
}
