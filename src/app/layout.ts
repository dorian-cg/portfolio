export type LayoutMode = 'wide' | 'medium' | 'narrow';

export interface Layout {
  mode: LayoutMode;
  columns: number;
  rows: number;
  /** Width of the identity column; only used by the wide layout. */
  sidebarWidth: number;
  /** Emblem and globe are the first things to go when the terminal is short. */
  showEmblem: boolean;
  showGlobe: boolean;
}

export const WIDE_MIN_COLUMNS = 100;
export const MEDIUM_MIN_COLUMNS = 60;

/** Rows needed before the identity panel can afford each decoration. */
const EMBLEM_MIN_ROWS = 22;
const GLOBE_MIN_ROWS = 34;

/** Picks the layout for a terminal of `columns` × `rows` cells. */
export function layoutFor(columns: number, rows: number): Layout {
  const mode: LayoutMode =
    columns >= WIDE_MIN_COLUMNS ? 'wide' : columns >= MEDIUM_MIN_COLUMNS ? 'medium' : 'narrow';
  return {
    mode,
    columns,
    rows,
    sidebarWidth: 34,
    showEmblem: rows >= EMBLEM_MIN_ROWS,
    // The globe only has room next to the emblem in the wide sidebar, or on the
    // phone's identity page, which has the whole screen to itself.
    showGlobe: mode !== 'medium' && rows >= GLOBE_MIN_ROWS,
  };
}
