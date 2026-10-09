// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeTerminal } from './ink-bridge/fake-terminal';

const state = vi.hoisted(() => ({ term: undefined as unknown }));

vi.mock('./terminal/create-terminal', () => ({
  createTerminal: vi.fn(async () => ({ term: state.term, fit: {} })),
}));

import { bootstrap } from './bootstrap';

const stripAnsi = (text: string) => text.replace(/\u001B\[[0-9;?<>=]*[A-Za-z]/g, '');
const tick = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('bootstrap', () => {
  let instance: Awaited<ReturnType<typeof bootstrap>> | undefined;

  afterEach(() => {
    instance?.unmount();
    instance = undefined;
  });

  it('renders the Ink app into the terminal', async () => {
    const term = new FakeTerminal(60, 12);
    state.term = term;

    instance = await bootstrap(document.createElement('div'));
    await tick();

    expect(stripAnsi(term.written.join(''))).toContain('Hello from Ink');
  });

  it('lays out for the terminal size', async () => {
    const term = new FakeTerminal(60, 12);
    state.term = term;

    instance = await bootstrap(document.createElement('div'));
    await tick();

    expect(stripAnsi(term.written.join(''))).toContain('60 × 12');
  });

  it('re-renders for the new size when the terminal is resized', async () => {
    const term = new FakeTerminal(60, 12);
    state.term = term;
    instance = await bootstrap(document.createElement('div'));
    await tick();
    term.written.length = 0;

    term.resize(40, 10);
    await tick();

    const output = stripAnsi(term.written.join(''));
    expect(output).toContain('40 × 10');
    // Centred in the new 40-column width (7 characters wide, so ~16 spaces of indent).
    expect(output).toMatch(/^ {15,17}40 × 10/m);
  });

  it('reports real loading milestones in order', async () => {
    state.term = new FakeTerminal(60, 12);
    const onMilestone = vi.fn();

    instance = await bootstrap(document.createElement('div'), { onMilestone });

    expect(onMilestone.mock.calls.map(([name]) => name)).toEqual(['terminal', 'ink']);
  });
});
