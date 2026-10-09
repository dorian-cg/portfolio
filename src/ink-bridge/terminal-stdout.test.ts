import { describe, expect, it, vi } from 'vitest';
import { FakeTerminal } from './fake-terminal';
import { TerminalStdout } from './terminal-stdout';

describe('TerminalStdout', () => {
  it('reports itself as a TTY with the terminal size', () => {
    const stdout = new TerminalStdout(new FakeTerminal(100, 30));
    expect(stdout.isTTY).toBe(true);
    expect(stdout.columns).toBe(100);
    expect(stdout.rows).toBe(30);
  });

  it('forwards writes to the terminal', () => {
    const term = new FakeTerminal();
    const stdout = new TerminalStdout(term);
    expect(stdout.write('hello')).toBe(true);
    expect(term.written).toEqual(['hello']);
  });

  it('updates the size before emitting resize', () => {
    const term = new FakeTerminal(80, 24);
    const stdout = new TerminalStdout(term);
    const seen: Array<[number, number]> = [];
    stdout.on('resize', () => seen.push([stdout.columns, stdout.rows]));

    term.resize(40, 10);

    expect(seen).toEqual([[40, 10]]);
  });

  it('does not emit resize when the size is unchanged', () => {
    const term = new FakeTerminal(80, 24);
    const stdout = new TerminalStdout(term);
    const onResize = vi.fn();
    stdout.on('resize', onResize);

    term.resize(80, 24);

    expect(onResize).not.toHaveBeenCalled();
  });

  it('stops listening after dispose', () => {
    const term = new FakeTerminal();
    const stdout = new TerminalStdout(term);
    const onResize = vi.fn();
    stdout.on('resize', onResize);

    stdout.dispose();
    term.resize(10, 10);

    expect(onResize).not.toHaveBeenCalled();
    expect(term.listenerCount).toBe(0);
  });
});
