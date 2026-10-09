// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { hasCoarsePointer } from './touch';

const original = window.matchMedia;

afterEach(() => {
  window.matchMedia = original;
});

describe('hasCoarsePointer', () => {
  it('is true on a touch screen', () => {
    window.matchMedia = ((query: string) => ({ matches: query === '(pointer: coarse)' })) as typeof window.matchMedia;
    expect(hasCoarsePointer()).toBe(true);
  });

  it('is false with a mouse', () => {
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    expect(hasCoarsePointer()).toBe(false);
  });

  it('is false when matchMedia is missing or throws', () => {
    window.matchMedia = undefined as never;
    expect(hasCoarsePointer()).toBe(false);
    window.matchMedia = (() => {
      throw new Error('no');
    }) as never;
    expect(hasCoarsePointer()).toBe(false);
  });
});
