import { Text } from 'ink';
import { profile } from '../../content/profile';
import { useNow } from '../fx/clock';
import { formatUptime } from '../fx/uptime';
import { hud } from './palette';

const careerStart = new Date(profile.careerStart);

/** `UPTIME 9y 01m 07d 14:22:31`: time since the career began, ticking every second. */
export function Uptime() {
  const now = useNow();
  return (
    <Text>
      <Text color={hud.dim}>UPTIME </Text>
      <Text color={hud.line}>{formatUptime(careerStart, now)}</Text>
    </Text>
  );
}
