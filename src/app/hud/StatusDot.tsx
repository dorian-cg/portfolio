import { Text, useAnimation } from 'ink';
import { useAmbientMotion } from '../fx/motion';
import { hud } from './palette';

/** How long the dot stays lit, and then dark, in ms. */
const BLINK_MS = 600;

/** The green status dot, blinking. Stays lit when motion is reduced. */
export function StatusDot() {
  const animated = useAmbientMotion();
  const { time } = useAnimation({ interval: 100, isActive: animated });
  const lit = !animated || Math.floor(time / BLINK_MS) % 2 === 0;
  // A space, not nothing, so the text beside it does not shift.
  return <Text color={hud.ok}>{lit ? '●' : ' '}</Text>;
}
