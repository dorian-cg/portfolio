import { useInput } from 'ink';
import { useCallback, useEffect, useReducer } from 'react';
import { usePointerGesture } from './input/pointer';
import { SECTIONS, type Page } from './hud/sections';
import type { Layout } from './layout';
import { initialNav, navigate, pagesFor, type NavAction, type ScrollRange } from './navigation';

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
    (delta: 1 | -1) => dispatch({ type: 'step', delta, pages: pagesFor(layout.mode) }),
    [layout.mode],
  );
  const goto = useCallback((page: Page) => dispatch({ type: 'goto', page }), []);

  usePointerGesture((gesture) => {
    if (gesture.type === 'wheel' || gesture.type === 'drag') {
      dispatch({ type: 'scroll', delta: gesture.rows });
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
      else if (key.downArrow || input === 'j') dispatch({ type: 'scroll', delta: 1 });
      else if (key.upArrow || input === 'k') dispatch({ type: 'scroll', delta: -1 });
      else if (key.pageDown || input === ' ') dispatch({ type: 'scrollPage', direction: 1 });
      else if (key.pageUp) dispatch({ type: 'scrollPage', direction: -1 });
      else if (key.home || input === 'g') dispatch({ type: 'scrollTo', position: 'top' });
      else if (key.end || input === 'G') dispatch({ type: 'scrollTo', position: 'bottom' });
    },
    { isActive },
  );

  return { page: state.page, visited: state.visited, scroll: state.scroll[state.page] ?? 0, dispatch, goto, step, reportRange };
}
