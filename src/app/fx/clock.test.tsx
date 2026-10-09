import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNow } from './clock';

function Clock({ intervalMs }: { intervalMs?: number }) {
  return <Text>{useNow(intervalMs).toISOString()}</Text>;
}

describe('useNow', () => {
  afterEach(() => vi.useRealTimers());

  it('shows the current time and refreshes it every second', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-08T12:00:00Z') });
    const { lastFrame } = render(<Clock />);
    expect(lastFrame()).toBe('2026-10-08T12:00:00.000Z');

    await vi.advanceTimersByTimeAsync(3000);
    expect(lastFrame()).toBe('2026-10-08T12:00:03.000Z');
  });

  it('can refresh at another rate', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-08T12:00:00Z') });
    const { lastFrame } = render(<Clock intervalMs={250} />);
    await vi.advanceTimersByTimeAsync(500);
    expect(lastFrame()).toBe('2026-10-08T12:00:00.500Z');
  });

  it('stops its timer when unmounted', () => {
    vi.useFakeTimers();
    const { unmount } = render(<Clock />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const before = vi.getTimerCount();
    unmount();
    expect(vi.getTimerCount()).toBeLessThan(before);
  });
});
