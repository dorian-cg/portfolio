/** Bit for each dot of a braille cell, indexed [column][row]. */
const DOT = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
] as const;

/**
 * A grid of dots drawn with braille characters: each terminal cell is 2 dots
 * wide and 4 tall, so a `columns` × `rows` canvas has `2 * columns` × `4 * rows` dots.
 */
export class BrailleCanvas {
  readonly width: number;
  readonly height: number;
  private readonly cells: Uint8Array;

  constructor(
    readonly columns: number,
    readonly rows: number,
  ) {
    this.width = columns * 2;
    this.height = rows * 4;
    this.cells = new Uint8Array(columns * rows);
  }

  /** Turns a dot on. Dots outside the canvas are ignored, so shapes can overhang. */
  set(x: number, y: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) {
      return;
    }
    this.cells[(py >> 2) * this.columns + (px >> 1)]! |= DOT[px & 1]![py & 3]!;
  }

  has(x: number, y: number): boolean {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) {
      return false;
    }
    return (this.cells[(py >> 2) * this.columns + (px >> 1)]! & DOT[px & 1]![py & 3]!) !== 0;
  }

  /** Turns on the dots along the arc of a circle from angle `from` to `to` (radians, 0 = east, counter-clockwise). */
  arc(cx: number, cy: number, radius: number, from: number, to: number): void {
    const steps = Math.max(8, Math.ceil(Math.abs(to - from) * radius * 2));
    for (let i = 0; i <= steps; i++) {
      const angle = from + ((to - from) * i) / steps;
      this.set(cx + Math.cos(angle) * radius, cy - Math.sin(angle) * radius);
    }
  }

  circle(cx: number, cy: number, radius: number): void {
    this.arc(cx, cy, radius, 0, Math.PI * 2);
  }

  line(x0: number, y0: number, x1: number, y1: number): void {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= steps; i++) {
      this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
    }
  }

  /** One string per row of cells. Empty cells are U+2800, a blank that keeps the width. */
  render(): string[] {
    return Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.columns }, (_, column) =>
        String.fromCharCode(0x2800 + this.cells[row * this.columns + column]!),
      ).join(''),
    );
  }
}
