export type Tone = 'text' | 'ok' | 'fail';

export interface Span {
  text: string;
  tone: Tone;
}

export type Row = Span[];

/** Where the boot rows get drawn. */
export interface Display {
  draw(rows: readonly Row[]): void;
  dispose(): void;
}

export interface DisplayStyle {
  /** CSS font shorthand without style or weight, e.g. `15px "Family", monospace`. */
  font: string;
  cell: { width: number; height: number; baseline: number };
  colors: Record<Tone | 'background', string>;
}

/**
 * Draws boot rows onto a canvas the way ghostty-web draws terminal cells: one
 * `fillText` per character, at `column * cellWidth` and `row * cellHeight +
 * baseline`. Using the same canvas text path as the terminal makes the glyphs
 * rasterise identically, which DOM text does not guarantee on every platform.
 */
export class CanvasDisplay implements Display {
  private readonly context: CanvasRenderingContext2D;
  private rows: readonly Row[] = [];
  private readonly onResize = () => this.fit();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly style: DisplayStyle,
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.context = context;
    this.fit();
    window.addEventListener('resize', this.onResize);
  }

  draw(rows: readonly Row[]): void {
    this.rows = rows;
    const { context, style } = this;
    const { cell, colors } = style;

    context.fillStyle = colors.background;
    context.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    context.font = style.font;

    rows.forEach((row, rowIndex) => {
      let column = 0;
      for (const span of row) {
        context.fillStyle = colors[span.tone];
        for (const character of span.text) {
          if (character !== ' ') {
            context.fillText(character, column * cell.width, rowIndex * cell.height + cell.baseline);
          }
          column++;
        }
      }
    });
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }

  /** Matches the canvas to its CSS size, at the screen's pixel density. */
  private fit(): void {
    const { canvas, context } = this;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    // Resizing resets the context, so its state is set up again each time.
    context.scale(ratio, ratio);
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    this.draw(this.rows);
  }
}

/** Creates a canvas filling `container` and a display that draws into it. */
export function createCanvasDisplay(container: HTMLElement, style: DisplayStyle): CanvasDisplay {
  const canvas = document.createElement('canvas');
  canvas.className = 'boot-canvas';
  container.prepend(canvas);
  return new CanvasDisplay(canvas, style);
}
