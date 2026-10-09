import { PAGES, SECTIONS, type Page } from './hud/sections';
import type { LayoutMode } from './layout';

/** How far a section's content overflows its viewport, as last measured. */
export interface ScrollRange {
  /** The furthest the content can scroll, in rows. */
  max: number;
  /** Visible rows, used for page-up and page-down. */
  viewport: number;
}

export interface NavState {
  page: Page;
  /**
   * Pages whose entrance effects have finished. Opening a page clears it, so
   * the effects play every time, but a layout change that remounts the page
   * once they are done does not replay them.
   */
  visited: Partial<Record<Page, true>>;
  scroll: Partial<Record<Page, number>>;
  range: Partial<Record<Page, ScrollRange>>;
}

export type NavAction =
  | { type: 'goto'; page: Page }
  /** The page's entrance effects have had time to finish. */
  | { type: 'seen'; page: Page }
  /** Moves to the next (+1) or previous (-1) page, wrapping around. */
  | { type: 'step'; delta: 1 | -1; pages: readonly Page[] }
  | { type: 'scroll'; delta: number }
  | { type: 'scrollPage'; direction: 1 | -1 }
  | { type: 'scrollTo'; position: 'top' | 'bottom' }
  /** A view reports how big its content is; keeps the offset inside it. */
  | { type: 'range'; page: Page; range: ScrollRange };

export const initialNav: NavState = { page: 'identity', visited: {}, scroll: {}, range: {} };

/** The pages that can be stepped through: the identity page exists only on narrow screens. */
export const pagesFor = (mode: LayoutMode): readonly Page[] =>
  mode === 'narrow' ? PAGES : SECTIONS.map((section) => section.id);

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** Moves to `page`, whose entrance effects play again. */
const leave = (state: NavState, page: Page): NavState => {
  if (page === state.page) {
    return state;
  }
  const { [page]: _replays, ...visited } = state.visited;
  return { ...state, page, visited };
};

const scrolled = (state: NavState, offset: (current: number, range: ScrollRange) => number): NavState => {
  const range = state.range[state.page] ?? { max: 0, viewport: 0 };
  const next = clamp(offset(state.scroll[state.page] ?? 0, range), range.max);
  return { ...state, scroll: { ...state.scroll, [state.page]: next } };
};

export function navigate(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'goto':
      return leave(state, action.page);
    case 'seen':
      return state.visited[action.page] ? state : { ...state, visited: { ...state.visited, [action.page]: true } };
    case 'step': {
      const { pages } = action;
      // The current page may not be in `pages` (identity, once the screen widens).
      const index = Math.max(0, pages.indexOf(state.page));
      const page = pages[(index + action.delta + pages.length) % pages.length]!;
      return leave(state, page);
    }
    case 'scroll':
      return scrolled(state, (current) => current + action.delta);
    case 'scrollPage':
      return scrolled(state, (current, range) => current + action.direction * Math.max(1, range.viewport - 1));
    case 'scrollTo':
      return scrolled(state, (_, range) => (action.position === 'top' ? 0 : range.max));
    case 'range': {
      const current = state.scroll[action.page] ?? 0;
      return {
        ...state,
        range: { ...state.range, [action.page]: action.range },
        scroll: { ...state.scroll, [action.page]: clamp(current, action.range.max) },
      };
    }
  }
}
