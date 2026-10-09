import { useInput } from 'ink';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { scalePitch } from '../sound/cues';
import { usePointerGesture } from './input/pointer';
import { PAGES, SECTIONS, type Page } from './hud/sections';
import type { Layout } from './layout';
import { initialNav, navigate, pagesFor, type NavAction, type ScrollRange } from './navigation';
import { useSound, useSoundEngine } from './sound';

/** Longer than the slowest section takes to type out. After this a page counts as seen, even without leaving it. */
export const ENTRANCE_MS = 4000;

export interface Navigation {
  page: Page;
  /** Pages whose entrance effects have finished, which are not replayed by a remount. */
  visited: Partial<Record<Page, true>>;
  /** Rows the current page is scrolled by. */
  scroll: number;
  dispatch: (action: NavAction) => void;
  /** Moves to a page, as a tap on its tab does. */
  goto: (page: Page) => void;
  /** Moves to the next (1) or previous (-1) page. */
  step: (delta: 1 | -1) => void;
  /** For the view showing `page`, to report how far its content can scroll. */
  reportRange: (page: Page, range: ScrollRange) => void;
}

/** Page and scroll state, driven by the keyboard and the pointer while `isActive`. */
export function useNavigation(layout: Layout, isActive = true): Navigation {
  const [state, dispatch] = useReducer(navigate, initialNav);
  const engine = useSoundEngine();
  const play = useSound();

  // The reducer is read for what an action will do, from the latest state, so the callbacks below keep their identity.
  const latest = useRef(state);
  latest.current = state;

  /** Moves between pages. Each page has a note of its own, so every move can be heard. */
  const move = useCallback(
    (action: NavAction) => {
      const to = navigate(latest.current, action).page;
      if (to !== latest.current.page) {
        play('section', { pitch: scalePitch(PAGES.indexOf(to)) });
      }
      dispatch(action);
    },
    [play],
  );

  // Wider screens have no identity page: it is always beside the sections.
  useEffect(() => {
    if (layout.mode !== 'narrow' && state.page === 'identity') {
      dispatch({ type: 'goto', page: 'profile' });
    }
  }, [layout.mode, state.page]);

  // A resize swaps the layout and remounts the page, which must not replay what has been seen.
  // It only starts once the page is on screen, not behind the intro.
  useEffect(() => {
    if (!isActive) {
      return;
    }
    const timer = setTimeout(() => dispatch({ type: 'seen', page: state.page }), ENTRANCE_MS);
    return () => clearTimeout(timer);
  }, [isActive, state.page]);

  const reportRange = useCallback(
    (page: Page, range: ScrollRange) => dispatch({ type: 'range', page, range }),
    [],
  );

  const step = useCallback(
    (delta: 1 | -1) => move({ type: 'step', delta, pages: pagesFor(layout.mode) }),
    [move, layout.mode],
  );
  const goto = useCallback((page: Page) => move({ type: 'goto', page }), [move]);

  /** Scrolls, with a tick for each move and a thud when the content has no further to go. */
  const scroll = (action: NavAction, cue: 'tick' | 'glide') => {
    const before = state.scroll[state.page] ?? 0;
    const after = navigate(state, action).scroll[state.page] ?? 0;
    if (after !== before) {
      play(cue);
    } else if ((state.range[state.page]?.max ?? 0) > 0) {
      play('edge');
    }
    dispatch(action);
  };

  usePointerGesture((gesture) => {
    if (gesture.type === 'wheel' || gesture.type === 'drag') {
      scroll({ type: 'scroll', delta: gesture.rows }, 'tick');
    } else if (gesture.type === 'swipe') {
      step(gesture.direction === 'left' ? 1 : -1);
    }
  }, isActive);

  useInput(
    (input, key) => {
      const section = SECTIONS[Number(input) - 1];
      if (key.rightArrow || (key.tab && !key.shift)) step(1);
      else if (key.leftArrow || (key.tab && key.shift)) step(-1);
      else if (section) goto(section.id);
      else if (key.downArrow || input === 'j') scroll({ type: 'scroll', delta: 1 }, 'tick');
      else if (key.upArrow || input === 'k') scroll({ type: 'scroll', delta: -1 }, 'tick');
      else if (key.pageDown || input === ' ') scroll({ type: 'scrollPage', direction: 1 }, 'glide');
      else if (key.pageUp) scroll({ type: 'scrollPage', direction: -1 }, 'glide');
      else if (key.home || input === 'g') scroll({ type: 'scrollTo', position: 'top' }, 'glide');
      else if (key.end || input === 'G') scroll({ type: 'scrollTo', position: 'bottom' }, 'glide');
      else if (input === 'm') engine.toggle();
    },
    { isActive },
  );

  return { page: state.page, visited: state.visited, scroll: state.scroll[state.page] ?? 0, dispatch, goto, step, reportRange };
}
