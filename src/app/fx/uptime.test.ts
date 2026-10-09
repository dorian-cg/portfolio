import { describe, expect, it } from 'vitest';
import { formatUptime } from './uptime';

const at = (iso: string) => new Date(iso);

describe('formatUptime', () => {
  it('is zero at the start', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2017-09-01T00:00:00Z'))).toBe('0y 00m 00d 00:00:00');
  });

  it('counts the clock', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2017-09-01T03:04:05Z'))).toBe('0y 00m 00d 03:04:05');
  });

  it('counts days within a month', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2017-09-20T12:00:00Z'))).toBe('0y 00m 19d 12:00:00');
  });

  it('counts whole years and months', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2026-10-08T14:22:31Z'))).toBe('9y 01m 07d 14:22:31');
  });

  it('does not count a month that has not completed', () => {
    expect(formatUptime(at('2017-09-15T00:00:00Z'), at('2018-09-14T23:59:59Z'))).toBe('0y 11m 30d 23:59:59');
  });

  it('rolls over to a year on the anniversary', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2018-09-01T00:00:00Z'))).toBe('1y 00m 00d 00:00:00');
  });

  it('copes with months that are shorter than the start day', () => {
    expect(formatUptime(at('2020-01-31T00:00:00Z'), at('2020-03-01T00:00:00Z'))).toMatch(/^0y 0[01]m \d\dd 00:00:00$/);
  });

  it('reads zero for times before the start', () => {
    expect(formatUptime(at('2017-09-01T00:00:00Z'), at('2016-01-01T00:00:00Z'))).toBe('0y 00m 00d 00:00:00');
  });
});
