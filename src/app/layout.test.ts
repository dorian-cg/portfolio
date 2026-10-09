import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout';

describe('layoutFor', () => {
  it.each([
    [140, 'wide'],
    [100, 'wide'],
    [99, 'medium'],
    [60, 'medium'],
    [59, 'narrow'],
    [40, 'narrow'],
  ] as const)('uses the %i column layout as %s', (columns, mode) => {
    expect(layoutFor(columns, 40).mode).toBe(mode);
  });

  it('carries the terminal size', () => {
    expect(layoutFor(120, 36)).toMatchObject({ columns: 120, rows: 36 });
  });

  it('drops the globe first and then the emblem as the terminal gets shorter', () => {
    expect(layoutFor(140, 40)).toMatchObject({ showEmblem: true, showGlobe: true });
    expect(layoutFor(140, 28)).toMatchObject({ showEmblem: true, showGlobe: false });
    expect(layoutFor(140, 16)).toMatchObject({ showEmblem: false, showGlobe: false });
  });

  it('never shows the globe in the medium layout', () => {
    expect(layoutFor(80, 60).showGlobe).toBe(false);
  });
});
