// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: string[] = [];
const state = vi.hoisted(() => ({ instances: [] as any[], options: undefined as any }));

vi.mock('ghostty-web', () => {
  class Terminal {
    constructor(options: unknown) {
      state.options = options;
      state.instances.push(this);
      calls.push('new Terminal');
    }
    loadAddon = vi.fn(() => calls.push('loadAddon'));
    open = vi.fn(() => calls.push('open'));
    focus = vi.fn(() => calls.push('focus'));
  }
  class FitAddon {
    fit = vi.fn(() => calls.push('fit'));
    observeResize = vi.fn(() => calls.push('observeResize'));
  }
  return { Terminal, FitAddon, init: vi.fn(async () => void calls.push('init')) };
});

import { createTerminal } from './create-terminal';
import { fontFamily } from './font';
import { theme } from './theme';

describe('createTerminal', () => {
  beforeEach(() => {
    calls.length = 0;
    state.instances.length = 0;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: vi.fn(async () => void calls.push('fonts.load')) },
    });
  });

  it('initialises ghostty before creating the terminal', async () => {
    await createTerminal(document.createElement('div'));
    expect(calls.indexOf('init')).toBeLessThan(calls.indexOf('new Terminal'));
  });

  it('configures the terminal from the theme', async () => {
    await createTerminal(document.createElement('div'));
    expect(state.options).toMatchObject({ convertEol: true, fontFamily, theme });
  });

  it('opens the terminal in the container with a fit addon', async () => {
    const container = document.createElement('div');
    const { term, fit } = await createTerminal(container);
    expect(term.open).toHaveBeenCalledWith(container);
    expect(term.loadAddon).toHaveBeenCalledWith(fit);
  });

  it('loads the fonts before the terminal measures its cells', async () => {
    await createTerminal(document.createElement('div'));
    expect(calls.indexOf('fonts.load')).toBeGreaterThan(calls.indexOf('init'));
    expect(calls.lastIndexOf('fonts.load')).toBeLessThan(calls.indexOf('new Terminal'));
  });

  it('fits once the terminal is open, then observes resizes and focuses', async () => {
    await createTerminal(document.createElement('div'));
    expect(calls.indexOf('open')).toBeLessThan(calls.indexOf('fit'));
    expect(calls.indexOf('fit')).toBeLessThan(calls.indexOf('observeResize'));
    expect(calls).toContain('focus');
  });
});
