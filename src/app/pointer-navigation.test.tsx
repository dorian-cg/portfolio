import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakePointer } from '../ink-bridge/fake-pointer';
import { profile } from '../content/profile';
import { App } from './App';
import { MotionProvider } from './fx/motion';
import { Hud } from './hud/Hud';
import { openLink } from './input/open-link';
import { PointerProvider } from './input/pointer';
import { layoutFor } from './layout';
import { until, wait } from './test-utils';

vi.mock('./input/open-link', () => ({ openLink: vi.fn() }));

/** Where `text` is on the screen: the cell a tap on it would hit. */
const locate = (frame: string | undefined, text: string) => {
  const lines = (frame ?? '').split('\n');
  const row = lines.findIndex((line) => line.includes(text));
  if (row < 0) throw new Error(`"${text}" is not on screen:\n${frame}`);
  return { col: lines[row]!.indexOf(text) + 1, row };
};

const body = (frame: string | undefined) => (frame ?? '').split('\n').slice(1).join('\n');

async function open() {
  const pointer = new FakePointer();
  const app = render(<App reducedMotion pointer={pointer.onGesture} />);
  await wait(50);
  return { pointer, ...app };
}

beforeEach(() => vi.mocked(openLink).mockClear());

/** Emits `gesture` until the screen satisfies `condition`: a page that has just opened is still measuring itself. */
async function emitUntil(
  pointer: FakePointer,
  gesture: Parameters<FakePointer['emit']>[0],
  frame: () => string | undefined,
  condition: (frame: string) => boolean,
) {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    pointer.emit(gesture);
    const retryAt = Date.now() + 150;
    while (Date.now() < retryAt) {
      if (condition(frame() ?? '')) return;
      await wait(10);
    }
  }
  throw new Error(`The gesture never gave the expected screen:\n${frame()}`);
}

/** Opens the comms section, and gives its links a moment to start listening for taps. */
async function openComms(pointer: FakePointer, lastFrame: () => string | undefined) {
  const tab = locate(lastFrame(), 'COMMS');
  pointer.tap(tab.col, tab.row);
  await until(lastFrame, (frame) => frame.includes('OPEN CHANNELS'));
  await wait(60);
}

describe('tapping', () => {
  it('opens the section whose tab is tapped', async () => {
    const { pointer, lastFrame } = await open();
    const { col, row } = locate(lastFrame(), 'MISSIONS');
    pointer.tap(col, row);
    await until(lastFrame, (frame) => frame.includes('Jan 2022 – Present'));

    const tab = locate(lastFrame(), 'COMMS');
    pointer.tap(tab.col, tab.row);
    await until(lastFrame, (frame) => frame.includes('OPEN CHANNELS'));
  });

  it('does nothing for a tap on the content', async () => {
    const { pointer, lastFrame } = await open();
    const before = body(lastFrame());
    const { col, row } = locate(lastFrame(), 'SUMMARY');
    pointer.tap(col, row);
    await wait(100);
    expect(body(lastFrame())).toBe(before);
  });

  describe('links', () => {
    it('opens a link that a finger taps', async () => {
      const { pointer, lastFrame } = await open();
      await openComms(pointer, lastFrame);

      const { col, row } = locate(lastFrame(), profile.links[1]!.url);
      pointer.tap(col, row, 'touch');
      expect(openLink).toHaveBeenCalledWith(profile.links[1]!.url);
    });

    it('leaves a mouse click to the terminal, which opens links itself', async () => {
      const { pointer, lastFrame } = await open();
      await openComms(pointer, lastFrame);

      const { col, row } = locate(lastFrame(), profile.links[0]!.url);
      pointer.tap(col, row, 'mouse');
      expect(openLink).not.toHaveBeenCalled();
    });
  });
});

