import { EventEmitter } from 'node:events';
import type { Disposable, TerminalLike } from './types';

/**
 * Presents a ghostty-web terminal as the `stdin` stream that Ink reads from.
 * Keystrokes arrive through `onData`, are queued, and are handed out by
 * `read()` after a `readable` event, like a paused Node stream.
 */
export class TerminalStdin extends EventEmitter {
  readonly isTTY = true;

  private readonly queue: string[] = [];
  private readonly subscription: Disposable;

  constructor(terminal: TerminalLike) {
    super();
    this.subscription = terminal.onData((data) => {
      this.queue.push(data);
      this.emit('readable');
    });
  }

  read(): string | null {
    return this.queue.shift() ?? null;
  }

  // The terminal is always "raw" and UTF-8, so these exist only because Ink
  // expects them on a TTY stdin.
  setRawMode(): this {
    return this;
  }
  setEncoding(): this {
    return this;
  }
  ref(): this {
    return this;
  }
  unref(): this {
    return this;
  }
  resume(): this {
    return this;
  }
  pause(): this {
    return this;
  }

  dispose(): void {
    this.subscription.dispose();
    this.queue.length = 0;
    this.removeAllListeners();
  }
}
