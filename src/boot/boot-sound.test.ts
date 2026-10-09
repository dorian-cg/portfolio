import { describe, expect, it } from 'vitest';
import { CUES, scalePitch } from '../sound/cues';
import type { BootEvent } from './boot-screen';
import { bootCue } from './boot-sound';

describe('bootCue', () => {
  it('plays a cue of the same name for the plain events', () => {
    for (const type of ['power', 'line', 'ready', 'out', 'fail'] as const) {
      expect(bootCue({ type })).toEqual({ cue: type });
      expect(CUES[type]).toBeDefined();
    }
  });

  it('raises the memory count in pitch as it fills', () => {
    const pitch = (progress: number) => bootCue({ type: 'count', progress }).pitch!;
    expect(pitch(0)).toBeLessThan(pitch(0.5));
    expect(pitch(0.5)).toBeLessThan(pitch(1));
    expect(pitch(0)).toBeCloseTo(0.8);
    expect(pitch(1)).toBeCloseTo(1.3);
  });

  it('gives each OK the next note up the scale', () => {
    const pitches = [0, 1, 2, 3, 4, 5].map((index) => bootCue({ type: 'ok', index }).pitch!);
    expect([...pitches].sort((a, b) => a - b)).toEqual(pitches);
    expect(new Set(pitches).size).toBe(6);
    expect(pitches[2]).toBeCloseTo(0.9 * scalePitch(2));
  });

  it('maps every kind of boot event to a cue that exists', () => {
    const events: BootEvent[] = [
      { type: 'power' },
      { type: 'line' },
      { type: 'count', progress: 0.5 },
      { type: 'ok', index: 0 },
      { type: 'ready' },
      { type: 'out' },
      { type: 'fail' },
    ];
    for (const event of events) {
      expect(CUES[bootCue(event).cue]).toBeDefined();
    }
  });
});