describe('scrolling', () => {
  const openMissions = async () => {
    const app = await open();
    app.stdin.write('2');
    await until(app.lastFrame, (frame) => frame.includes('┃'));
    await wait(100);
    return app;
  };

  it('scrolls with the wheel', async () => {
    const { pointer, lastFrame } = await openMissions();
    const top = body(lastFrame());
    await emitUntil(pointer, { type: 'wheel', rows: 3 }, lastFrame, (frame) => body(frame) !== top);
    await emitUntil(pointer, { type: 'wheel', rows: -3 }, lastFrame, (frame) => body(frame) === top);
  });

  it('scrolls as a finger drags, and stops at the end', async () => {
    const { pointer, lastFrame } = await openMissions();
    await emitUntil(pointer, { type: 'drag', rows: 500 }, lastFrame, (frame) => frame.includes('Selenium'));
    await emitUntil(pointer, { type: 'drag', rows: -500 }, lastFrame, (frame) =>
      frame.includes('Serve as primary technical owner'),
    );
  });
});

describe('swiping', () => {
  it('moves to the next section on a left swipe and back on a right swipe', async () => {
    const { pointer, lastFrame } = await open();
    expect(lastFrame()).toContain('SUMMARY');
    pointer.emit({ type: 'swipe', direction: 'left' });
    await until(lastFrame, (frame) => frame.includes('Jan 2022 – Present'));
    pointer.emit({ type: 'swipe', direction: 'right' });
    await until(lastFrame, (frame) => frame.includes('SUMMARY'));
  });
});

describe('the intro', () => {
  it('is skipped by a tap, and the tap goes no further', async () => {
    const pointer = new FakePointer();
    const { lastFrame } = render(<App pointer={pointer.onGesture} />);
    await until(lastFrame, (frame) => frame.includes('> '));
    expect(lastFrame()).toContain('or tap to skip');

    pointer.tap(5, 5);
    await until(lastFrame, (frame) => frame.includes('PROFILE'));
    expect(lastFrame()).not.toContain('or tap to skip');
  });

  it('ignores swipes and scrolling until the HUD is up', async () => {
    const pointer = new FakePointer();
    const { lastFrame } = render(<App pointer={pointer.onGesture} />);
    await until(lastFrame, (frame) => frame.includes('> '));
    pointer.emit({ type: 'swipe', direction: 'left' });
    pointer.emit({ type: 'wheel', rows: 4 });
    await wait(50);
    expect(lastFrame()).toContain('> ');
    expect(lastFrame()).not.toContain('MISSIONS');
  });
});

describe('the narrow pager', () => {
  const mount = () => {
    const pointer = new FakePointer();
    const onStep = vi.fn();
    const { lastFrame } = render(
      <PointerProvider source={pointer.onGesture}>
        <MotionProvider reduced>
          <Hud layout={layoutFor(40, 30)} page="missions" onStep={onStep} />
        </MotionProvider>
      </PointerProvider>,
    );
    return { pointer, onStep, lastFrame };
  };

  it('steps back on the left arrow and forward on the right arrow', async () => {
    const { pointer, onStep, lastFrame } = mount();
    await wait(50);
    const left = locate(lastFrame(), '‹');
    const right = locate(lastFrame(), '›');

    pointer.tap(left.col - 1, left.row, 'touch');
    expect(onStep).toHaveBeenLastCalledWith(-1);
    pointer.tap(right.col - 1, right.row, 'touch');
    expect(onStep).toHaveBeenLastCalledWith(1);
  });

  it('leaves room for a thumb that misses by a cell or two', async () => {
    const { pointer, onStep, lastFrame } = mount();
    await wait(50);
    const left = locate(lastFrame(), '‹');

    pointer.tap(left.col + 1, left.row + 1, 'touch'); // beside and below
    pointer.tap(left.col - 1, left.row - 1, 'touch'); // above
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenCalledWith(-1);
  });

  it('does not step for a tap in the middle of the title', async () => {
    const { pointer, onStep, lastFrame } = mount();
    await wait(50);
    const title = locate(lastFrame(), 'MISSIONS');
    pointer.tap(title.col, title.row, 'touch');
    expect(onStep).not.toHaveBeenCalled();
  });
});
