// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootOptions, prefersReducedMotion } from './preferences';

const stubMatchMedia = (matches: boolean) =>
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches })));

describe('boot preferences', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects reduced motion', () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('assumes motion is fine when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('plays the sequence by default, always at the same speed', () => {
    stubMatchMedia(false);
    expect(bootOptions()).toEqual({ skip: false });
  });

  it('skips the sequence for reduced motion', () => {
    stubMatchMedia(true);
    expect(bootOptions()).toEqual({ skip: true });
  });
});
