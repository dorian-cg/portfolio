import { describe, expect, it, vi } from 'vitest';
import { FakeTerminal } from './fake-terminal';
import { TerminalStdin } from './terminal-stdin';

describe('TerminalStdin', () => {
  it('reports itself as a TTY', () => {
    expect(new TerminalStdin(new FakeTerminal()).isTTY).toBe(true);
  });

  it('queues typed data and emits readable', () => {
    const term = new FakeTerminal();
    const stdin = new TerminalStdin(term);
    const onReadable = vi.fn();
    stdin.on('readable', onReadable);

    term.type('a');
    term.type('b');

    expect(onReadable).toHaveBeenCalledTimes(2);
    expect(stdin.read()).toBe('a');
    expect(stdin.read()).toBe('b');
    expect(stdin.read()).toBeNull();
  });

  it('exposes chainable no-op stream controls that Ink expects', () => {
    const stdin = new TerminalStdin(new FakeTerminal());
    expect(stdin.setRawMode()).toBe(stdin);
    expect(stdin.setEncoding()).toBe(stdin);
    expect(stdin.ref()).toBe(stdin);
    expect(stdin.unref()).toBe(stdin);
    expect(stdin.resume()).toBe(stdin);
    expect(stdin.pause()).toBe(stdin);
  });

  it('stops listening and drops queued data after dispose', () => {
    const term = new FakeTerminal();
    const stdin = new TerminalStdin(term);
    term.type('a');

    stdin.dispose();
    term.type('b');

    expect(stdin.read()).toBeNull();
    expect(term.listenerCount).toBe(0);
  });
});
