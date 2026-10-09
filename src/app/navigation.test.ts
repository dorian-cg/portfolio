import { describe, expect, it } from 'vitest';
import { PAGES } from './hud/sections';
import { initialNav, navigate, pagesFor, type NavAction, type NavState } from './navigation';

const run = (actions: NavAction[], from: NavState = initialNav) => actions.reduce(navigate, from);
const sections = pagesFor('wide');

describe('pagesFor', () => {
  it('has the identity page only on narrow screens', () => {
    expect(pagesFor('narrow')).toEqual(PAGES);
    expect(pagesFor('medium')).toEqual(pagesFor('wide'));
    expect(pagesFor('wide')).not.toContain('identity');
  });
});

describe('navigate', () => {
  it('starts on the identity page', () => {
    expect(initialNav.page).toBe('identity');
  });

  it('goes to a page', () => {
    expect(run([{ type: 'goto', page: 'comms' }]).page).toBe('comms');
  });

  describe('visited', () => {
    it('clears a page that is opened, so its entrance effects play', () => {
      const state = run([{ type: 'goto', page: 'missions' }, { type: 'seen', page: 'missions' }, { type: 'goto', page: 'profile' }]);
      expect(state.visited.missions).toBe(true);
      const back = run([{ type: 'goto', page: 'missions' }], state);
      expect(back.visited.missions).toBeUndefined();
    });

    it('clears a page opened by stepping too', () => {
      const seen = run([{ type: 'goto', page: 'missions' }, { type: 'seen', page: 'missions' }, { type: 'goto', page: 'profile' }]);
      const state = run([{ type: 'step', delta: 1, pages: sections }], seen);
      expect(state.page).toBe('missions');
      expect(state.visited.missions).toBeUndefined();
    });

    it('marks a page once its entrance has had time to finish', () => {
      const state = run([{ type: 'goto', page: 'missions' }, { type: 'seen', page: 'missions' }]);
      expect(state.visited.missions).toBe(true);
    });

    it('does not clear a page that is only re-selected', () => {
      const state = run([{ type: 'goto', page: 'missions' }, { type: 'seen', page: 'missions' }, { type: 'goto', page: 'missions' }]);
      expect(state.visited.missions).toBe(true);
    });

    it('keeps the other pages as they were', () => {
      const state = run([
        { type: 'goto', page: 'missions' },
        { type: 'seen', page: 'missions' },
        { type: 'goto', page: 'training' },
        { type: 'seen', page: 'training' },
        { type: 'goto', page: 'missions' },
      ]);
      expect(state.visited).toEqual({ training: true });
    });
  });

  describe('step', () => {
    it('moves forward and back', () => {
      const at = (page: NavState['page']): NavState => ({ ...initialNav, page });
      expect(run([{ type: 'step', delta: 1, pages: sections }], at('profile')).page).toBe('missions');
      expect(run([{ type: 'step', delta: -1, pages: sections }], at('missions')).page).toBe('profile');
    });

    it('wraps around at both ends', () => {
      const last: NavState = { ...initialNav, page: 'comms' };
      expect(run([{ type: 'step', delta: 1, pages: sections }], last).page).toBe('profile');
      const first: NavState = { ...initialNav, page: 'profile' };
      expect(run([{ type: 'step', delta: -1, pages: sections }], first).page).toBe('comms');
    });

    it('treats a page that is not available as the first one', () => {
      // On identity after the screen widened: stepping forward goes to missions.
      expect(run([{ type: 'step', delta: 1, pages: sections }]).page).toBe('missions');
    });
  });

  describe('scroll', () => {
    const measured = (max: number, viewport = 10): NavState =>
      run([{ type: 'goto', page: 'missions' }, { type: 'range', page: 'missions', range: { max, viewport } }]);

    it('scrolls within the content', () => {
      expect(run([{ type: 'scroll', delta: 3 }], measured(20)).scroll.missions).toBe(3);
    });

    it('stops at the top and at the end', () => {
      expect(run([{ type: 'scroll', delta: -5 }], measured(20)).scroll.missions).toBe(0);
      expect(run([{ type: 'scroll', delta: 99 }], measured(20)).scroll.missions).toBe(20);
    });

    it('does not scroll content that fits', () => {
      expect(run([{ type: 'scroll', delta: 3 }], measured(0)).scroll.missions).toBe(0);
    });

    it('pages by one screen minus a row of context', () => {
      expect(run([{ type: 'scrollPage', direction: 1 }], measured(50, 10)).scroll.missions).toBe(9);
    });

    it('jumps to the top and the bottom', () => {
      const bottom = run([{ type: 'scrollTo', position: 'bottom' }], measured(20));
      expect(bottom.scroll.missions).toBe(20);
      expect(run([{ type: 'scrollTo', position: 'top' }], bottom).scroll.missions).toBe(0);
    });

    it('keeps a separate offset for every page', () => {
      const state = run(
        [{ type: 'scroll', delta: 4 }, { type: 'goto', page: 'training' }],
        measured(20),
      );
      expect(state.scroll.missions).toBe(4);
      expect(state.scroll.training).toBeUndefined();
    });

    it('pulls the offset back when the content shrinks, as on a resize', () => {
      const scrolledDown = run([{ type: 'scroll', delta: 18 }], measured(20));
      const shrunk = run([{ type: 'range', page: 'missions', range: { max: 5, viewport: 10 } }], scrolledDown);
      expect(shrunk.scroll.missions).toBe(5);
    });
  });
});
