import type { Disposable, Event, TerminalLike } from './types';

/** In-memory `TerminalLike` for tests, with helpers to simulate the user. */
export class FakeTerminal implements TerminalLike {
  written: string[] = [];
  private dataListeners = new Set<(data: string) => void>();
  private resizeListeners = new Set<(size: { cols: number; rows: number }) => void>();

  constructor(
    public cols = 80,
    public rows = 24,
  ) {}

  write(data: string | Uint8Array): void {
    this.written.push(typeof data === 'string' ? data : new TextDecoder().decode(data));
  }

  readonly onData: Event<string> = (listener) => this.subscribe(this.dataListeners, listener);
  readonly onResize: Event<{ cols: number; rows: number }> = (listener) =>
    this.subscribe(this.resizeListeners, listener);

  get listenerCount(): number {
    return this.dataListeners.size + this.resizeListeners.size;
  }

  type(data: string): void {
    this.dataListeners.forEach((listener) => listener(data));
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.resizeListeners.forEach((listener) => listener({ cols, rows }));
  }

  private subscribe<T>(set: Set<(arg: T) => void>, listener: (arg: T) => void): Disposable {
    set.add(listener);
    return { dispose: () => void set.delete(listener) };
  }
}
