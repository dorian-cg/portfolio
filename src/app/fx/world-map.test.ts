import { describe, expect, it } from 'vitest';
import { isLand, MAP_COLUMNS, MAP_ROWS } from './world-map';

describe('isLand', () => {
  it.each([
    // Costa Rica itself is narrower than a 2.5° cell; the globe's pin marks it.
    ['Mexico', 23, -102],
    ['Colombia', 4, -73],
    ['Kansas', 38.5, -98],
    ['Brazil', -10, -52],
    ['Sahara', 23, 12],
    ['Siberia', 62, 100],
    ['Australia', -25, 134],
    ['Antarctica', -80, 0],
  ])('has land at %s', (_, lat, lon) => {
    expect(isLand(lat, lon)).toBe(true);
  });

  it.each([
    ['the middle of the Pacific', 0, -150],
    ['the south Atlantic', -30, -15],
    ['the Indian Ocean', -20, 80],
    ['the Arctic Ocean', 85, 0],
  ])('has sea in %s', (_, lat, lon) => {
    expect(isLand(lat, lon)).toBe(false);
  });

  it('wraps longitudes around the globe', () => {
    expect(isLand(38.5, -98 + 360)).toBe(isLand(38.5, -98));
    expect(isLand(38.5, -98 - 360)).toBe(isLand(38.5, -98));
  });

  it('copes with the poles and the date line', () => {
    expect(() => [isLand(90, 180), isLand(-90, -180), isLand(0, 180)]).not.toThrow();
  });

  it('is a full grid', () => {
    expect([MAP_COLUMNS, MAP_ROWS]).toEqual([144, 72]);
  });
});
