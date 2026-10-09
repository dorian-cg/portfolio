import { Box, Text } from 'ink';
import type { Layout } from '../layout';
import { useSoundEngine } from '../sound';
import { hud } from './palette';

const hints = (layout: Layout, sound: boolean): string =>
  layout.mode === 'narrow'
    ? '‹ › page · ↕ scroll'
    : layout.mode === 'medium'
      ? `←/→ section · ↑/↓ scroll${sound ? ' · m sound' : ''}`
      : `←/→ section · 1-5 jump · ↑/↓ scroll${sound ? ' · m sound' : ''}`;

export function Footer({ layout }: { layout: Layout }) {
  // A phone has no keyboard to press m on; the header toggle is there.
  const { available } = useSoundEngine();
  return (
    <Box paddingX={1} justifyContent="center" flexShrink={0}>
      <Text color={hud.dim}>{hints(layout, available)}</Text>
    </Box>
  );
}
