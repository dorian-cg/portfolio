// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fontFamily, fontSize, loadFonts, measureCell } from './font';

describe('loadFonts', () => {
  it('loads all four faces of the terminal font', async () => {
    const load = vi.fn(async (_font: string) => [] as FontFace[]);
    await loadFonts({ load });

    expect(load).toHaveBeenCalledTimes(4);
    const requested = load.mock.calls.map(([font]) => font);
    expect(requested).toEqual(
      expect.arrayContaining([
        `normal 400 ${fontSize}px ${fontFamily}`,
        `normal 700 ${fontSize}px ${fontFamily}`,
        `italic 400 ${fontSize}px ${fontFamily}`,
        `italic 700 ${fontSize}px ${fontFamily}`,
      ]),
    );
  });

  it('carries on with fallback fonts when a face fails to load', async () => {
    const load = vi.fn(async (_font: string): Promise<FontFace[]> => {
      throw new Error('network');
    });
    await expect(loadFonts({ load })).resolves.toBeUndefined();
  });

  it('does nothing without the font loading API', async () => {
    await expect(loadFonts(undefined)).resolves.toBeUndefined();
  });
});

describe('measureCell', () => {
  const contextWith = (metrics: Partial<TextMetrics>) => {
    const context = { font: '', measureText: vi.fn(() => metrics as TextMetrics) };
    return { context, create: () => context };
  };

  it('rounds the width up and derives height and baseline like the terminal', () => {
    const { context, create } = contextWith({
      width: 9.02,
      actualBoundingBoxAscent: 10.9,
      actualBoundingBoxDescent: 0.2,
    });

    expect(measureCell(create)).toEqual({ width: 10, height: 14, baseline: 12 });
    expect(context.font).toBe(`${fontSize}px ${fontFamily}`);
    expect(context.measureText).toHaveBeenCalledWith('M');
  });

  it('estimates ascent and descent when the font reports none', () => {
    const { create } = contextWith({ width: 9 });
    expect(measureCell(create)).toEqual({
      width: 9,
      height: Math.ceil(fontSize * 0.8 + fontSize * 0.2) + 2,
      baseline: Math.ceil(fontSize * 0.8) + 1,
    });
  });

  it('falls back to a default cell without a canvas', () => {
    expect(measureCell(() => null)).toEqual({ width: 9, height: 18, baseline: 13 });
  });
});
