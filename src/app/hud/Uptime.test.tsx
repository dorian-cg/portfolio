import { render } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Uptime } from './Uptime';

describe('Uptime', () => {
  afterEach(() => vi.useRealTimers());

  it('counts from the start of the career and ticks every second', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-08T14:22:31Z') });
    const { lastFrame } = render(<Uptime />);
    expect(lastFrame()).toBe('UPTIME 9y 01m 07d 14:22:31');

    await vi.advanceTimersByTimeAsync(2000);
    expect(lastFrame()).toBe('UPTIME 9y 01m 07d 14:22:33');
  });
});
