// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasDisplay, createCanvasDisplay, type DisplayStyle } from './display';

const style: DisplayStyle = {
  font: '15px Test',
  cell: { width: 10, height: 18, baseline: 13 },
  colors: { background: '#000', text: '#fff', ok: '#0f0', fail: '#f00' },
};

const createContext = () => ({
  fillStyle: '' as string,
  font: '',
  textBaseline: '',
  textAlign: '',
  scale: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
});

const createCanvas = (width = 200, height = 100) => {
  const context = createContext();
  const canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: height });
  return { canvas, context };
};

describe('CanvasDisplay', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 2);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sizes the canvas to its CSS size at the screen pixel density', () => {
    const { canvas, context } = createCanvas(200, 100);
    new CanvasDisplay(canvas, style);

    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
    expect(context.scale).toHaveBeenCalledWith(2, 2);
    expect(context.textBaseline).toBe('alphabetic');
    expect(context.textAlign).toBe('left');
  });

  it('draws one character per cell on the terminal grid', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    context.fillText.mockClear();

    display.draw([[{ text: 'ab', tone: 'text' }], [], [{ text: 'c', tone: 'text' }]]);

    expect(context.font).toBe('15px Test');
    expect(context.fillText.mock.calls).toEqual([
      ['a', 0, 13],
      ['b', 10, 13],
      ['c', 0, 2 * 18 + 13],
    ]);
  });

  it('skips spaces but still advances a column for them', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    context.fillText.mockClear();

    display.draw([[{ text: 'a b', tone: 'text' }]]);

    expect(context.fillText.mock.calls).toEqual([
      ['a', 0, 13],
      ['b', 20, 13],
    ]);
  });

  it('continues the column count across spans and colours each by tone', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    context.fillText.mockClear();
    const used: string[] = [];
    context.fillText.mockImplementation(() => void used.push(context.fillStyle));

    display.draw([
      [
        { text: 'ab', tone: 'text' },
        { text: 'OK', tone: 'ok' },
        { text: '!', tone: 'fail' },
      ],
    ]);

    expect(context.fillText.mock.calls.map(([character, x]) => [character, x])).toEqual([
      ['a', 0],
      ['b', 10],
      ['O', 20],
      ['K', 30],
      ['!', 40],
    ]);
    expect(used).toEqual(['#fff', '#fff', '#0f0', '#0f0', '#f00']);
  });

  it('counts characters outside the BMP as one column', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    context.fillText.mockClear();

    display.draw([[{ text: '😀a', tone: 'text' }]]);

    expect(context.fillText.mock.calls.map(([character, x]) => [character, x])).toEqual([
      ['😀', 0],
      ['a', 10],
    ]);
  });

  it('clears to the background before each draw', () => {
    const { canvas, context } = createCanvas(200, 100);
    const display = new CanvasDisplay(canvas, style);
    context.fillRect.mockClear();

    display.draw([]);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
  });

  it('redraws the same rows when the window is resized', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    display.draw([[{ text: 'a', tone: 'text' }]]);
    context.fillText.mockClear();

    window.dispatchEvent(new Event('resize'));

    expect(context.fillText.mock.calls).toEqual([['a', 0, 13]]);
  });

  it('stops redrawing on resize once disposed', () => {
    const { canvas, context } = createCanvas();
    const display = new CanvasDisplay(canvas, style);
    display.draw([[{ text: 'a', tone: 'text' }]]);
    display.dispose();
    context.fillText.mockClear();

    window.dispatchEvent(new Event('resize'));

    expect(context.fillText).not.toHaveBeenCalled();
  });

  it('fails clearly when no 2D context is available', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => new CanvasDisplay(canvas, style)).toThrow('Failed to get 2D rendering context');
  });
});

describe('createCanvasDisplay', () => {
  it('puts a canvas at the start of the container, under later siblings', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      createContext() as unknown as CanvasRenderingContext2D,
    );
    const container = document.createElement('div');
    container.innerHTML = '<span class="boot-cursor"></span>';

    createCanvasDisplay(container, style);

    expect(container.firstElementChild?.tagName).toBe('CANVAS');
    expect(container.firstElementChild?.className).toBe('boot-canvas');
    expect(container.lastElementChild?.className).toBe('boot-cursor');
    vi.restoreAllMocks();
  });
});
