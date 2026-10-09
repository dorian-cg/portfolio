import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Intro } from './Intro';
import { INTRO_DURATION } from './intro-script';
import { layoutFor } from './layout';
import { until } from './test-utils';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const layout = layoutFor(100, 30);

describe('Intro', () => {
  it('starts with the banner typing and a hint to skip', async () => {
    const { lastFrame } = render(<Intro layout={layout} onDone={() => {}} />);
    await wait(300);
    expect(lastFrame()).toContain('> DC//');
    expect(lastFrame()).toContain('press any key or tap to skip');
  });

  it('skips on any key, once', async () => {
    const onDone = vi.fn();
    const { stdin } = render(<Intro layout={layout} onDone={onDone} />);
    await wait(50);
    stdin.write('x');
    await wait(50);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('hands over by itself when it has played out', async () => {
    const onDone = vi.fn();
    const { lastFrame } = render(<Intro layout={layout} onDone={onDone} />);
    await wait(INTRO_DURATION - 400);
    expect(onDone).not.toHaveBeenCalled();
    await wait(800);
    expect(onDone).toHaveBeenCalled();
    expect(lastFrame()).toContain('Profile loaded: DORIAN CORTES');
    expect(lastFrame()).toContain('Welcome, visitor.');
  });

  it('fits a phone screen', async () => {
    const { lastFrame } = render(<Intro layout={layoutFor(36, 30)} onDone={() => {}} />);
    await until(lastFrame, (frame) => frame.includes('Welcome, visitor.'));
    for (const line of lastFrame()!.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(36);
    }
    // Nothing is clipped: the scan line reaches 100% and the name is whole.
    expect(lastFrame()).toContain('Profile loaded: DORIAN CORTES');
    expect(lastFrame()).toContain('100%');
    expect(lastFrame()).not.toContain('…');
  });
});
