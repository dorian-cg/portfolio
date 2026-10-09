import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { MotionProvider } from '../fx/motion';
import { until, wait } from '../test-utils';
import { StatusDot } from './StatusDot';

describe('StatusDot', () => {
  it('starts lit', () => {
    expect(render(<StatusDot />).lastFrame()).toBe('●');
  });

  it('blinks: goes dark, then lights again', async () => {
    const { lastFrame } = render(<StatusDot />);
    await until(lastFrame, (frame) => frame.trim() === '', 3000);
    await until(lastFrame, (frame) => frame === '●', 3000);
  });

  it('stays lit when motion is reduced', async () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <StatusDot />
      </MotionProvider>,
    );
    await wait(1500);
    expect(lastFrame()).toBe('●');
  });
});
