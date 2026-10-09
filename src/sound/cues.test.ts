import { describe, expect, it } from 'vitest';
import { CUES, scalePitch, type CueName } from './cues';

describe('CUES', () => {
  const names = Object.keys(CUES) as CueName[];

  it('gives every cue sound to play and a sensible volume', () => {
    for (const name of names) {
      expect(CUES[name].parts.length, name).toBeGreaterThan(0);
      expect(CUES[name].gain, name).toBeGreaterThan(0);
      expect(CUES[name].gain, name).toBeLessThanOrEqual(1.5);
    }
  });

  it('layers the power-on from two recipes', () => {
    expect(CUES.power.parts).toHaveLength(2);
  });

  it('throttles the cues that fire as things type, count or scroll', () => {
    for (const name of ['line', 'count', 'type', 'scan', 'tick', 'glide', 'edge', 'settle'] as const) {
      expect(CUES[name].gap, name).toBeGreaterThan(0);
    }
  });

  it('keeps repeating ticks quieter than events', () => {
    expect(CUES.type.gain).toBeLessThan(CUES.section.gain);
    expect(CUES.tick.gain).toBeLessThan(CUES.section.gain);
  });
});

describe('scalePitch', () => {
  it('starts at the root and climbs a major pentatonic scale', () => {
    const semitones = [0, 1, 2, 3, 4, 5].map((i) => Math.round(12 * Math.log2(scalePitch(i))));
    expect(semitones).toEqual([0, 2, 4, 7, 9, 12]);
  });

  it('keeps climbing by octaves and never goes below the root', () => {
    expect(scalePitch(10)).toBeCloseTo(4);
    expect(scalePitch(-3)).toBe(1);
    expect(scalePitch(1.9)).toBe(scalePitch(1));
  });
});
