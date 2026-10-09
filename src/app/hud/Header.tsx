import { Box, Text } from 'ink';
import { profile } from '../../content/profile';
import { openLink } from '../input/open-link';
import { Tap } from '../input/pointer';
import type { Layout } from '../layout';
import { hud } from './palette';
import { Uptime } from './Uptime';

/** nf-dev-github_badge, from the Nerd Font; it is in the font subset (scripts/build-fonts.mjs). */
export const GITHUB_ICON = '\ue709';

const github = profile.links.find((link) => link.label === 'GitHub')!;

/** `dorian-cg/portfolio` from `https://github.com/dorian-cg/portfolio`. */
export const githubName = new URL(github.url).pathname.slice(1);

export function Header({ layout }: { layout: Layout }) {
  const narrow = layout.mode === 'narrow';
  return (
    <Box justifyContent="space-between" paddingX={1} flexShrink={0}>
      <Text>
        <Text bold color={hud.bright}>
          DC//OS
        </Text>
        {layout.mode === 'wide' && <Text color={hud.dim}> · PORTFOLIO INTERFACE</Text>}
      </Text>
      {!narrow && <Uptime />}
      {/* The text has no scheme, so the terminal does not link it itself: every pointer is handled here. */}
      <Tap onTap={() => openLink(github.url)} slopX={1} slopY={1}>
        <Text color={hud.line}>
          <Text color={hud.bright}>{GITHUB_ICON}</Text> {githubName}
        </Text>
      </Tap>
    </Box>
  );
}
