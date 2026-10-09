import { describe, expect, it } from 'vitest';
import { scrollbarThumb } from './scrollbar';

describe('scrollbarThumb', () => {
  it('fills the track when the content fits', () => {
    expect(scrollbarThumb(10, 8, 0)).toEqual({ top: 0, size: 10 });
  });

  it('sizes the thumb by the share of the content that is visible', () => {
    expect(scrollbarThumb(10, 20, 0).size).toBe(5);
    expect(scrollbarThumb(10, 100, 0).size).toBe(1);
  });

  it('moves from the top of the track to the bottom', () => {
    expect(scrollbarThumb(10, 20, 0).top).toBe(0);
    expect(scrollbarThumb(10, 20, 10)).toEqual({ top: 5, size: 5 });
  });

  it('keeps the thumb inside the track for out-of-range offsets', () => {
    expect(scrollbarThumb(10, 20, 99).top).toBe(5);
    expect(scrollbarThumb(10, 20, -4).top).toBe(0);
  });

  it('copes with an unmeasured view', () => {
    expect(scrollbarThumb(0, 0, 0)).toEqual({ top: 0, size: 0 });
  });
});
