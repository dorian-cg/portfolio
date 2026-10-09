import { Box, Text } from 'ink';
import { profile } from '../../content/profile';
import { Emblem } from '../fx/emblem';
import { Globe } from '../fx/globe';
import type { Layout } from '../layout';
import { hud } from './palette';
import { StatusDot } from './StatusDot';
import { Uptime } from './Uptime';

const degrees = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(4)}°${value >= 0 ? positive : negative}`;

/** Name and role, with a small emblem beside them when there is room: for layouts without the full panel. */
export function IdentityStrip({ layout }: { layout: Layout }) {
  return (
    <Box paddingX={1} columnGap={2} flexShrink={0}>
      {layout.showEmblem && <Emblem columns={7} rows={3} />}
      <Box flexDirection="column" justifyContent="center">
        <Text bold color={hud.bright}>
          {profile.name.toUpperCase()}
        </Text>
        <Text>{profile.role}</Text>
        <Text color={hud.dim}>{profile.location}</Text>
      </Box>
    </Box>
  );
}

/** Name, role, location and status, with the emblem and globe when there is room. */
export function IdentityPanel({ layout }: { layout: Layout }) {
  const { lat, lon } = profile.coordinates;
  // The narrow header has no room for the uptime, so it lives here instead.
  return (
    <Box flexDirection="column" paddingX={1} gap={1}>
      {layout.showEmblem && (
        <Box justifyContent="center">
          <Emblem />
        </Box>
      )}
      <Box flexDirection="column">
        <Text bold color={hud.bright}>
          {profile.name.toUpperCase()}
        </Text>
        <Text>{profile.role}</Text>
      </Box>
      <Box flexDirection="column">
        <Text>
          <Text color={hud.accent}>◎ </Text>
          {degrees(lat, 'N', 'S')} {degrees(lon, 'E', 'W')}
        </Text>
        <Text color={hud.dim}>{profile.location}</Text>
      </Box>
      <Box flexDirection="column">
        <Text>
          <Text color={hud.dim}>STATUS </Text>
          <StatusDot />
          <Text color={hud.ok}> ONLINE</Text>
        </Text>
        <Text>
          <Text color={hud.dim}>AT     </Text>
          {profile.employer}
        </Text>
        {layout.mode === 'narrow' && <Uptime />}
      </Box>
      {layout.showGlobe && (
        <Box justifyContent="center">
          <Globe />
        </Box>
      )}
    </Box>
  );
}
