import { describe, expect, it } from 'vitest';
import { theme } from '../../terminal/theme';
import { hud } from './palette';

describe('hud palette', () => {
  it('takes every colour from the terminal theme, so the two never drift apart', () => {
    const themeColours = new Set(Object.values(theme));
    for (const colour of Object.values(hud)) {
      expect(themeColours.has(colour)).toBe(true);
    }
  });

  it('gives each role its own colour', () => {
    expect(new Set(Object.values(hud)).size).toBe(Object.values(hud).length);
  });
});
