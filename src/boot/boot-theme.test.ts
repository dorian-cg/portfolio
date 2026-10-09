// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fontFamily, fontSize } from '../terminal/font';
import { theme } from '../terminal/theme';
import { applyBootTheme, bootDisplayStyle } from './boot-theme';

const cell = { width: 10, height: 18, baseline: 13 };

describe('bootDisplayStyle', () => {
  it('uses the terminal font and the measured cell', () => {
    const style = bootDisplayStyle(cell);
    expect(style.font).toBe(`${fontSize}px ${fontFamily}`);
    expect(style.cell).toEqual(cell);
  });

  it('uses the terminal theme colours', () => {
    expect(bootDisplayStyle(cell).colors).toEqual({
      background: theme.background,
      text: theme.foreground,
      ok: theme.green,
      fail: theme.red,
    });
  });
});

describe('applyBootTheme', () => {
  it('gives the overlay CSS the cell size and terminal colours', () => {
    const root = document.createElement('div');
    applyBootTheme(root, cell);
    const get = (name: string) => root.style.getPropertyValue(`--boot-${name}`);

    expect(get('cell-w')).toBe('10px');
    expect(get('cell-h')).toBe('18px');
    expect(get('bg')).toBe(theme.background);
    expect(get('cursor')).toBe(theme.cursor);
  });
});
