import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { resolveQuestTarget, compassDirection, questBearing, mapPoint } from '../src/game/systems/questNavigation';
import { LEIGNERON } from '../src/data/player';
import { WORLD_CONTENT } from '../src/data/content';
import { ART_SHEETS, PLAYER_ANIMATIONS } from '../src/data/art';
import { NPCS } from '../src/data/npcs';

beforeEach(() => useGameStore.getState().resetGame());
const target = (live?: (id: string) => { x: number; y: number } | undefined) => {
  const s = useGameStore.getState(); return resolveQuestTarget(s.quests,s.worldContent,LEIGNERON.spawn,live);
};
describe('quest navigation', () => {
  it('tracks Aldren → Varr → Aldren and advances to the unlocked campaign', () => {
    expect(target()?.contentId).toBe('npc:aldren-vale');
    const s = useGameStore.getState(); s.startDialogue('aldren-vale'); s.endDialogue();
    expect(target()?.contentId).toBe('boss:captain-varr');
    s.recordEnemyDefeat('bandit-captain',110,30,'captain-varr');
    expect(target()?.objectiveId).toBe('return-aldren');
    s.startDialogue('aldren-vale'); s.endDialogue();
    expect(target()?.questId).toBe('eight-regions');
    expect(target()?.contentId).toBe('boss:moonlit-warden');
  });
  it('uses live actor positions and persistent NPC relocation before authored defaults', () => {
    useGameStore.getState().setContentWorld({ states: { 'npc:aldren-vale': { x: 40000,y: 40000,trust: 85 } }, spawns: {},nextSpawnSequence: 0 });
    expect(target()?.x).toBe(40000);
    expect(target(id => id === 'npc:aldren-vale' ? { x: 41000,y: 42000 } : undefined)?.x).toBe(41000);
  });
  it('preserves the return conversation when the boss was killed early', () => {
    const s = useGameStore.getState(); s.recordEnemyDefeat('bandit-captain',110,30,'captain-varr');
    expect(target()?.contentId).toBe('npc:aldren-vale');
    s.startDialogue('aldren-vale'); s.endDialogue();
    expect(target()?.objectiveId).toBe('return-aldren');
  });
  it('uses north-up bearings and clamps distant destinations to the circular map edge', () => {
    const center = { x: 100,y: 100 };
    expect(compassDirection(questBearing(center,{ x: 100,y: 0 }))).toBe('N');
    expect(compassDirection(questBearing(center,{ x: 200,y: 100 }))).toBe('E');
    expect(compassDirection(questBearing(center,{ x: 0,y: 100 }))).toBe('W');
    const point = mapPoint({ x: 10000,y: -10000 },center,1100,192,true);
    expect(point.offscreen).toBe(true);
    expect(Math.hypot(point.x - 96,point.y - 96)).toBeCloseTo(84);
  });
});
describe('supplied art integration', () => {
  it('uses role-specific NPC art, all new building/prop types and all hero poses', () => {
    expect(new Set(NPCS.map(n => `${n.spriteTexture ?? 'npcs'}:${n.spriteFrame}`)).size).toBe(9);
    const props = WORLD_CONTENT.filter(d => 'frame' in d);
    for (const key of ['world_assets','world_buildings'] as const) {
      const used = new Set(props.filter(d => 'frame' in d && (d.texture ?? 'world_objects') === key).map(d => 'frame' in d ? d.frame : -1));
      expect(used.size).toBe(key === 'world_assets' ? 8 : 6);
    }
    expect(new Set(PLAYER_ANIMATIONS.flatMap(a => a.frames)).size).toBe(24);
    for (const sheet of ART_SHEETS) {
      expect(sheet.names.length).toBe(sheet.columns);
      if (sheet.regions) {
        expect(sheet.regions.length).toBe(sheet.columns);
        for (const [x,y,w,h] of sheet.regions) {
          expect(w).toBeGreaterThan(0); expect(h).toBeGreaterThan(0);
          expect(x + w).toBeLessThanOrEqual(sheet.sourceSize![0]);
          expect(y + h).toBeLessThanOrEqual(sheet.sourceSize![1]);
        }
      }
    }
  });
});
