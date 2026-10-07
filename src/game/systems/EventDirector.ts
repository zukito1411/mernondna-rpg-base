import { DYNAMIC_EVENTS } from '../../data/events';
import type { RegionId } from '../types';
import { seededRandom } from '../../utils/seededRandom';

export interface EventDirectorHost {
  spawnEnemy(enemyId: string, x: number, y: number, eventSpawn?: boolean): boolean;
  isEnemyTerritory(x: number, y: number): boolean;
  notify(message: string): void;
  countEnemies(): number;
}

export class EventDirector {
  private elapsed = 0;
  private sequence = 0;

  constructor(private readonly host: EventDirectorHost) {}

  update(deltaMs: number, regionId: RegionId, hour: number, playerX: number, playerY: number) {
    this.elapsed += deltaMs;
    if (this.elapsed < 28000) return;
    this.elapsed = 0;
    if (this.host.countEnemies() >= 10 || regionId === 'dead-sea' || !this.host.isEnemyTerritory(playerX,playerY)) return;

    const valid = DYNAMIC_EVENTS.filter((event) => {
      if (!event.regions.includes(regionId)) return false;
      if (event.minHour === undefined || event.maxHour === undefined) return true;
      if (event.minHour > event.maxHour) return hour >= event.minHour || hour <= event.maxHour;
      return hour >= event.minHour && hour <= event.maxHour;
    });
    if (!valid.length) return;

    const rng = seededRandom(`event:${this.sequence++}:${Math.floor(playerX / 500)}:${Math.floor(playerY / 500)}`);
    if (rng() > 0.48) return;
    const event = valid[Math.floor(rng() * valid.length)];
    if (!event.enemyId || !event.enemyCount) return;

    let spawned = 0;
    for (let i = 0; i < event.enemyCount; i += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = 220 + rng() * 170;
      if (this.host.spawnEnemy(event.enemyId,playerX + Math.cos(angle) * distance,playerY + Math.sin(angle) * distance,true)) spawned++;
    }
    if (spawned) this.host.notify(`${event.headline}: ${event.description}`);
  }
}
