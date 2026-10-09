import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { BrailleCanvas } from './braille';
import { drawEmblem, Emblem } from './emblem';
import { MotionProvider } from './motion';

const canvasAt = (seconds: number, columns = 15, rows = 7) => {
  const canvas = new BrailleCanvas(columns, rows);
  drawEmblem(canvas, seconds);
  return canvas;
};

const drawn = (seconds: number, columns?: number, rows?: number) => canvasAt(seconds, columns, rows).render().join('\n');

/** The leftmost and rightmost dot columns that are set. */
function extent(canvas: BrailleCanvas) {
  let left = Infinity;
  let right = -Infinity;
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      if (canvas.has(x, y)) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return { left, right, width: right - left + 1 };
}

const setDotsInColumn = (canvas: BrailleCanvas, x: number) =>
  Array.from({ length: canvas.height }, (_, y) => y).filter((y) => canvas.has(x, y));

// A quarter turn at 1.2 rad/s.
const EDGE_ON = Math.PI / 2 / 1.2;

describe('drawEmblem', () => {
  it('draws something that is not blank', () => {
    expect(drawn(0)).toMatch(/[⠁-⣿]/);
  });

  it('is the same at the same time', () => {
    expect(drawn(1.5)).toBe(drawn(1.5));
  });

  it('turns over time', () => {
    expect(drawn(0)).not.toBe(drawn(1));
  });

  it('comes back after a full turn', () => {
    expect(drawn(0)).toBe(drawn((2 * Math.PI) / 1.2));
  });

  it('works at a tiny size', () => {
    expect(drawn(0, 5, 3)).toMatch(/[⠁-⣿]/);
  });

  it('stays inside the canvas at every angle', () => {
    for (let seconds = 0; seconds < 6; seconds += 0.25) {
      const { left, right } = extent(canvasAt(seconds));
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThan(30);
    }
  });

  describe('facing the viewer', () => {
    const canvas = canvasAt(0);
    const { left, right } = extent(canvas);

    it('is a D: a tall stem on the left and a curve that closes on the right', () => {
      const stem = setDotsInColumn(canvas, left + 1);
      expect(stem.length).toBeGreaterThan(15);

      // The curve ends at the extreme right in one dot column, near the middle, not at the top or bottom.
      const tip = setDotsInColumn(canvas, right);
      expect(tip.length).toBeGreaterThan(0);
      expect(tip.every((y) => Math.abs(y - 13.5) < 8)).toBe(true);
    });

    it('has a hole in the middle', () => {
      const middleColumn = Math.round((left + right) / 2) - 1;
      const dots = setDotsInColumn(canvas, middleColumn);
      const gap = Math.max(...dots.slice(1).map((y, i) => y - dots[i]!));
      expect(gap).toBeGreaterThan(6);
    });
  });

  describe('edge on', () => {
    it('is much narrower than facing the viewer', () => {
      expect(extent(canvasAt(EDGE_ON)).width).toBeLessThan(extent(canvasAt(0)).width / 2);
    });
  });
});

describe('Emblem', () => {
  it('renders at the requested size', () => {
    const { lastFrame } = render(<Emblem columns={15} rows={7} />);
    const lines = lastFrame()!.split('\n');
    expect(lines).toHaveLength(7);
    for (const line of lines) {
      expect(line).toHaveLength(15);
    }
  });

  it('holds still, facing the viewer, when motion is reduced', async () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Emblem />
      </MotionProvider>,
    );
    const first = lastFrame();
    expect(first).toBe(drawn(0));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(lastFrame()).toBe(first);
  });

  it('turns when motion is allowed', async () => {
    const { lastFrame } = render(<Emblem />);
    const first = lastFrame();
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(lastFrame()).not.toBe(first);
  });
});
