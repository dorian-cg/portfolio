import { describe, expect, it } from 'vitest';
import { BrailleCanvas } from './braille';

const code = (char: string) => char.charCodeAt(0) - 0x2800;

describe('BrailleCanvas', () => {
  it('is two dots wide and four tall per cell', () => {
    const canvas = new BrailleCanvas(3, 2);
    expect([canvas.width, canvas.height]).toEqual([6, 8]);
  });

  it('renders an empty canvas as blank braille cells of the right size', () => {
    const lines = new BrailleCanvas(3, 2).render();
    expect(lines).toEqual(['⠀⠀⠀', '⠀⠀⠀']);
  });

  it('maps each dot of a cell to its own bit', () => {
    const bits = [
      [0, 0, 0x01],
      [0, 1, 0x02],
      [0, 2, 0x04],
      [1, 0, 0x08],
      [1, 1, 0x10],
      [1, 2, 0x20],
      [0, 3, 0x40],
      [1, 3, 0x80],
    ] as const;
    for (const [x, y, bit] of bits) {
      const canvas = new BrailleCanvas(1, 1);
      canvas.set(x, y);
      expect(code(canvas.render()[0]!)).toBe(bit);
    }
  });

  it('puts dots in the right cell', () => {
    const canvas = new BrailleCanvas(2, 2);
    canvas.set(2, 4);
    const [top, bottom] = canvas.render();
    expect(top).toBe('⠀⠀');
    expect(code(bottom![1]!)).toBe(0x01 - 1 + 1);
    expect(bottom![0]).toBe('⠀');
  });

  it('combines dots in one cell', () => {
    const canvas = new BrailleCanvas(1, 1);
    canvas.set(0, 0);
    canvas.set(1, 3);
    expect(code(canvas.render()[0]!)).toBe(0x01 | 0x80);
  });

  it('ignores dots outside the canvas', () => {
    const canvas = new BrailleCanvas(1, 1);
    [[-1, 0], [0, -1], [2, 0], [0, 4], [50, 50]].forEach(([x, y]) => canvas.set(x!, y!));
    expect(canvas.render()).toEqual(['⠀']);
  });

  it('reports which dots are set', () => {
    const canvas = new BrailleCanvas(2, 1);
    canvas.set(3, 2);
    expect(canvas.has(3, 2)).toBe(true);
    expect(canvas.has(2, 2)).toBe(false);
    expect(canvas.has(-1, 0)).toBe(false);
  });

  it('draws a line between two dots, endpoints included', () => {
    const canvas = new BrailleCanvas(4, 1);
    canvas.line(0, 0, 7, 3);
    expect(canvas.has(0, 0)).toBe(true);
    expect(canvas.has(7, 3)).toBe(true);
  });

  // Arc samples are not exactly on the compass points, so look at the dots around them.
  const near = (canvas: BrailleCanvas, x: number, y: number) =>
    [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => canvas.has(x + dx, y + dy)));

  it('draws a circle that is closed and the right size', () => {
    const canvas = new BrailleCanvas(10, 5);
    canvas.circle(9.5, 9.5, 8);
    expect(near(canvas, 17.5, 9.5)).toBe(true);
    expect(near(canvas, 1.5, 9.5)).toBe(true);
    expect(near(canvas, 9.5, 1.5)).toBe(true);
    expect(near(canvas, 9.5, 17.5)).toBe(true);
    expect(canvas.has(9.5, 9.5)).toBe(false);
  });

  it('draws only the requested arc', () => {
    const canvas = new BrailleCanvas(10, 5);
    canvas.arc(9.5, 9.5, 8, 0, Math.PI / 2);
    expect(canvas.has(17.5, 9.5)).toBe(true); // east, the start
    expect(canvas.has(9.5, 1.5)).toBe(true); // north, the end
    expect(near(canvas, 1.5, 9.5)).toBe(false); // west
  });
});
