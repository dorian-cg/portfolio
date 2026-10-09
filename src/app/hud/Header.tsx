import { Box, Text } from 'ink';
import { profile } from '../../content/profile';
import { openLink } from '../input/open-link';
import { Tap } from '../input/pointer';
import type { Layout } from '../layout';
import { useSound, useSoundEnabled, useSoundEngine } from '../sound';
import { hud } from './palette';
import { Uptime } from './Uptime';

/** nf-dev-github_badge, from the Nerd Font; it is in the font subset (scripts/build-fonts.mjs). */
export const GITHUB_ICON = '\ue709';

const github = profile.links.find((link) => link.label === 'GitHub')!;

/** `dorian-cg/portfolio` from `https://github.com/dorian-cg/portfolio`. */
export const githubName = new URL(github.url).pathname.slice(1);

/** The sound toggle: a note, struck through when muted. Both are in the font subset. */
export const SOUND_ON = '♪';
export const SOUND_OFF = '♪×';

export function Header({ layout }: { layout: Layout }) {
  const narrow = layout.mode === 'narrow';
  const engine = useSoundEngine();
  const soundOn = useSoundEnabled();
  const play = useSound();
  return (
    <Box justifyContent="space-between" paddingX={1} flexShrink={0}>
      <Text>
        <Text bold color={hud.bright}>
          DC//OS
        </Text>
        {layout.mode === 'wide' && <Text color={hud.dim}> · PORTFOLIO INTERFACE</Text>}
      </Text>
      {!narrow && <Uptime />}
      <Box columnGap={2}>
        {engine.available && (
          <Tap onTap={engine.toggle} slopX={1} slopY={1}>
            <Text color={soundOn ? hud.bright : hud.dim}>{soundOn ? SOUND_ON : SOUND_OFF}</Text>
          </Tap>
        )}
        {/* The text has no scheme, so the terminal does not link it itself: every pointer is handled here. */}
        <Tap
          onTap={() => {
            play('link');
            openLink(github.url);
          }}
          slopX={1}
          slopY={1}
        >
          <Text color={hud.line}>
            <Text color={hud.bright}>{GITHUB_ICON}</Text> {githubName}
          </Text>
        </Tap>
      </Box>
    </Box>
  );
}
