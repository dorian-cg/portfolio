import { FitAddon, Terminal, init } from 'ghostty-web';
import { fontFamily, fontSize, loadFonts } from './font';
import { theme } from './theme';

export interface TerminalHandle {
  term: Terminal;
  fit: FitAddon;
}

/**
 * Loads ghostty-web and mounts a terminal sized to fill `container`.
 * Resolves only once the font has loaded and the terminal has been fitted, so
 * the first frame Ink renders already uses the real columns and rows.
 */
export async function createTerminal(container: HTMLElement): Promise<TerminalHandle> {
  await init();
  // Before the terminal exists: it measures its cells from the font on open.
  await loadFonts();

  const term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    fontFamily,
    fontSize,
    theme,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(container);

  fit.fit();
  fit.observeResize();
  term.focus();

  return { term, fit };
}
