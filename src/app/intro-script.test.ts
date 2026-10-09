import { describe, expect, it } from 'vitest';
import { INTRO_DURATION, INTRO_WIDTH, introLines, scanBar, SCAN_END, SCAN_START } from './intro-script';

const text = (time: number) => introLines(time).map((line) => line.label + line.value);

describe('scanBar', () => {
  it('is empty at 0% and full at 100%', () => {
    expect(scanBar(0)).toBe('▕░░░░░░░░░░░░░░▏   0%');
    expect(scanBar(100)).toBe('▕██████████████▏ 100%');
  });

  it('fills in proportion', () => {
    expect(scanBar(50)).toBe('▕███████░░░░░░░▏  50%');
  });

  it('stays within 0 to 100', () => {
    expect(scanBar(-20)).toBe(scanBar(0));
    expect(scanBar(250)).toBe(scanBar(100));
  });
});

describe('introLines', () => {
  it('has nothing at the very start but the first, still empty, line', () => {
    expect(text(0)).toEqual(['']);
  });

  it('types the banner', () => {
    const early = text(200)[0]!;
    expect(early.length).toBeGreaterThan(0);
    expect('DC//OS v1.0 :: portfolio'.startsWith(early)).toBe(true);
    expect(text(700)[0]).toBe('DC//OS v1.0 :: portfolio');
  });

  it('starts the scan after the banner and fills the bar', () => {
    expect(introLines(SCAN_START - 1).some((line) => line.kind === 'scan')).toBe(false);
    const during = introLines((SCAN_START + SCAN_END) / 2).find((line) => line.kind === 'scan')!;
    expect(during.value).toContain('50%');
    expect(introLines(SCAN_END + 10).find((line) => line.kind === 'scan')!.value).toContain('100%');
  });

  it('loads the profile and then welcomes the visitor, without claiming to know who the visitor is', () => {
    const lines = introLines(INTRO_DURATION);
    expect(lines.map((line) => line.kind)).toEqual(['plain', 'scan', 'loaded', 'welcome']);
    expect(text(INTRO_DURATION)).toEqual([
      'DC//OS v1.0 :: portfolio',
      expect.stringContaining('Loading'),
      'Profile loaded: DORIAN CORTES',
      'Welcome, visitor.',
    ]);
    const everything = text(INTRO_DURATION).join(' ').toLowerCase();
    expect(everything).not.toMatch(/identity|confirmed|biometric|access|login|authenticat/);
  });

  it('splits the profile line into label and highlighted name', () => {
    const line = introLines(INTRO_DURATION).find((l) => l.kind === 'loaded')!;
    expect(line.label).toBe('Profile loaded: ');
    expect(line.value).toBe('DORIAN CORTES');
  });

  it('adds lines in order and never removes them', () => {
    let count = 0;
    for (let time = 0; time <= INTRO_DURATION; time += 50) {
      const now = introLines(time).length;
      expect(now).toBeGreaterThanOrEqual(count);
      count = now;
    }
  });

  it('never needs more columns than the intro has', () => {
    for (let time = 0; time <= INTRO_DURATION; time += 50) {
      for (const line of introLines(time)) {
        expect(`${line.prompt} ${line.label}${line.value}`.length + 1).toBeLessThanOrEqual(INTRO_WIDTH);
      }
    }
  });

  it('has typed everything with time to spare before it hands over', () => {
    const finished = text(INTRO_DURATION - 150);
    expect(finished[finished.length - 1]).toBe('Welcome, visitor.');
  });
});
