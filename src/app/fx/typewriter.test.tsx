import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Entrance, MotionProvider } from './motion';
import { Typed, typedCount } from './typewriter';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('typedCount', () => {
  it('types nothing before the delay', () => {
    expect(typedCount(0, 100, 50)).toBe(0);
    expect(typedCount(100, 100, 50)).toBe(0);
  });

  it('types at the given speed', () => {
    expect(typedCount(1000, 0, 50)).toBe(50);
    expect(typedCount(600, 100, 50)).toBe(25);
  });
});

describe('Typed', () => {
  it('shows the whole text at once when motion is reduced', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Typed>hello world</Typed>
      </MotionProvider>,
    );
    expect(lastFrame()).toBe('hello world');
  });

  it('shows the whole text once the section has been seen', () => {
    const { lastFrame } = render(
      <Entrance play={false}>
        <Typed>hello world</Typed>
      </Entrance>,
    );
    expect(lastFrame()).toBe('hello world');
  });

  it('types the text out, then drops the cursor', async () => {
    const { lastFrame } = render(<Typed cps={40}>hello world</Typed>);
    expect(lastFrame()).toBe('█');

    await wait(120);
    const partial = lastFrame()!;
    expect(partial.length).toBeGreaterThan(1);
    expect(partial).not.toContain('hello world');

    await wait(500);
    expect(lastFrame()).toBe('hello world');
  });

  it('waits for the delay before the first character', async () => {
    const { lastFrame } = render(
      <Typed cps={1000} delay={120}>
        hello
      </Typed>,
    );
    await wait(60);
    expect(lastFrame()).toBe('█');
    await wait(200);
    expect(lastFrame()).toBe('hello');
  });

  it('passes text styling through', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Typed bold>styled</Typed>
      </MotionProvider>,
    );
    expect(lastFrame()).toContain('styled');
  });
});
