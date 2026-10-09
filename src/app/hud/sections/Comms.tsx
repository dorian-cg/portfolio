import { Box, Text } from 'ink';
import { profile } from '../../../content/profile';
import { Typed } from '../../fx/typewriter';
import { openLink } from '../../input/open-link';
import { Tap } from '../../input/pointer';
import { useSound } from '../../sound';
import { Heading } from '../parts';
import { hud } from '../palette';

// The URLs are plain text, which ghostty-web makes clickable for a mouse. A finger's tap does not
// reach its link detector, so taps from touch open the link here instead.
export function Comms() {
  const play = useSound();
  return (
    <Box flexDirection="column" gap={1}>
      <Heading>OPEN CHANNELS</Heading>
      {profile.links.map((link, index) => (
        <Tap
          key={link.label}
          flexDirection="column"
          slopY={1}
          ignore={(tap) => tap.pointerType === 'mouse'}
          onTap={() => {
            play('link');
            openLink(link.url);
          }}
        >
          <Text color={hud.bright}>{link.label}</Text>
          <Typed color={hud.line} underline cps={120} delay={300 + index * 700}>
            {link.url}
          </Typed>
        </Tap>
      ))}
      <Text color={hud.dim}>Click or tap a link to open it.</Text>
    </Box>
  );
}
