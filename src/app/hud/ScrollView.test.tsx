import { Box, Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { until } from '../test-utils';
import { ScrollView } from './ScrollView';

const lines = Array.from({ length: 20 }, (_, index) => `line ${String(index + 1).padStart(2, '0')}`);

const view = (scroll: number, reportRange = vi.fn(), height = 6) => (
  <Box height={height} width={30}>
    <ScrollView page="missions" scroll={scroll} reportRange={reportRange} entrance={false}>
      {lines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
    </ScrollView>
  </Box>
);

describe('ScrollView', () => {
  it('shows the top of the content, clipped to its height', () => {
    const { lastFrame } = render(view(0));
    expect(lastFrame()).toContain('line 01');
    expect(lastFrame()).toContain('line 06');
    expect(lastFrame()).not.toContain('line 07');
  });

  it('shows the content from the scroll offset', () => {
    const { lastFrame } = render(view(10));
    expect(lastFrame()).not.toContain('line 10');
    expect(lastFrame()).toContain('line 11');
    expect(lastFrame()).toContain('line 16');
    expect(lastFrame()).not.toContain('line 17');
  });

  it('reports how far the content can scroll, and how much of it shows', async () => {
    const reportRange = vi.fn();
    render(view(0, reportRange));
    await until(
      () => String(reportRange.mock.calls.length),
      (calls) => calls !== '0',
    );
    expect(reportRange).toHaveBeenLastCalledWith('missions', { max: 14, viewport: 6 });
  });

  it('draws a scrollbar, with the thumb at the top, then at the bottom', async () => {
    const top = render(view(0));
    await until(top.lastFrame, (frame) => frame.includes('┃'));
    const column = (frame: string | undefined) => frame!.split('\n').map((row) => row.charAt(row.length - 1));
    expect(column(top.lastFrame())[0]).toBe('┃');
    expect(column(top.lastFrame())[5]).toBe('│');

    const bottom = render(view(14));
    await until(bottom.lastFrame, (frame) => frame.includes('┃'));
    expect(column(bottom.lastFrame())[0]).toBe('│');
    expect(column(bottom.lastFrame())[5]).toBe('┃');
  });

  it('has no scrollbar when everything fits', async () => {
    const reportRange = vi.fn();
    const { lastFrame } = render(view(0, reportRange, 30));
    await until(
      () => String(reportRange.mock.calls.length),
      (calls) => calls !== '0',
    );
    expect(lastFrame()).not.toContain('┃');
    expect(reportRange).toHaveBeenLastCalledWith('missions', { max: 0, viewport: 30 });
  });
});
