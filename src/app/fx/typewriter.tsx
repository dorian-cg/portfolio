import { Text, useAnimation } from 'ink';
import { useEffect, useState, type ComponentProps } from 'react';
import { hud } from '../hud/palette';
import { useSound } from '../sound';
import { useEntrance } from './motion';

/** How many characters are typed `elapsed` ms into an effect that starts after `delay` ms. */
export const typedCount = (elapsed: number, delay: number, cps: number): number =>
  Math.floor((Math.max(0, elapsed - delay) * cps) / 1000);

interface TypewriterOptions {
  /** Characters per second. */
  cps?: number;
  /** Milliseconds to wait before the first character. */
  delay?: number;
}

/** The text typed so far, and whether it is still typing. Shows everything at once when entrance effects are off. */
export function useTypewriter(text: string, { cps = 120, delay = 0 }: TypewriterOptions = {}) {
  const play = useEntrance() && text.length > 0;
  const [done, setDone] = useState(!play);
  const { time } = useAnimation({ interval: 33, isActive: play && !done });

  const count = typedCount(time, delay, cps);
  const finished = !play || done || count >= text.length;

  const sound = useSound();
  useEffect(() => {
    if (play && count > 0 && !done) {
      sound('type');
    }
  }, [count, play, done, sound]);

  useEffect(() => {
    if (finished) {
      setDone(true);
    }
  }, [finished]);

  return { text: finished ? text : text.slice(0, count), typing: !finished };
}

export type TypedProps = TypewriterOptions & ComponentProps<typeof Text> & { children: string };

/** Types its text out, with a block cursor while it does. Takes a plain string. */
export function Typed({ children, cps, delay, ...textProps }: TypedProps) {
  const { text, typing } = useTypewriter(children, { cps, delay });
  return (
    <Text {...textProps}>
      {text}
      {typing && <Text color={hud.accent}>█</Text>}
    </Text>
  );
}
