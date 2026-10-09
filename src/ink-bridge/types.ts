export interface Disposable {
  dispose(): void;
}

export type Event<T> = (listener: (arg: T) => void) => Disposable;

/** The subset of the ghostty-web `Terminal` that the bridges rely on. */
export interface TerminalLike {
  cols: number;
  rows: number;
  write(data: string | Uint8Array): void;
  readonly onData: Event<string>;
  readonly onResize: Event<{ cols: number; rows: number }>;
}
