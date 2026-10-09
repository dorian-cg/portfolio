// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    textarea?: HTMLTextAreaElement;
    open = vi.fn(() => {
      calls.push('open');
      this.textarea = document.createElement('textarea');
    });
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

  describe('on-screen keyboard', () => {
    const original = window.matchMedia;
    afterEach(() => {
      window.matchMedia = original;
    });

    it('is kept from opening on a touch screen, where the app is driven by touch', async () => {
      window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
      const { term } = await createTerminal(document.createElement('div'));
      expect(term.textarea?.getAttribute('inputmode')).toBe('none');
    });

    it('is left alone with a mouse and keyboard', async () => {
      window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
      const { term } = await createTerminal(document.createElement('div'));
      expect(term.textarea?.hasAttribute('inputmode')).toBe(false);
    });
  });
});
