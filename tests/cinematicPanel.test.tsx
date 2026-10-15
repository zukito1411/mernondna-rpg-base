import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CinematicPanel } from '../src/components/CinematicPanel';

type TestStore = {
  cinematic: { id: string; title: string; line: string; ready: boolean } | null;
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
});
