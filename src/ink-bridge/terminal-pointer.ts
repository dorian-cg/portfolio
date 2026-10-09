import type { Disposable, Event } from './types';

export type PointerGesture =
  /** A press and release in place, at a terminal cell. */
  | { type: 'tap'; col: number; row: number; pointerType: string }
  /** The mouse wheel: rows to scroll down (negative: up). */
  | { type: 'wheel'; rows: number }
  /** A finger dragging along the screen: rows to scroll down (negative: up), as the finger moves. */
  | { type: 'drag'; rows: number }
  /** A finger flicked sideways and let go. `left` means the content was pulled left, towards the next page. */
  | { type: 'swipe'; direction: 'left' | 'right' };

/** The part of the terminal the pointer needs: its grid size. */
export interface GridLike {
  cols: number;
  rows: number;
}

/** How far a press may wander, in px, and still count as a tap. */
const TAP_SLOP = 8;
/** How far a finger must travel sideways, in px, to count as a swipe. */
const SWIPE_DISTANCE = 48;

interface Press {
  id: number;
  type: string;
  startX: number;
  startY: number;
  lastY: number;
  /** Which way the finger has committed to moving, once it has moved beyond a tap. */
  axis?: 'vertical' | 'horizontal';
  /** Vertical travel, in px, not yet reported as whole rows. */
  pending: number;
}

/**
 * Turns the browser's pointer events on the terminal into taps at terminal
 * cells, scrolling and swipes. ghostty-web does not report the mouse to the
 * app, so Ink would otherwise never hear about them.
 *
 * Mouse presses only ever tap, because dragging with the mouse selects text.
 * Touch and pen can also drag and swipe.
 */
export class TerminalPointer {
  readonly onGesture: Event<PointerGesture> = (listener) => {
    this.listeners.add(listener);
    return { dispose: () => void this.listeners.delete(listener) };
  };

  private readonly listeners = new Set<(gesture: PointerGesture) => void>();
  private press: Press | undefined;
  private readonly subscriptions: Disposable[] = [];

  constructor(
    private readonly element: HTMLElement,
    private readonly grid: GridLike,
  ) {
    // Without this the browser takes touch gestures for itself (scrolling, zooming).
    element.style.touchAction = 'none';
    this.listen('pointerdown', this.onDown);
    this.listen('pointermove', this.onMove);
    this.listen('pointerup', this.onUp);
    this.listen('pointercancel', this.onCancel);
    this.listen('wheel', this.onWheel);
  }

  dispose(): void {
    this.subscriptions.forEach((subscription) => subscription.dispose());
    this.subscriptions.length = 0;
    this.listeners.clear();
    this.press = undefined;
  }

  /** The grid's origin and cell size in CSS px, read the way ghostty-web reads it. */
  private metrics(): { left: number; top: number; width: number; height: number } | undefined {
    const rect = (this.element.querySelector('canvas') ?? this.element).getBoundingClientRect();
    const width = rect.width / this.grid.cols;
    const height = rect.height / this.grid.rows;
    return width > 0 && height > 0 ? { left: rect.left, top: rect.top, width, height } : undefined;
  }

  private emit(gesture: PointerGesture): void {
    this.listeners.forEach((listener) => listener(gesture));
  }

  private listen<K extends 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'wheel'>(
    type: K,
    handler: (event: K extends 'wheel' ? WheelEvent : PointerEvent) => void,
  ): void {
    const listener = handler as EventListener;
    this.element.addEventListener(type, listener);
    this.subscriptions.push({ dispose: () => this.element.removeEventListener(type, listener) });
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }
    this.press = {
      id: event.pointerId,
      type: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      pending: 0,
    };
  };

  private readonly onMove = (event: PointerEvent): void => {
    const press = this.press;
    if (!press || press.id !== event.pointerId || press.type === 'mouse') {
      return;
    }
    if (!press.axis) {
      const dx = event.clientX - press.startX;
      const dy = event.clientY - press.startY;
      if (Math.hypot(dx, dy) <= TAP_SLOP) {
        return;
      }
      press.axis = Math.abs(dy) >= Math.abs(dx) ? 'vertical' : 'horizontal';
      // The first rows of travel count too, so the content does not lag behind the finger.
      press.lastY = press.startY;
    }
    const metrics = this.metrics();
    if (press.axis !== 'vertical' || !metrics) {
      return;
    }
    // Dragging up pulls the content up: it scrolls down.
    press.pending += press.lastY - event.clientY;
    press.lastY = event.clientY;
    const rows = Math.trunc(press.pending / metrics.height);
    if (rows !== 0) {
      press.pending -= rows * metrics.height;
      this.emit({ type: 'drag', rows });
    }
  };

  private readonly onUp = (event: PointerEvent): void => {
    const press = this.press;
    if (!press || press.id !== event.pointerId) {
      return;
    }
    this.press = undefined;

    if (!press.axis) {
      const metrics = this.metrics();
      // A mouse drag (selecting text) that ends somewhere else is not a tap.
      const moved = Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > TAP_SLOP;
      if (metrics && !moved) {
        this.emit({
          type: 'tap',
          col: Math.floor((event.clientX - metrics.left) / metrics.width),
          row: Math.floor((event.clientY - metrics.top) / metrics.height),
          pointerType: press.type,
        });
      }
      return;
    }
    const dx = event.clientX - press.startX;
    if (press.axis === 'horizontal' && Math.abs(dx) >= SWIPE_DISTANCE) {
      this.emit({ type: 'swipe', direction: dx < 0 ? 'left' : 'right' });
    }
  };

  private readonly onCancel = (event: PointerEvent): void => {
    if (this.press?.id === event.pointerId) {
      this.press = undefined;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    const metrics = this.metrics();
    if (event.deltaY === 0 || !metrics) {
      return;
    }
    // deltaMode 1 is already in lines; 0 is pixels.
    const rows = event.deltaMode === 1 ? event.deltaY : event.deltaY / metrics.height;
    this.emit({ type: 'wheel', rows: Math.sign(rows) * Math.max(1, Math.round(Math.abs(rows))) });
  };
}
