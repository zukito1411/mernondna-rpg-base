import { describe, expect, it } from 'vitest';
import { WORLD_CONTENT } from '../src/data/content';
import { SETTLEMENT_PROFILES } from '../src/data/settlementProfiles';
import { insideDefense } from '../src/data/settlementDefenses';
import { DARKAV_GROUND_FRAMES, darkavGroundFrame } from '../src/game/systems/DarkavGroundArt';
import { weatherFor } from '../src/game/systems/WeatherSystem';

describe('Darkav settlement ground presentation', () => {
  it('keeps volcanic ashfall in Darkav at all hours and across days', () => {
    for (const day of [1, 8, 31]) for (const minute of [0, 360, 720, 1200])
      expect(weatherFor('darkav','volcanic',day,minute)).toBe('ash');
  });

  it('uses charcoal surfaces for Blackspire streets and safe floors only', () => {
    expect(DARKAV_GROUND_FRAMES).toContain(16);
    expect(DARKAV_GROUND_FRAMES).toContain(17);
    expect(darkavGroundFrame(2, true, true)).toBe(17);
    expect(darkavGroundFrame(2, false, true)).toBe(17);
    expect(darkavGroundFrame(2, true)).toBe(16);
    expect(darkavGroundFrame(10, true, true)).toBe(15);
    expect(darkavGroundFrame(7, false, true)).toBe(7);
    for (const frame of [1, 2, 8]) expect(darkavGroundFrame(frame, true)).toBe(16);
    expect(darkavGroundFrame(10, true)).toBe(15);
    expect(darkavGroundFrame(2)).toBe(14);
    expect(darkavGroundFrame(8)).toBe(12);
  });

  it('matches Blackspire building and defensive wall tints', () => {
    expect(SETTLEMENT_PROFILES.blackspire.buildingTint).toBe(0x55575c);
    expect(SETTLEMENT_PROFILES.blackspire.wallTint).toBe(0x55575c);
  });

  it('tints every prop and interactable inside Blackspire, including furniture', () => {
    const props = WORLD_CONTENT.filter(definition => 'frame' in definition
      && insideDefense('blackspire', definition.world.x, definition.world.y)
      && (definition.kind === 'prop' || definition.kind === 'settlement-prop' || 'description' in definition));
    expect(props.length).toBeGreaterThan(0);
    expect(props.every(definition => 'tint' in definition
      && definition.tint === SETTLEMENT_PROFILES.blackspire.buildingTint)).toBe(true);
    expect(props.some(definition => definition.id.includes('street-lamp'))).toBe(true);
    expect(props.some(definition => definition.id.includes('bench'))).toBe(true);
  });
});
