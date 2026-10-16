import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CinematicPanel } from '../src/components/CinematicPanel';
import type {StoryPanelRef} from '../src/data/storyPanelArt';
import {STORY_PANEL_ART} from '../src/data/storyPanelArt';
import {CINEMATICS} from '../src/data/cinematics';
import {existsSync} from 'node:fs';
import {NPC_BY_ID} from '../src/data/npcs';

type TestStore = {
  cinematic: { id: string; title: string; line: string; ready: boolean; covered?:boolean;ending?:boolean;illustration?:StoryPanelRef } | null;
  requestCinematicSkip: () => void;
};
const { store } = vi.hoisted(() => ({
  store: { cinematic: null, requestCinematicSkip: () => {} } as TestStore,
}));
vi.mock('../src/store/gameStore', () => ({
  useGameStore: <T,>(select: (state: TestStore) => T) => select(store),
}));
describe('cinematic loading presentation', () => {
  afterEach(() => { store.cinematic = null; });

  it('does not present narration before the shot is ready', () => {
    store.cinematic = {
      id: 'roadborn-opening', title: 'A Road Before a Sword',
      line: 'This narration must wait for the view.', ready: false,
    };

    const markup = renderToStaticMarkup(createElement(CinematicPanel));
    expect(markup).toContain('Preparing scene');
    expect(markup).toContain('Skip scene');
    expect(markup).not.toContain('This narration must wait for the view.');
  });

  it('presents narration after the shot is ready', () => {
    store.cinematic = {
      id: 'roadborn-opening', title: 'A Road Before a Sword',
      line: 'The prepared scene is visible.', ready: true,
    };

    const markup = renderToStaticMarkup(createElement(CinematicPanel));
    expect(markup).toContain('The prepared scene is visible.');
    expect(markup).not.toContain('Preparing scene');
  });

  it('renders registered artwork with a covering curtain and ending state',()=>{
    store.cinematic={id:'family-relief-account',title:'The Names Beside the Crossing',line:'The river account.',
      ready:true,covered:true,ending:true,illustration:{page:'river-account',panel:2}};
    const markup=renderToStaticMarkup(createElement(CinematicPanel));
    expect(markup).toContain('is-covered');expect(markup).toContain('is-ending');
    expect(markup).toContain('cinematic-curtain');expect(markup).toContain('Illustrated scene');
    expect(markup).toContain('assets/cinematics/story/river-account-v1.png');
    expect(markup.match(/class="cinematic-story-panel /g)).toHaveLength(3);
    expect(markup.match(/class="cinematic-story-panel is-active"/g)).toHaveLength(1);
  });

  it('includes every registered page and valid scene crop without spoiling pre-battle outcomes',()=>{
    expect(Object.keys(STORY_PANEL_ART)).toHaveLength(17);
    const used=new Set<string>();
    for(const scene of Object.values(CINEMATICS))for(const shot of scene.shots)if(shot.illustration){
      const {page,panel}=shot.illustration,art=STORY_PANEL_ART[page];used.add(page);
      expect(art,scene.id+': '+page).toBeDefined();
      expect(existsSync('public/'+art.path),page).toBe(true);
      const [x,y,w,h]=art.panels[panel].region;
      expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);
      expect(w).toBeGreaterThan(0);expect(h).toBeGreaterThan(0);
      expect(x+w).toBeLessThanOrEqual(art.width);expect(y+h).toBeLessThanOrEqual(art.height);
      if(scene.id.endsWith('-before'))expect(panel).toBeLessThan(2);
    }
    expect(used.size).toBe(17);
    for(const scene of Object.values(CINEMATICS))for(const shot of scene.shots)if(shot.focusNpcId)
      expect(NPC_BY_ID[shot.focusNpcId],scene.id+': '+shot.focusNpcId).toBeDefined();
  });
});
