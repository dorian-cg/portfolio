import { Box, Text } from 'ink';
import type { Layout } from '../layout';
import { hud } from './palette';

const hints = (layout: Layout): string =>
  layout.mode === 'narrow'
    ? '‹ › page · ↕ scroll'
    : layout.mode === 'medium'
      ? '←/→ section · ↑/↓ scroll'
      : '←/→ section · 1-5 jump · ↑/↓ scroll';

export function Footer({ layout }: { layout: Layout }) {
  return (
    <Box paddingX={1} justifyContent="center" flexShrink={0}>
      <Text color={hud.dim}>{hints(layout)}</Text>
    </Box>
  );
}
