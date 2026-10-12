import type { EncounterBehavior, Vec2 } from '../types';

/** Runtime-only alerts/retreats; never serialize stale combat timers. Membership
 * is bounded by the live actor budget and removed on death or chunk unloading. */
export class EncounterCoordinator {
  private readonly members = new Map<string, Set<string>>();
  private readonly alerts = new Map<string, number>();
  private readonly returning = new Set<string>();

  register(key: string, id: string) {
    let members = this.members.get(key);
    if (!members) this.members.set(key, members = new Set());
    members.add(id);
  }
  forget(key: string, id: string) {
    this.returning.delete(id);
    const members = this.members.get(key);
    members?.delete(id);
    if (!members?.size) { this.members.delete(key); this.alerts.delete(key); }
  }
  clear() { this.members.clear(); this.alerts.clear(); this.returning.clear(); }
  arrived(id:string) { this.returning.delete(id); }
  decide(key: string, id: string, behavior: EncounterBehavior, position: Vec2, target: Vec2,
    time: number, spotted: boolean, targetAllowed: boolean): 'idle' | 'pursue' | 'return' {
    const fromHome = Math.hypot(position.x - behavior.home.x, position.y - behavior.home.y);
    const targetFromHome = Math.hypot(target.x - behavior.home.x, target.y - behavior.home.y);
    const until = this.alerts.get(key) ?? 0;
    if (until <= time) {
      this.alerts.delete(key);
      if (until > 0) for (const member of this.members.get(key) ?? []) this.returning.add(member);
    }
    const alerted = until > time;
    if (!targetAllowed || targetFromHome > behavior.leashRadius) {
      this.alerts.delete(key);
      if (alerted) for (const member of this.members.get(key) ?? []) this.returning.add(member);
      if (alerted || spotted || fromHome > behavior.leashRadius * .4) this.returning.add(id);
    }
    if (fromHome > behavior.leashRadius) this.returning.add(id);
    if (this.returning.has(id)) {
      if (Math.hypot(position.x - behavior.station.x, position.y - behavior.station.y) > 40) return 'return';
      this.returning.delete(id);
    }
    if (targetAllowed && targetFromHome <= behavior.leashRadius && fromHome <= behavior.leashRadius) {
      if (spotted) this.alerts.set(key, time + 5500);
      if (spotted || alerted && Math.hypot(position.x - target.x, position.y - target.y) < 510) return 'pursue';
    }
    if (fromHome > behavior.leashRadius * .4) { this.returning.add(id); return 'return'; }
    return 'idle';
  }
}
