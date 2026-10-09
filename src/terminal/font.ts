export const fontFamily =
  '"MesloLGS Nerd Font", Menlo, Consolas, "DejaVu Sans Mono", monospace';

export const fontSize = 15;

/** The faces declared in index.html; the terminal draws all four. */
const FACES = ['normal 400', 'normal 700', 'italic 400', 'italic 700'];

/**
 * Loads every face of the terminal font. Canvas text does not wait for web
 * fonts, so this must finish before the terminal measures its cells.
 * A font that fails to load just means the fallback fonts are used.
 */
export async function loadFonts(fonts: Pick<FontFaceSet, 'load'> | undefined = document.fonts) {
  if (!fonts) {
    return;
  }
  await Promise.allSettled(FACES.map((face) => fonts.load(`${face} ${fontSize}px ${fontFamily}`)));
}

export interface CellMetrics {
  /** Cell width in px, rounded up like the terminal does. */
  width: number;
  height: number;
  /** Distance from the top of a cell to the text baseline. */
  baseline: number;
}

type MeasureContext = Pick<CanvasRenderingContext2D, 'measureText'> & { font: string };

const defaultContext = (): MeasureContext | null =>
  document.createElement('canvas').getContext('2d');

/**
 * Measures one terminal cell the same way ghostty-web does, so the boot screen
 * can draw its text on exactly the same grid as the terminal.
 */
export function measureCell(createContext: () => MeasureContext | null = defaultContext): CellMetrics {
  const context = createContext();
  if (!context) {
    return { width: 9, height: 18, baseline: 13 };
  }
  context.font = `${fontSize}px ${fontFamily}`;
  const m = context.measureText('M');
  const ascent = m.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = m.actualBoundingBoxDescent || fontSize * 0.2;
  return {
    width: Math.ceil(m.width),
    height: Math.ceil(ascent + descent) + 2,
    baseline: Math.ceil(ascent) + 1,
  };
}
