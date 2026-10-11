import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NPCS } from '../src/data/npcs';
import { SpritePortrait } from '../src/components/SpritePortrait';
import type { NpcDefinition } from '../src/game/types';

describe('safe NPC dialogue portraits', () => {
  it('renders valid source imagery for every currently registered NPC', () => {
    for (const npc of NPCS) {
      const markup = renderToStaticMarkup(createElement(SpritePortrait, {
        frame: npc.spriteFrame,
        name: npc.name,
        texture: npc.spriteTexture,
      }));
      expect(markup, npc.id).toContain('sprite-portrait');
      expect(markup, npc.id).toContain('<img');
      expect(markup, npc.id).toContain('src=');
    }
  });

  it('resolves Isabel Ward and ordinary guards to actual Trandum idle artwork', () => {
    for (const texture of ['npc_royal_guard', 'npc_guard'] as const) {
      const markup = renderToStaticMarkup(createElement(SpritePortrait, {
        frame: 0, name: 'Isabel Ward', texture,
      }));
      expect(markup).toContain('assets/npcs/trandum_guard/idle_tran.png');
    }
  });

  it('shows a non-crashing placeholder for unknown sprites and invalid frames', () => {
    const markup = renderToStaticMarkup(createElement(SpritePortrait, {
      frame: 999, name: 'Unknown Traveler',
      texture: 'future_missing_npc_art' as NpcDefinition['spriteTexture'],
    }));
    expect(markup).toContain('sprite-portrait');
    expect(markup).toContain('Unknown Traveler portrait');
    expect(markup).not.toContain('<img');
  });
});
