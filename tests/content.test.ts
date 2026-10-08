import { describe, expect, it } from 'vitest';
import { NPCS } from '../src/data/npcs';
import { TOWN_BY_ID } from '../src/data/towns';
import { WEAPON_BY_ID } from '../src/data/weapons';
import { WORLD_CONTENT } from '../src/data/content';
import { ENEMY_BY_ID, BOSSES } from '../src/data/enemies';
import { NPC_BY_ID } from '../src/data/npcs';
import { WorldGenerator } from '../src/game/systems/WorldGenerator';

describe('content integrity', () => {
  it('every NPC points to a valid town and optional weapon', () => {
    for (const npc of NPCS) {
      expect(TOWN_BY_ID[npc.townId]).toBeTruthy();
      if (npc.weaponId) expect(WEAPON_BY_ID[npc.weaponId]).toBeTruthy();
      expect(npc.relationshipToLeigneron.summary.length).toBeGreaterThan(10);
      expect(npc.schedule.length).toBeGreaterThan(0);
    }
  });
  it('streamed content has unique stable IDs, valid references, and walkable spawn points', () => {
    expect(new Set(WORLD_CONTENT.map(d => d.id)).size).toBe(WORLD_CONTENT.length);
    const world = new WorldGenerator();
    for (const d of WORLD_CONTENT) {
      if(!d.id.startsWith('fort:'))expect(world.isWalkable(d.world.x, d.world.y), d.id).toBe(true);
      // Defensive stone is deliberately not a playable floor.
      if (d.kind === 'creature') {
        expect(world.canCreatureOccupy(d.world.x,d.world.y),`${d.id} inside settlement protection`).toBe(true);
        expect(ENEMY_BY_ID[d.enemyId]).toBeTruthy();
        if (d.bossId) expect(BOSSES.some(b => b.id === d.bossId)).toBe(true);
      }
      if (d.kind === 'npc') expect(NPC_BY_ID[d.npcId]).toBeTruthy();
      if (d.kind === 'settlement') expect(TOWN_BY_ID[d.townId]).toBeTruthy();
    }
  });
});
