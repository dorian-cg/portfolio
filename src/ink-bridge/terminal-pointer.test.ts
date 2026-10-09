// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TerminalPointer, type PointerGesture } from './terminal-pointer';

const CELL = { width: 10, height: 20 };
const GRID = { cols: 80, rows: 24 };
const ORIGIN = { left: 16, top: 12 };

/** jsdom has no PointerEvent; this carries the fields the bridge reads. */
function pointerEvent(type: string, init: Partial<PointerEventInit> & { clientX: number; clientY: number }) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, ...init }) as MouseEvent & Record<string, unknown>;
  event.pointerId = init.pointerId ?? 1;
  event.pointerType = init.pointerType ?? 'mouse';
  event.isPrimary = init.isPrimary ?? true;
  return event;
}

describe('TerminalPointer', () => {
  let element: HTMLElement;
  let canvas: HTMLCanvasElement;
  let pointer: TerminalPointer;
  let gestures: PointerGesture[];

  beforeEach(() => {
    element = document.createElement('div');
    canvas = document.createElement('canvas');
    element.append(canvas);
    document.body.append(element);
    canvas.getBoundingClientRect = () =>
      ({
        left: ORIGIN.left,
        top: ORIGIN.top,
        width: CELL.width * GRID.cols,
        height: CELL.height * GRID.rows,
      }) as DOMRect;
    pointer = new TerminalPointer(element, GRID);
    gestures = [];
    pointer.onGesture((gesture) => gestures.push(gesture));
  });

  afterEach(() => {
    pointer.dispose();
    element.remove();
  });

  const at = (col: number, row: number) => ({
    clientX: ORIGIN.left + col * CELL.width + CELL.width / 2,
    clientY: ORIGIN.top + row * CELL.height + CELL.height / 2,
  });
  const fire = (type: string, init: Parameters<typeof pointerEvent>[1]) => canvas.dispatchEvent(pointerEvent(type, init));

  describe('taps', () => {
    it('turns a press and release into a tap at the cell under the pointer', () => {
      fire('pointerdown', at(12, 3));
      fire('pointerup', at(12, 3));
      expect(gestures).toEqual([{ type: 'tap', col: 12, row: 3, pointerType: 'mouse' }]);
    });

    it('measures from the terminal grid, not the page', () => {
      fire('pointerdown', { clientX: ORIGIN.left + 1, clientY: ORIGIN.top + 1 });
      fire('pointerup', { clientX: ORIGIN.left + 1, clientY: ORIGIN.top + 1 });
      expect(gestures).toEqual([{ type: 'tap', col: 0, row: 0, pointerType: 'mouse' }]);
    });

    it('reports the kind of pointer', () => {
      fire('pointerdown', { ...at(1, 1), pointerType: 'touch' });
      fire('pointerup', { ...at(1, 1), pointerType: 'touch' });
      expect(gestures[0]).toMatchObject({ type: 'tap', pointerType: 'touch' });
    });

    it('still taps when the finger wobbles a little', () => {
      const start = at(5, 5);
      fire('pointerdown', { ...start, pointerType: 'touch' });
      fire('pointermove', { clientX: start.clientX + 3, clientY: start.clientY - 3, pointerType: 'touch' });
      fire('pointerup', { clientX: start.clientX + 3, clientY: start.clientY - 3, pointerType: 'touch' });
      expect(gestures).toEqual([{ type: 'tap', col: 5, row: 5, pointerType: 'touch' }]);
    });

    it('ignores other mouse buttons and secondary touches', () => {
      fire('pointerdown', { ...at(1, 1), button: 2 });
      fire('pointerup', { ...at(1, 1), button: 2 });
      fire('pointerdown', { ...at(1, 1), isPrimary: false, pointerType: 'touch' });
      fire('pointerup', { ...at(1, 1), isPrimary: false, pointerType: 'touch' });
      expect(gestures).toEqual([]);
    });

    it('does not tap without a press, or when the press was cancelled', () => {
      fire('pointerup', at(1, 1));
      fire('pointerdown', at(1, 1));
      fire('pointercancel', at(1, 1));
      fire('pointerup', at(1, 1));
      expect(gestures).toEqual([]);
    });
  });

  describe('mouse', () => {
    it('never drags or swipes, because dragging selects text', () => {
      fire('pointerdown', at(10, 10));
      fire('pointermove', at(10, 2));
      fire('pointerup', at(30, 2));
      expect(gestures).toEqual([]);
    });
  });

  describe('touch drag', () => {
    const touch = { pointerType: 'touch' };

    it('scrolls down as the finger moves up, in whole rows', () => {
      fire('pointerdown', { clientX: 100, clientY: 400, ...touch });
      fire('pointermove', { clientX: 100, clientY: 370, ...touch }); // commits to vertical, 30px = 1.5 rows
      fire('pointermove', { clientX: 100, clientY: 340, ...touch });
      expect(gestures).toEqual([
        { type: 'drag', rows: 1 },
        { type: 'drag', rows: 2 },
      ]);
    });

    it('scrolls up as the finger moves down', () => {
      fire('pointerdown', { clientX: 100, clientY: 300, ...touch });
      fire('pointermove', { clientX: 100, clientY: 380, ...touch });
      expect(gestures).toEqual([{ type: 'drag', rows: -4 }]);
    });

    it('carries the part of a row left over into the next move', () => {
      fire('pointerdown', { clientX: 100, clientY: 400, ...touch });
      fire('pointermove', { clientX: 100, clientY: 388, ...touch }); // 12px: past the slop, not a whole row
      expect(gestures).toEqual([]);
      fire('pointermove', { clientX: 100, clientY: 376, ...touch }); // 24px in all
      expect(gestures).toEqual([{ type: 'drag', rows: 1 }]);
    });

    it('is not a tap when it ends', () => {
      fire('pointerdown', { clientX: 100, clientY: 400, ...touch });
      fire('pointermove', { clientX: 100, clientY: 340, ...touch });
      fire('pointerup', { clientX: 100, clientY: 340, ...touch });
      expect(gestures.every((gesture) => gesture.type === 'drag')).toBe(true);
    });
  });

  describe('swipes', () => {
    const swipe = (fromX: number, toX: number, y = 300) => {
      fire('pointerdown', { clientX: fromX, clientY: y, pointerType: 'touch' });
      fire('pointermove', { clientX: (fromX + toX) / 2, clientY: y + 2, pointerType: 'touch' });
      fire('pointerup', { clientX: toX, clientY: y + 4, pointerType: 'touch' });
    };

    it('swipes left towards the next page', () => {
      swipe(300, 200);
      expect(gestures).toEqual([{ type: 'swipe', direction: 'left' }]);
    });

    it('swipes right towards the previous page', () => {
      swipe(200, 300);
      expect(gestures).toEqual([{ type: 'swipe', direction: 'right' }]);
    });

    it('ignores a sideways move that is too short', () => {
      swipe(200, 230);
      expect(gestures).toEqual([]);
    });

    it('does not scroll while swiping sideways', () => {
      swipe(300, 200);
      expect(gestures.some((gesture) => gesture.type === 'drag')).toBe(false);
    });

    it('does not swipe when the move was mostly vertical', () => {
      fire('pointerdown', { clientX: 200, clientY: 400, pointerType: 'touch' });
      fire('pointermove', { clientX: 260, clientY: 200, pointerType: 'touch' });
      fire('pointerup', { clientX: 260, clientY: 200, pointerType: 'touch' });
      expect(gestures.some((gesture) => gesture.type === 'swipe')).toBe(false);
    });
  });

  describe('wheel', () => {
    const wheel = (deltaY: number, deltaMode = 0) =>
      canvas.dispatchEvent(Object.assign(new MouseEvent('wheel', { bubbles: true }), { deltaY, deltaMode }));

    it('scrolls by rows', () => {
      wheel(60);
      wheel(-40);
      expect(gestures).toEqual([
        { type: 'wheel', rows: 3 },
        { type: 'wheel', rows: -2 },
      ]);
    });

    it('scrolls at least a row for a small wheel step', () => {
      wheel(4);
      wheel(-4);
      expect(gestures).toEqual([
        { type: 'wheel', rows: 1 },
        { type: 'wheel', rows: -1 },
      ]);
    });

    it('takes line-based wheels as they are', () => {
      wheel(3, 1);
      expect(gestures).toEqual([{ type: 'wheel', rows: 3 }]);
    });

    it('ignores a wheel that does not move', () => {
      wheel(0);
      expect(gestures).toEqual([]);
    });
  });

  it('stops the browser taking touch gestures for itself', () => {
    expect(element.style.touchAction).toBe('none');
  });

  it('reports nothing before the terminal has a size', () => {
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect;
    fire('pointerdown', at(1, 1));
    fire('pointerup', at(1, 1));
    expect(gestures).toEqual([]);
  });

  it('stops listening once disposed', () => {
    pointer.dispose();
    fire('pointerdown', at(1, 1));
    fire('pointerup', at(1, 1));
    expect(gestures).toEqual([]);
  });

  it('lets a listener unsubscribe', () => {
    const seen: PointerGesture[] = [];
    const subscription = pointer.onGesture((gesture) => seen.push(gesture));
    subscription.dispose();
    fire('pointerdown', at(1, 1));
    fire('pointerup', at(1, 1));
    expect(seen).toEqual([]);
  });
});
