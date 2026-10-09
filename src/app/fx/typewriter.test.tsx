import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { RecordingSound } from '../../sound/fake-audio';
import { SoundProvider } from '../sound';
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

describe('Typed sound', () => {
  const sound = (children: React.ReactNode, engine = new RecordingSound()) => {
    render(<SoundProvider engine={engine}>{children}</SoundProvider>);
    return engine;
  };

  it('ticks while it types, and not before its delay or once done', async () => {
    const engine = sound(
      <Typed cps={100} delay={200}>
        hello world
      </Typed>,
    );
    await wait(100);
    expect(engine.cues).toEqual([]);

    await wait(300);
    expect(engine.cues.length).toBeGreaterThan(0);
    expect(new Set(engine.cues)).toEqual(new Set(['type']));

    await wait(500);
    const total = engine.cues.length;
    await wait(300);
    expect(engine.cues).toHaveLength(total);
  });

  it('is silent when everything shows at once', async () => {
    const reduced = sound(
      <MotionProvider reduced>
        <Typed>hello world</Typed>
      </MotionProvider>,
    );
    const seen = sound(
      <Entrance play={false}>
        <Typed>hello world</Typed>
      </Entrance>,
    );
    await wait(200);
    expect(reduced.plays).toEqual([]);
    expect(seen.plays).toEqual([]);
  });
});

