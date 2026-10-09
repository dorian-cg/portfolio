import { Box, Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { FakePointer } from '../../ink-bridge/fake-pointer';
import { Tap, PointerProvider, usePointerGesture } from './pointer';

const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

/** A 20×5 screen with a 6×1 target at column 8, row 2, inside a bordered, padded box. */
function Screen({ onTap, slopX, slopY, ignore }: Parameters<typeof Tap>[0] extends infer P ? Partial<P> : never) {
  return (
    <Box width={20} height={5} paddingLeft={3} paddingTop={1} borderStyle="single">
      <Box marginLeft={3} marginTop={0}>
        <Tap onTap={onTap ?? (() => {})} slopX={slopX} slopY={slopY} ignore={ignore} width={6} height={1}>
          <Text>target</Text>
        </Tap>
      </Box>
    </Box>
  );
}

const mount = (pointer: FakePointer, props: Parameters<typeof Screen>[0] = {}) =>
  render(
    <PointerProvider source={pointer.onGesture}>
      <Screen {...props} />
    </PointerProvider>,
  );

/** Finds `text` in the rendered frame, where a tap would hit it. */
const locate = (frame: string, text: string) => {
  const lines = frame.split('\n');
  const row = lines.findIndex((line) => line.includes(text));
  return { col: lines[row]!.indexOf(text), row };
};

describe('Tap', () => {
  it('fires for a tap on the element, wherever it is on the screen', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    const { lastFrame } = mount(pointer, { onTap });
    await wait();
    const { col, row } = locate(lastFrame()!, 'target');

    pointer.tap(col, row);
    pointer.tap(col + 5, row);
    expect(onTap).toHaveBeenCalledTimes(2);
  });

  it('ignores taps beside, above and below it', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    const { lastFrame } = mount(pointer, { onTap });
    await wait();
    const { col, row } = locate(lastFrame()!, 'target');

    pointer.tap(col - 1, row);
    pointer.tap(col + 6, row);
    pointer.tap(col, row - 1);
    pointer.tap(col, row + 1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('counts taps just outside it when given slop, for fingers', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    const { lastFrame } = mount(pointer, { onTap, slopX: 2, slopY: 1 });
    await wait();
    const { col, row } = locate(lastFrame()!, 'target');

    pointer.tap(col - 2, row);
    pointer.tap(col + 7, row);
    pointer.tap(col, row - 1);
    pointer.tap(col, row + 1);
    expect(onTap).toHaveBeenCalledTimes(4);
    pointer.tap(col - 3, row);
    pointer.tap(col, row + 2);
    expect(onTap).toHaveBeenCalledTimes(4);
  });

  it('can ignore some pointers', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    const { lastFrame } = mount(pointer, { onTap, ignore: (tap) => tap.pointerType === 'mouse' });
    await wait();
    const { col, row } = locate(lastFrame()!, 'target');

    pointer.tap(col, row, 'mouse');
    expect(onTap).not.toHaveBeenCalled();
    pointer.tap(col, row, 'touch');
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('passes the tap on', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    const { lastFrame } = mount(pointer, { onTap });
    await wait();
    const { col, row } = locate(lastFrame()!, 'target');

    pointer.tap(col, row, 'touch');
    expect(onTap).toHaveBeenCalledWith({ type: 'tap', col, row, pointerType: 'touch' });
  });

  it('ignores scrolling and swipes', async () => {
    const pointer = new FakePointer();
    const onTap = vi.fn();
    mount(pointer, { onTap });
    await wait();
    pointer.emit({ type: 'wheel', rows: 1 });
    pointer.emit({ type: 'drag', rows: 1 });
    pointer.emit({ type: 'swipe', direction: 'left' });
    expect(onTap).not.toHaveBeenCalled();
  });

  it('stops listening when unmounted', async () => {
    const pointer = new FakePointer();
    const { unmount } = mount(pointer);
    await wait();
    expect(pointer.listenerCount).toBe(1);
    unmount();
    expect(pointer.listenerCount).toBe(0);
  });

  it('works without a pointer, as in a plain terminal', async () => {
    const { lastFrame } = render(<Screen />);
    await wait();
    expect(lastFrame()).toContain('target');
  });
});

describe('usePointerGesture', () => {
  function Listener({ onGesture, active = true }: { onGesture: () => void; active?: boolean }) {
    usePointerGesture(onGesture, active);
    return <Text>listening</Text>;
  }

  it('hears every kind of gesture while active', async () => {
    const pointer = new FakePointer();
    const onGesture = vi.fn();
    render(
      <PointerProvider source={pointer.onGesture}>
        <Listener onGesture={onGesture} />
      </PointerProvider>,
    );
    await wait();
    pointer.emit({ type: 'wheel', rows: 2 });
    pointer.tap(1, 1);
    expect(onGesture).toHaveBeenCalledTimes(2);
  });

  it('hears nothing while inactive', async () => {
    const pointer = new FakePointer();
    const onGesture = vi.fn();
    render(
      <PointerProvider source={pointer.onGesture}>
        <Listener onGesture={onGesture} active={false} />
      </PointerProvider>,
    );
    await wait();
    pointer.tap(1, 1);
    expect(onGesture).not.toHaveBeenCalled();
    expect(pointer.listenerCount).toBe(0);
  });
});
