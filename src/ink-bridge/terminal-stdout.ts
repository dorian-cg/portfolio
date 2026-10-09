import { EventEmitter } from 'node:events';
import type { Disposable, TerminalLike } from './types';

/**
 * Presents a ghostty-web terminal as the `stdout` stream that Ink writes to.
 * It reports the terminal size and emits `resize` when that size changes.
 */
export class TerminalStdout extends EventEmitter {
  readonly isTTY = true;
  columns: number;
  rows: number;

  private readonly subscription: Disposable;

  constructor(private readonly terminal: TerminalLike) {
    super();
    this.columns = terminal.cols;
    this.rows = terminal.rows;
    this.subscription = terminal.onResize(({ cols, rows }) => {
      if (cols === this.columns && rows === this.rows) {
        return;
      }
      // Update the size first: Ink reads it when handling the event.
      this.columns = cols;
      this.rows = rows;
      this.emit('resize');
    });
  }

  write(data: string | Uint8Array): boolean {
    this.terminal.write(data);
    return true;
  }

  dispose(): void {
    this.subscription.dispose();
    this.removeAllListeners();
  }
}
