import { Box, Text } from 'ink';
import { Decrypt } from '../fx/decrypt';
import { Typed } from '../fx/typewriter';
import { hud } from './palette';

/** A section sub-heading: `▌ TITLE` in the accent colour, decrypting into place. */
export function Heading({ children, delay }: { children: string; delay?: number }) {
  return (
    <Text>
      <Text bold color={hud.accent}>
        ▌{' '}
      </Text>
      <Decrypt bold color={hud.accent} delay={delay} duration={500}>
        {children}
      </Decrypt>
    </Text>
  );
}

/**
 * A list whose items wrap under their own text, not under the marker. The
 * items type themselves out one after another, starting `delay` ms in.
 */
export function Bullets({ items, delay = 0 }: { items: readonly string[]; delay?: number }) {
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={item}>
          <Box width={2} flexShrink={0}>
            <Text color={hud.line}>›</Text>
          </Box>
          <Box flexShrink={1}>
            <Typed cps={300} delay={delay + index * 140}>
              {item}
            </Typed>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
