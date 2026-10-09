import { fontFamily, fontSize, type CellMetrics } from '../terminal/font';
import { theme } from '../terminal/theme';
import type { DisplayStyle } from './display';

/** How the boot rows are drawn: the terminal's font, cell grid and colours. */
export function bootDisplayStyle(cell: CellMetrics): DisplayStyle {
  return {
    font: `${fontSize}px ${fontFamily}`,
    cell,
    colors: {
      background: theme.background,
      text: theme.foreground,
      ok: theme.green,
      fail: theme.red,
    },
  };
}

/** Gives the overlay's CSS (background, cursor block) the terminal's cell size and colours. */
export function applyBootTheme(root: HTMLElement, cell: CellMetrics): void {
  const set = (name: string, value: string) => root.style.setProperty(`--boot-${name}`, value);
  set('cell-w', `${cell.width}px`);
  set('cell-h', `${cell.height}px`);
  set('bg', theme.background);
  set('cursor', theme.cursor);
}
