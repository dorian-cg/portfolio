import { Text, useAnimation } from 'ink';
import { useEffect, useState, type ComponentProps } from 'react';
import { useSound } from '../sound';
import { useEntrance } from './motion';

const GLYPHS = 'ABCDEF0123456789#$%&*<>/\\|=+';

/** A deterministic pseudo-random number in [0, 1) for a character position and animation frame. */
const noise = (index: number, frame: number): number => {
  let h = Math.imul(index + 1, 374761393) ^ Math.imul(frame + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * `text` part-way through decrypting: the first `progress` (0 to 1) of its
 * characters have settled, the rest are random glyphs that change every `frame`.
 * Spaces never scramble, so the shape of the text stays readable.
 */
export function decryptText(text: string, progress: number, frame: number): string {
  const settled = Math.floor(progress * text.length);
  return [...text]
    .map((char, index) =>
      index < settled || char === ' ' ? char : GLYPHS[Math.floor(noise(index, frame) * GLYPHS.length)],
    )
    .join('');
}

export type DecryptProps = {
  /** Milliseconds to wait before starting. */
  delay?: number;
  /** Milliseconds from the first scrambled glyph to the settled text. */
  duration?: number;
  children: string;
} & ComponentProps<typeof Text>;

/** Text that resolves from random glyphs into the real thing. */
export function Decrypt({ children, delay = 0, duration = 600, ...textProps }: DecryptProps) {
  const play = useEntrance() && children.length > 0;
  const [done, setDone] = useState(!play);
  const { time, frame } = useAnimation({ interval: 50, isActive: play && !done });

  const progress = Math.min(1, Math.max(0, time - delay) / duration);
  const finished = !play || done || progress >= 1;

  const sound = useSound();
  useEffect(() => {
    if (play && !done && time > delay) {
      sound('type');
    }
  }, [frame, play, done, time, delay, sound]);

  useEffect(() => {
    if (finished) {
      if (play && !done) {
        sound('settle');
      }
      setDone(true);
    }
  }, [finished, play, done, sound]);

  // Hold the scrambled look until the delay has passed.
  return <Text {...textProps}>{finished ? children : decryptText(children, progress, frame)}</Text>;
}
