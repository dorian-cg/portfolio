import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Decrypt, decryptText } from './decrypt';
import { Entrance, MotionProvider } from './motion';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('decryptText', () => {
  const text = 'TECHNICAL LEADERSHIP';

  it('keeps the length and the spaces', () => {
    for (const progress of [0, 0.3, 0.7]) {
      const out = decryptText(text, progress, 3);
      expect(out).toHaveLength(text.length);
      expect(out.charAt(9)).toBe(' ');
    }
  });

  it('is the real text once finished', () => {
    expect(decryptText(text, 1, 5)).toBe(text);
  });

  it('is scrambled at the start', () => {
    expect(decryptText(text, 0, 0)).not.toBe(text);
  });

  it('settles the characters from the left', () => {
    const out = decryptText(text, 0.5, 2);
    expect(out.slice(0, 10)).toBe(text.slice(0, 10));
    expect(out.slice(10)).not.toBe(text.slice(10));
  });

  it('is deterministic for a frame and changes between frames', () => {
    expect(decryptText(text, 0, 4)).toBe(decryptText(text, 0, 4));
    expect(decryptText(text, 0, 4)).not.toBe(decryptText(text, 0, 5));
  });
});

describe('Decrypt', () => {
  it('shows the real text at once when motion is reduced', () => {
    const { lastFrame } = render(
      <MotionProvider reduced>
        <Decrypt>SUMMARY</Decrypt>
      </MotionProvider>,
    );
    expect(lastFrame()).toBe('SUMMARY');
  });

  it('shows the real text once the section has been seen', () => {
    const { lastFrame } = render(
      <Entrance play={false}>
        <Decrypt>SUMMARY</Decrypt>
      </Entrance>,
    );
    expect(lastFrame()).toBe('SUMMARY');
  });

  it('starts scrambled and settles into the text', async () => {
    const { lastFrame } = render(<Decrypt duration={150}>SUMMARY</Decrypt>);
    expect(lastFrame()).toHaveLength('SUMMARY'.length);
    expect(lastFrame()).not.toBe('SUMMARY');

    await wait(400);
    expect(lastFrame()).toBe('SUMMARY');
  });
});
