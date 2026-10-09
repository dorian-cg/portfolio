import type { PointerGesture } from './terminal-pointer';
import type { Disposable, Event } from './types';

/** A `PointerSource` for tests, with helpers to simulate the visitor. */
export class FakePointer {
  private readonly listeners = new Set<(gesture: PointerGesture) => void>();

  readonly onGesture: Event<PointerGesture> = (listener) => {
    this.listeners.add(listener);
    return { dispose: () => void this.listeners.delete(listener) } satisfies Disposable;
  };

  get listenerCount(): number {
    return this.listeners.size;
  }

  emit(gesture: PointerGesture): void {
    this.listeners.forEach((listener) => listener(gesture));
  }

  tap(col: number, row: number, pointerType = 'mouse'): void {
    this.emit({ type: 'tap', col, row, pointerType });
  }
}
