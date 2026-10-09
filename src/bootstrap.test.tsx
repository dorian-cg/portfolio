// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { until } from './app/test-utils';
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

  // The visitor prefers reduced motion, so the HUD shows its final state at once.
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({ matches: true, media: query })) as typeof window.matchMedia;
  });

  afterEach(() => {
    instance?.unmount();
    instance = undefined;
  });

  it('renders the Ink app into the terminal', async () => {
    const term = new FakeTerminal(60, 12);
    state.term = term;

    instance = await bootstrap(document.createElement('div'));
    await tick();

    expect(stripAnsi(term.written.join(''))).toContain('DORIAN CORTES');
  });

  it('lays out for the terminal size', async () => {
    const term = new FakeTerminal(80, 24);
    state.term = term;

    instance = await bootstrap(document.createElement('div'));
    await tick();

    // 80 columns is the medium layout: section tabs and no pager.
    const output = stripAnsi(term.written.join(''));
    expect(output).toContain('MISSIONS');
    expect(output).not.toContain('/6');
  });

  it('re-renders for the new size when the terminal is resized', async () => {
    const term = new FakeTerminal(80, 24);
    state.term = term;
    instance = await bootstrap(document.createElement('div'));
    await tick();
    term.written.length = 0;

    term.resize(40, 20);
    await tick();

    // 40 columns is the narrow layout, which pages instead of showing tabs.
    expect(stripAnsi(term.written.join(''))).toContain('2/6 PROFILE');
  });

  it('holds the app back until the boot screen has gone', async () => {
    const term = new FakeTerminal(80, 24);
    state.term = term;
    // With motion the intro plays, and it must not start behind the boot screen.
    window.matchMedia = ((query: string) => ({ matches: false, media: query })) as typeof window.matchMedia;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => (release = resolve));

    instance = await bootstrap(document.createElement('div'), { ready });
    await tick();
    expect(stripAnsi(term.written.join(''))).not.toContain('DC//');

    release();
    await until(() => stripAnsi(term.written.join('')), (output) => output.includes('> DC//'));
  });

  it('reports real loading milestones in order', async () => {
    state.term = new FakeTerminal(60, 12);
    const onMilestone = vi.fn();

    instance = await bootstrap(document.createElement('div'), { onMilestone });

    expect(onMilestone.mock.calls.map(([name]) => name)).toEqual(['terminal', 'ink']);
  });
});
